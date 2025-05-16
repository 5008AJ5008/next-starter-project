'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { put, del, list } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

type UpdateFormState = {
	message: string;
	status: 'success' | 'error';
} | null;

type DeleteAccountResponse = {
	success: boolean;
	error?: string;
};

type UploadState = {
	message: string;
	status: 'success' | 'error';
	imageUrl?: string | null;
} | null;

const profileSchema = z.object({
	name: z
		.string()
		.min(1, 'Name ist erforderlich')
		.max(20, 'Name zu lang')
		.optional()
		.or(z.literal('')),
	birthDate: z.preprocess((arg) => {
		if (!arg || typeof arg !== 'string' || arg === '') return null;
		try {
			return new Date(arg);
		} catch (error) {
			return null;
		}
	}, z.date().nullable().optional()),
	gender: z.string().max(50, 'Angabe zu lang').optional().or(z.literal('')),
	city: z.string().max(20, 'Stadtname zu lang').optional().or(z.literal('')),
	aboutMe: z.string().max(50, 'Text zu lang').optional().or(z.literal('')),
});

/**
 * Aktualisiert die Profildaten des aktuell angemeldeten Benutzers.
 * @param prevState Der vorherige Zustand des Formulars.
 * @param formData Die Formulardaten mit den zu aktualisierenden Profilinformationen.
 * @returns Ein Objekt, das den Status der Aktualisierung und eine Nachricht enthält.
 */
export async function updateProfile(
	prevState: UpdateFormState,
	formData: FormData
): Promise<UpdateFormState> {
	const session = await auth();
	if (!session?.user?.id) {
		return { message: 'Nicht autorisiert.', status: 'error' };
	}
	const userId = session.user.id;

	const formDataObject = Object.fromEntries(formData.entries());
	const validatedFields = profileSchema.safeParse(formDataObject);

	if (!validatedFields.success) {
		console.error(
			'Validation errors:',
			validatedFields.error.flatten().fieldErrors
		);
		return {
			message: 'Validierungsfehler. Bitte überprüfen Sie Ihre Eingaben.',
			status: 'error',
		};
	}

	try {
		await prisma.user.update({
			where: { id: userId },
			data: {
				name: validatedFields.data.name || null,
				birthDate: validatedFields.data.birthDate,
				gender: validatedFields.data.gender || null,
				city: validatedFields.data.city || null,
				aboutMe: validatedFields.data.aboutMe || null,
			},
		});

		revalidatePath('/profile/edit');

		return { message: 'Profil erfolgreich aktualisiert.', status: 'success' };
	} catch (error) {
		console.error('Database error:', error);
		return {
			message: 'Datenbankfehler. Bitte versuchen Sie es erneut.',
			status: 'error',
		};
	}
}

/**
 * Lädt ein Profilfoto für den aktuell angemeldeten Benutzer hoch und aktualisiert das Benutzerprofil.
 * Löscht das alte Foto, falls vorhanden.
 * @param prevState Der vorherige Zustand des Formulars.
 * @param formData Die Formulardaten, die das neue Profilbild enthalten.
 * @returns Ein Objekt, das den Status des Uploads, eine Nachricht und optional die URL des neuen Bildes enthält.
 */
export async function uploadProfilePhoto(
	prevState: UploadState,
	formData: FormData
): Promise<UploadState> {
	const session = await auth();
	if (!session?.user?.id) {
		return { message: 'Nicht autorisiert.', status: 'error' };
	}
	const userId = session.user.id;

	const file = formData.get('profileImage') as File | null;

	if (!file || file.size === 0) {
		return { message: 'Bitte wählen Sie eine Datei aus.', status: 'error' };
	}
	if (!file.type.startsWith('image/')) {
		return { message: 'Nur Bilddateien sind erlaubt.', status: 'error' };
	}
	const maxSize = 4.5 * 1024 * 1024;
	if (file.size > maxSize) {
		return {
			message: `Datei zu groß (max. ${
				Math.round((maxSize / 1024 / 1024) * 10) / 10
			}MB).`,
			status: 'error',
		};
	}

	let blob;
	try {
		const pathname = `user-photos/${userId}/${Date.now()}-${file.name}`;
		blob = await put(pathname, file, {
			access: 'public',
			addRandomSuffix: false,
		});

		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { image: true },
		});

		await prisma.user.update({
			where: { id: userId },
			data: { image: blob.url },
		});

		if (
			currentUser?.image &&
			currentUser.image !== blob.url &&
			currentUser.image.includes('blob.vercel-storage.com')
		) {
			try {
				await del(currentUser.image);
			} catch (delError) {
				console.error('Failed to delete old blob:', delError);
			}
		}

		revalidatePath('/profile/edit');
		revalidatePath('/');

		return {
			message: 'Foto erfolgreich hochgeladen.',
			status: 'success',
			imageUrl: blob.url,
		};
	} catch (error) {
		console.error('Upload/Database error:', error);
		if (blob) {
			try {
				await del(blob.url);
			} catch (delError) {
				console.error('Failed to delete blob after error:', delError);
			}
		}
		return {
			message: 'Fehler beim Hochladen oder Speichern des Fotos.',
			status: 'error',
		};
	}
}

/**
 * Löscht das Konto des aktuell angemeldeten Benutzers einschließlich aller zugehörigen Daten
 * wie Chats, Nachrichten und hochgeladene Dateien.
 * @returns Ein Objekt, das den Erfolg der Operation anzeigt oder einen Fehler enthält.
 */
export async function deleteCurrentUserAccount(): Promise<DeleteAccountResponse> {
	const session = await auth();

	if (!session?.user?.id) {
		console.error('deleteCurrentUserAccount: Nicht autorisiert.');
		return { success: false, error: 'Nicht autorisiert.' };
	}

	const userId = session.user.id;

	try {
		await prisma.$transaction(async (tx) => {
			const userChatParticipations = await tx.chatParticipant.findMany({
				where: { userId },
				select: { chatId: true },
			});

			const chatIdsToDelete = userChatParticipations.map((p) => p.chatId);

			if (chatIdsToDelete.length > 0) {
				await tx.chat.deleteMany({
					where: { id: { in: chatIdsToDelete } },
				});
				console.log(
					`Chats ${chatIdsToDelete.join(
						', '
					)} wurden für Benutzer ${userId} gelöscht.`
				);
			}

			try {
				const userBlobs = await list({ prefix: `user-photos/${userId}/` });
				for (const blob of userBlobs.blobs) {
					await del(blob.url);
					console.log(
						`Datei ${blob.pathname} wurde aus Vercel Blob für Benutzer ${userId} gelöscht.`
					);
				}
			} catch (blobError) {
				console.error(
					`Fehler beim Löschen von Dateien aus Vercel Blob für Benutzer ${userId}:`,
					blobError
				);
			}

			await tx.user.delete({
				where: { id: userId },
			});
			console.log(`Benutzerprofil ${userId} erfolgreich gelöscht.`);
		});

		revalidatePath('/');
		revalidatePath('/chat');

		return { success: true };
	} catch (error) {
		console.error('Fehler beim Löschen des Benutzerprofils:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unbekannter Fehler.';
		return {
			success: false,
			error: `Fehler beim Löschen des Profils: ${errorMessage}`,
		};
	}
}

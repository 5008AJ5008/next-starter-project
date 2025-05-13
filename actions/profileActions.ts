'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// --- Типи стану для відповідей ---

// Тип для стану форми оновлення текстових даних
type UpdateFormState = {
	message: string;
	status: 'success' | 'error';
} | null;

// Тип для стану форми завантаження фото
type UploadState = {
	message: string;
	status: 'success' | 'error';
	imageUrl?: string | null;
} | null;

// --- Server Action для оновлення текстових даних профілю ---

// Схема валідації для даних форми профілю
const profileSchema = z.object({
	name: z
		.string()
		.min(1, 'Name ist erforderlich')
		.max(100, 'Name zu lang')
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
	city: z.string().max(100, 'Stadtname zu lang').optional().or(z.literal('')),
	aboutMe: z.string().max(1000, 'Text zu lang').optional().or(z.literal('')),
});

// Переконайтеся, що ця функція експортована!
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
		// revalidatePath('/profile'); // Якщо є сторінка перегляду

		return { message: 'Profil erfolgreich aktualisiert.', status: 'success' };
	} catch (error) {
		console.error('Database error:', error);
		return {
			message: 'Datenbankfehler. Bitte versuchen Sie es erneut.',
			status: 'error',
		};
	}
}

// --- Server Action для завантаження фото профілю ---

// Схема валідації для файлу (можна залишити простою)
// const fileSchema = z.instanceof(File);

// Переконайтеся, що ця функція також експортована!
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

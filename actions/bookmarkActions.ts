'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type ToggleBookmarkResponse = {
	success: boolean;
	isBookmarked?: boolean;
	error?: string;
	message?: string;
};

/**
 * Fügt einen Benutzer zu den Lesezeichen des aktuellen Benutzers hinzu oder entfernt ihn daraus.
 * @param bookmarkedUserId ID des Benutzers, der zu den Lesezeichen hinzugefügt/entfernt wird.
 */
export async function toggleBookmark(
	bookmarkedUserId: string
): Promise<ToggleBookmarkResponse> {
	const session = await auth();

	if (!session?.user?.id) {
		return { success: false, error: 'Nicht autorisiert.' };
	}

	const bookmarkerId = session.user.id;

	if (bookmarkerId === bookmarkedUserId) {
		return {
			success: false,
			error: 'Sie können sich nicht selbst zu Lesezeichen hinzufügen.',
		};
	}

	try {
		const existingBookmark = await prisma.bookmark.findUnique({
			where: {
				bookmarkerId_bookmarkedUserId: {
					bookmarkerId,
					bookmarkedUserId,
				},
			},
		});

		if (existingBookmark) {
			await prisma.bookmark.delete({
				where: {
					id: existingBookmark.id,
				},
			});
			revalidatePath(`/users/${bookmarkedUserId}`);
			revalidatePath('/bookmarks');
			return {
				success: true,
				isBookmarked: false,
				message: 'Lesezeichen entfernt.',
			};
		} else {
			await prisma.bookmark.create({
				data: {
					bookmarkerId,
					bookmarkedUserId,
				},
			});
			revalidatePath(`/users/${bookmarkedUserId}`);
			revalidatePath('/bookmarks');
			return {
				success: true,
				isBookmarked: true,
				message: 'Zu Lesezeichen hinzugefügt.',
			};
		}
	} catch (error) {
		console.error('Fehler beim Umschalten des Lesezeichens:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unbekannter Fehler.';
		return { success: false, error: `Fehler: ${errorMessage}` };
	}
}

/**
 * Überprüft, ob der aktuell authentifizierte Benutzer einen anderen Benutzer mit einem Lesezeichen versehen hat.
 * @param bookmarkedUserId ID des zu überprüfenden Benutzers.
 * @returns true, wenn der Benutzer mit einem Lesezeichen versehen ist, andernfalls false.
 */
export async function isBookmarked(bookmarkedUserId: string): Promise<boolean> {
	const session = await auth();

	if (!session?.user?.id) {
		return false;
	}

	const bookmarkerId = session.user.id;

	if (bookmarkerId === bookmarkedUserId) {
		return false;
	}

	try {
		const bookmark = await prisma.bookmark.findUnique({
			where: {
				bookmarkerId_bookmarkedUserId: {
					bookmarkerId,
					bookmarkedUserId,
				},
			},
		});
		return Boolean(bookmark);
	} catch (error) {
		console.error('Fehler beim Überprüfen des Lesezeichenstatus:', error);
		return false;
	}
}

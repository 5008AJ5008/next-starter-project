'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Тип для відповіді від toggleBookmark
type ToggleBookmarkResponse = {
	success: boolean;
	isBookmarked?: boolean; // Повертаємо новий стан закладки
	error?: string;
	message?: string; // Додаткове повідомлення для користувача
};

/**
 * Додає або видаляє користувача із закладок поточного користувача.
 * @param bookmarkedUserId ID користувача, якого додають/видаляють із закладок.
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
		}; // Ви не можете додати себе в закладки
	}

	try {
		// Перевіряємо, чи існує вже така закладка
		const existingBookmark = await prisma.bookmark.findUnique({
			where: {
				bookmarkerId_bookmarkedUserId: {
					// Використовуємо унікальний складений ключ
					bookmarkerId,
					bookmarkedUserId,
				},
			},
		});

		if (existingBookmark) {
			// Якщо закладка існує, видаляємо її
			await prisma.bookmark.delete({
				where: {
					id: existingBookmark.id,
				},
			});
			// Ревалідуємо шляхи, де може відображатися стан закладки
			revalidatePath(`/users/${bookmarkedUserId}`); // Сторінка профілю користувача
			revalidatePath('/bookmarks'); // Сторінка закладок
			return {
				success: true,
				isBookmarked: false,
				message: 'Lesezeichen entfernt.',
			}; // Закладку видалено
		} else {
			// Якщо закладки немає, створюємо її
			await prisma.bookmark.create({
				data: {
					bookmarkerId,
					bookmarkedUserId,
				},
			});
			// Ревалідуємо шляхи
			revalidatePath(`/users/${bookmarkedUserId}`);
			revalidatePath('/bookmarks');
			return {
				success: true,
				isBookmarked: true,
				message: 'Zu Lesezeichen hinzugefügt.',
			}; // Додано до закладок
		}
	} catch (error) {
		console.error('Fehler beim Umschalten des Lesezeichens:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unbekannter Fehler.';
		return { success: false, error: `Fehler: ${errorMessage}` };
	}
}

/**
 * Перевіряє, чи додав поточний авторизований користувач іншого користувача в закладки.
 * @param bookmarkedUserId ID користувача, якого перевіряють.
 * @returns true, якщо користувач у закладках, інакше false.
 */
export async function isBookmarked(bookmarkedUserId: string): Promise<boolean> {
	const session = await auth();

	if (!session?.user?.id) {
		return false; // Неавторизовані користувачі не мають закладок
	}

	const bookmarkerId = session.user.id;

	if (bookmarkerId === bookmarkedUserId) {
		return false; // Не можна додати себе в закладки
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
		return Boolean(bookmark); // Повертає true, якщо закладка існує, інакше false
	} catch (error) {
		console.error('Fehler beim Überprüfen des Lesezeichenstatus:', error);
		return false; // У разі помилки вважаємо, що не в закладках
	}
}

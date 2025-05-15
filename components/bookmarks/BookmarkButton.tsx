'use client';

import { useState, useTransition } from 'react';
import { toggleBookmark } from '@/actions/bookmarkActions'; // Переконайтеся, що шлях правильний
import { FaStar, FaRegStar } from 'react-icons/fa'; // Іконки зірочок з react-icons

type BookmarkButtonProps = {
	bookmarkedUserId: string;
	initialIsBookmarked: boolean;
	currentUserId?: string; // ID поточного авторизованого користувача
};

export default function BookmarkButton({
	bookmarkedUserId,
	initialIsBookmarked,
	currentUserId,
}: BookmarkButtonProps) {
	const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
	const [isPending, startTransition] = useTransition(); // Для оптимістичного оновлення та індикації завантаження

	// Не показуємо кнопку, якщо це профіль самого користувача або користувач не авторизований
	if (!currentUserId || currentUserId === bookmarkedUserId) {
		return null;
	}

	const handleToggleBookmark = async () => {
		startTransition(async () => {
			// Оптимістичне оновлення UI
			setIsBookmarked(!isBookmarked);
			const response = await toggleBookmark(bookmarkedUserId);
			if (!response.success) {
				// Якщо сталася помилка, повертаємо попередній стан
				setIsBookmarked(isBookmarked);
				// Тут можна показати повідомлення про помилку користувачеві
				console.error(
					response.error || 'Fehler beim Umschalten des Lesezeichens.'
				);
				alert(
					response.error ||
						'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.'
				);
			} else {
				// Оновлюємо стан на основі відповіді сервера, якщо потрібно
				// У нашому випадку, оптимістичне оновлення вже зробило це,
				// але можна перевірити response.isBookmarked
				if (typeof response.isBookmarked === 'boolean') {
					setIsBookmarked(response.isBookmarked);
				}
				// console.log(response.message);
			}
		});
	};

	return (
		<button
			onClick={handleToggleBookmark}
			disabled={isPending}
			// Додайте ваші CSS класи для кнопки
			className="bookmark-button p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
			aria-label={
				isBookmarked ? 'Aus Lesezeichen entfernen' : 'Zu Lesezeichen hinzufügen'
			}
			title={
				isBookmarked ? 'Aus Lesezeichen entfernen' : 'Zu Lesezeichen hinzufügen'
			}
		>
			{isPending ? (
				<span className="loading-spinner"></span> // Додайте CSS для спінера завантаження
			) : isBookmarked ? (
				<FaStar size={24} className="text-yellow-500" /> // Заповнена зірочка
			) : (
				<FaRegStar size={24} className="text-gray-500" /> // Порожня зірочка
			)}
		</button>
	);
}

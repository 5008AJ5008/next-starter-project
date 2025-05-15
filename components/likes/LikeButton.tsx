'use client';

import { useState, useTransition } from 'react';
// Переконайтеся, що шлях до likeActions правильний
import { togglePhotoLike } from '@/actions/likeActions';
// Іконки для лайків (наприклад, сердечка)
import { FaHeart, FaRegHeart } from 'react-icons/fa'; // Або інші іконки на ваш вибір

type LikeButtonProps = {
	likedUserId: string; // ID користувача, чий профіль/фото лайкають
	initialIsLiked: boolean; // Початковий стан: чи лайкнув поточний користувач цього користувача
	currentUserId?: string; // ID поточного авторизованого користувача
	// onLikeToggle?: (isLiked: boolean, isMatch?: boolean, chatId?: string) => void; // Callback при зміні стану
};

export default function LikeButton({
	likedUserId,
	initialIsLiked,
	currentUserId,
}: // onLikeToggle,
LikeButtonProps) {
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [isPending, startTransition] = useTransition();

	// Не показуємо кнопку, якщо це профіль самого користувача або користувач не авторизований
	if (!currentUserId || currentUserId === likedUserId) {
		return null;
	}

	const handleToggleLike = async () => {
		startTransition(async () => {
			const newIsLikedState = !isLiked;
			// Оптимістичне оновлення UI
			setIsLiked(newIsLikedState);

			const response = await togglePhotoLike(likedUserId);

			if (!response.success) {
				// Якщо сталася помилка, повертаємо попередній стан
				setIsLiked(!newIsLikedState);
				console.error(response.error || 'Fehler beim Umschalten des Likes.');
				alert(
					response.error ||
						'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.'
				);
			} else {
				// Оновлюємо стан на основі відповіді сервера
				// (може бути корисним, якщо isLiked змінився через іншу дію)
				if (typeof response.isLiked === 'boolean') {
					setIsLiked(response.isLiked);
				}
				console.log(response.message);
				// // Викликаємо callback, якщо він є, передаючи інформацію про метч та chatId
				// if (onLikeToggle) {
				// 	onLikeToggle(
				// 		response.isLiked ?? false,
				// 		response.isMatch,
				// 		response.chatId
				// 	);
				// }
				// Логіка для onLikeToggle видалена звідси.
				// Якщо потрібно реагувати на метч на клієнті (наприклад, показати alert або кнопку переходу до чату),
				// Server Action togglePhotoLike може повертати isMatch та chatId,
				// і цей компонент може оновити якийсь глобальний стан або показати тимчасове повідомлення.
				// Наразі, системне повідомлення в чаті є основною реакцією на метч.
				if (response.isMatch && response.chatId) {
					// Тут можна, наприклад, показати сповіщення "Es ist ein Match!"
					// Або навіть запропонувати перейти до чату.
					// Для простоти, поки що тільки логуємо.
					console.log(
						`CLIENT: Match! Chat ID: ${response.chatId}. Consider UI update.`
					);
					// Наприклад, можна було б використати useRouter для переходу:
					// import { useRouter } from 'next/navigation';
					// const router = useRouter();
					// router.push(`/chat/${response.chatId}`);
					// Але це потрібно робити обережно, щоб не переривати користувача.
				}
			}
		});
	};

	return (
		<button
			onClick={handleToggleLike}
			disabled={isPending}
			// Додайте ваші CSS класи для кнопки
			className="like-button p-2 rounded-full hover:bg-pink-100 disabled:opacity-50"
			aria-label={isLiked ? 'Like entfernen' : 'Like hinzufügen'}
			title={isLiked ? 'Like entfernen' : 'Like hinzufügen'}
		>
			{isPending ? (
				<span className="loading-spinner"></span> // Додайте CSS для спінера завантаження
			) : isLiked ? (
				<FaHeart size={24} className="text-red-500" /> // Заповнене сердечко
			) : (
				<FaRegHeart size={24} className="text-gray-500" /> // Порожнє сердечко
			)}
		</button>
	);
}

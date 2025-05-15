import type { Metadata, ResolvingMetadata } from 'next';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createOrFindChatAndRedirect } from '@/actions/chatActions';
import BookmarkButton from '@/components/bookmarks/BookmarkButton'; // Переконайтеся, що шлях правильний
import { isBookmarked } from '@/actions/bookmarkActions'; // Переконайтеся, що шлях правильний
import LikeButton from '@/components/likes/LikeButton'; // Переконайтеся, що шлях правильний
import { hasUserLiked } from '@/actions/likeActions'; // Переконайтеся, що шлях правильний

// Допоміжна функція для розрахунку віку
function calculateAge(birthDate: Date | null): number | null {
	if (!birthDate) return null;
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDifference = today.getMonth() - birth.getMonth();
	if (
		monthDifference < 0 ||
		(monthDifference === 0 && today.getDate() < birth.getDate())
	) {
		age--;
	}
	return age;
}

// Тип Props для сторінки, де params є Promise
type Props = {
	// params тепер очікується як Promise, що містить об'єкт з userId
	params: Promise<{ userId: string }>;
	// searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Якщо searchParams також асинхронні
};

// Функція для генерації динамічних метаданих
export async function generateMetadata(
	{ params: paramsPromise }: Props, // Деструктуруємо params і перейменовуємо на paramsPromise
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	parent: ResolvingMetadata
): Promise<Metadata> {
	// Очікуємо розв'язання Promise, щоб отримати об'єкт параметрів
	const params = await paramsPromise;
	const userId = params.userId;

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true },
	});

	if (!user) {
		return {
			title: 'Profil nicht gefunden',
		};
	}

	return {
		title: user.name ? `${user.name}s Profil` : 'Benutzerprofil',
	};
}

// Основний компонент сторінки
export default async function UserProfilePage({
	params: paramsPromise,
}: Props) {
	// Деструктуруємо params і перейменовуємо на paramsPromise
	// Очікуємо розв'язання Promise, щоб отримати об'єкт параметрів
	const params = await paramsPromise;
	const userId = params.userId;

	const session = await auth();
	const isAuthenticated = Boolean(session?.user);
	const currentUserId = session?.user?.id;

	// --- ОБМЕЖЕННЯ ДОСТУПУ ДЛЯ НЕАВТОРИЗОВАНИХ ---
	if (!isAuthenticated) {
		// Перенаправляємо на сторінку входу, зберігаючи поточний URL для повернення
		const params = await paramsPromise; // Потрібно отримати userId для callbackUrl
		const viewedUserId = params.userId;
		redirect(`/api/auth/signin?callbackUrl=/users/${viewedUserId}`);
	}
	// ------------------------------------------

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			// email: isAuthenticated, // email вже буде доступний, оскільки isAuthenticated=true
			email: true, // Можна просто завантажувати email, якщо користувач вже пройшов перевірку
			image: true,
			birthDate: true,
			gender: true,
			city: true,
			aboutMe: true,
		},
	});

	if (!user) {
		notFound();
	}

	const age = calculateAge(user.birthDate);

	// 2. Отримуємо початковий стан закладки
	let initialIsBookmarked = false;
	let initialIsLiked = false;

	if (currentUserId && currentUserId !== userId) {
		initialIsBookmarked = await isBookmarked(userId);
		initialIsLiked = await hasUserLiked(userId); // Отримуємо стан лайка
	}

	const startChatAction = createOrFindChatAndRedirect.bind(null, user.id);

	return (
		// Замість Tailwind класів для контейнера, можна використовувати ваш default-layout,
		// або додати класи, які ви визначите в CSS
		<main className="container mx-auto px-4 py-8">
			{' '}
			{/* Цей контейнер можна залишити, якщо він працює */}
			{/* Додаємо inline-стилі для обмеження ширини та центрування */}
			<div
				className="profile-container" // Ви можете залишити цей клас для інших стилів (тінь, фон, заокруглення)
				style={{
					position: 'relative', // Важливо для абсолютно позиціонованих дочірніх елементів
					maxWidth: '42rem', // Еквівалент max-w-2xl
					marginLeft: 'auto', // Центрування
					marginRight: 'auto', // Центрування
					backgroundColor: 'white', // Приклад стилю, якщо не задано класом
					boxShadow:
						'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Приклад тіні
					borderRadius: '0.5rem', // Приклад заокруглення
					overflow: 'hidden', // Важливо, щоб обрізати вміст, що виходить за межі
				}}
			>
				{/* Фото профілю */}
				<div
					className="profile-image-container" // Цей клас тепер може містити тільки width: 100% у CSS
					// Повертаємо paddingTop для співвідношення сторін, overflow: 'hidden' не потрібен тут, якщо Image не виходить за межі
					style={{ position: 'relative', width: '100%', paddingTop: '75%' }} // Співвідношення сторін 4:3. Для квадрата '100%'
				>
					{user.image ? (
						<Image
							src={user.image}
							alt={`Profilbild von ${user.name || 'Benutzer'}`}
							fill
							style={{ objectFit: 'contain' }} // Залишаємо 'contain', щоб зображення не обрізалося
							sizes="(max-width: 42rem) 100vw, 42rem" // Адаптуємо sizes під maxWidth контейнера
						/>
					) : (
						// Використовуємо CSS клас 'profile-image-placeholder' або inline-стилі
						// Цей блок має бути абсолютно позиціонований, щоб заповнити простір, створений paddingTop
						<div
							className="profile-image-placeholder"
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: '#D1D5DB',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<span style={{ color: '#6B7280' }}>Kein Profilbild</span>
						</div>
					)}
				</div>

				{/* Використовуємо CSS клас 'profile-content' або inline-стилі */}
				<div className="profile-content" style={{ padding: '1.5rem' }}>
					<div className="name_and_bookmark">
						{/* Залишаємо Tailwind класи для тексту, або замінюємо на ваші CSS */}
						<h1 className="text-3xl font-bold text-gray-800 mb-1">
							{user.name || 'Unbekannter Benutzer'}
							{age && <span className="text-2xl text-gray-600">, {age}</span>}
						</h1>
						{/* 3. Додаємо BookmarkButton */}
						{isAuthenticated && currentUserId !== userId && (
							<BookmarkButton
								bookmarkedUserId={userId}
								initialIsBookmarked={initialIsBookmarked}
								currentUserId={currentUserId}
							/>
						)}
						{/* 4. Додаємо LikeButton */}
						{isAuthenticated && currentUserId !== userId && (
							<LikeButton
								likedUserId={userId}
								initialIsLiked={initialIsLiked}
								currentUserId={currentUserId}
								// Передаємо callback, хоча його обробка має бути на клієнті
								// Для серверного компонента ця функція не зможе викликати alert/redirect
							/>
						)}
					</div>

					{(user.city || user.gender) && (
						<p className="text-md text-gray-600 mb-4">
							{user.city}
							{user.city && user.gender && ', '}
							{user.gender}
						</p>
					)}

					{user.aboutMe && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-700 mb-2">
								Über mich
							</h2>
							<p className="text-gray-600 whitespace-pre-wrap">
								{user.aboutMe}
							</p>
						</div>
					)}

					{currentUserId !== user.id && ( // Показуємо тільки якщо авторизований І це не власний профіль
						<div className="mt-6 pt-4 border-t border-gray-200">
							{' '}
							{/* Приклад Tailwind, замініть на ваші класи */}
							<form action={startChatAction}>
								{' '}
								{/* Викликаємо Server Action */}
								<button
									type="submit"
									// Додайте ваші класи для кнопки
									className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
								>
									Nachricht senden
								</button>
							</form>
							{/* Можна залишити кнопку Like окремо, якщо її логіка інша і вона не є Server Action */}
							{/* <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
                Like
              </button> */}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}

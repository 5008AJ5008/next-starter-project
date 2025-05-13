import type { Metadata } from 'next';
import { auth } from '@/auth'; // Функція для отримання сесії
import prisma from '@/lib/prisma'; // Ваш Prisma Client
import Image from 'next/image';
// import Link from 'next/link'; // Для посилань на детальні профілі (в майбутньому для авторизованих)
import SignIn from '@/components/Auth/SignIn';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Startseite', // Оновлений заголовок для головної
};

// Допоміжна функція для розрахунку віку
// function calculateAge(birthDate: Date | null): number | null {
// 	if (!birthDate) return null;
// 	const today = new Date();
// 	const birth = new Date(birthDate);
// 	let age = today.getFullYear() - birth.getFullYear();
// 	const monthDifference = today.getMonth() - birth.getMonth();
// 	if (
// 		monthDifference < 0 ||
// 		(monthDifference === 0 && today.getDate() < birth.getDate())
// 	) {
// 		age--;
// 	}
// 	return age;
// }

export default async function HomePage() {
	const session = await auth();
	const currentUserId = session?.user?.id;
	const isAuthenticated = Boolean(session?.user);

	// Отримуємо користувачів
	const users = await prisma.user.findMany({
		where: {
			NOT: {
				// Виключаємо поточного користувача, якщо він авторизований
				id: currentUserId || undefined,
			},
			// Показуємо тільки профілі, де є фотографія АБО ім'я
			// (щоб уникнути показу повністю порожніх профілів)
			OR: [
				{
					// Умова для імені: ім'я не null І ім'я не порожній рядок
					AND: [{ name: { not: null } }, { name: { not: '' } }],
				},
				{
					// Умова для зображення: зображення не null І зображення не порожній рядок
					AND: [{ image: { not: null } }, { image: { not: '' } }],
				},
			],
			// Можна додати інші умови, наприклад, щоб профіль був "активним" або "повністю заповненим"
		},
		select: {
			id: true,
			image: true,
			// Для авторизованих користувачів завантажуємо більше даних
			...(isAuthenticated && {
				name: true,
				birthDate: true,
				city: true,
				aboutMe: true,
				// gender: true, // Можна додати, якщо потрібно
			}),
		},
		orderBy: {
			// Можна додати сортування, наприклад, за датою останньої активності (якщо є таке поле)
			// або випадкове сортування (складніше з Prisma без розширень)
			// Поки що сортуємо за ім'ям для прикладу, якщо воно є
			name: 'asc',
		},
		take: 50, // Обмежимо кількість для початку
	});

	return (
		<main className="container mx-auto px-4 py-8">
			{!isAuthenticated && (
				<div className="text-center mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h1 className="text-2xl font-semibold text-blue-700">Willkommen!</h1>
					<p className="text-blue-600 mt-2">
						Entdecke Profile und verbinde dich. Melde dich an, um mehr Details
						zu sehen und zu interagieren.
					</p>
					<div className="mt-4">
						{/* Ваш компонент SignIn, як ви вказали в попередньому коді */}
						<SignIn />
					</div>
				</div>
			)}
			{isAuthenticated && (
				<h1 className="text-3xl font-bold mb-8 text-center">
					Entdecke andere Profile
				</h1>
			)}

			{users.length === 0 && (
				<p className="text-center text-gray-500 mt-10">
					Momentan gibt es keine anderen Profile zum Anzeigen.
				</p>
			)}

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
				{users.map((user) => {
					// Розрахунок віку більше не потрібен, оскільки текстові деталі не відображаються
					// const age = isAuthenticated ? calculateAge(user.birthDate) : null;

					// Вміст картки користувача (фото)
					const userCardContent = (
						<div
							className="relative w-full"
							style={{ position: 'relative', paddingTop: '100%' }} // Квадратне співвідношення сторін
						>
							{user.image ? (
								<Image
									src={user.image}
									// alt текст тепер залежить від isAuthenticated та наявності user.name
									// Потрібно переконатися, що user.name завантажується, якщо isAuthenticated
									alt={
										isAuthenticated && user.name
											? `Profilbild von ${user.name}`
											: 'Profilbild'
									}
									fill
									style={{ objectFit: 'cover' }}
									sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
									className="transition-transform duration-300 group-hover:scale-110" // Ефект при наведенні
								/>
							) : (
								<div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
									<span className="text-gray-500">Kein Bild</span>
								</div>
							)}
						</div>
					);

					return (
						<div
							key={user.id}
							className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 group"
						>
							{/* --- ЗМІНИ ТУТ --- */}
							{isAuthenticated ? (
								// Для авторизованих користувачів фото є посиланням
								<Link
									href={`/users/${user.id}`}
									aria-label={
										user.name
											? `Profil von ${user.name} ansehen`
											: 'Profil ansehen'
									}
								>
									{userCardContent}
								</Link>
							) : (
								// Для неавторизованих користувачів фото не є посиланням
								userCardContent
							)}
							{/* --- КІНЕЦЬ ЗМІН --- */}
						</div>
					);
				})}
			</div>
		</main>
	);
}
///////////////////////////////////

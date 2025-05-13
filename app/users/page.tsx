import type { Metadata } from 'next';
import { auth } from '@/auth'; // Функція для отримання сесії
import prisma from '@/lib/prisma'; // Ваш Prisma Client
import Image from 'next/image';
// import Link from 'next/link'; // Для посилань на детальні профілі (в майбутньому)

export const metadata: Metadata = {
	title: 'Benutzer entdecken', // Знайти користувачів / Переглянути профілі
};

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

export default async function UsersPage() {
	const session = await auth();
	const currentUserId = session?.user?.id;

	// Отримуємо всіх користувачів, крім поточного (якщо він авторизований)
	// і тільки тих, хто заповнив хоча б ім'я або фото (щоб не показувати порожні профілі)
	const users = await prisma.user.findMany({
		where: {
			NOT: {
				id: currentUserId || undefined, // Виключаємо поточного користувача
			},
			// Оновлена умова OR:
			// Показувати, якщо (ім'я не null І ім'я не порожнє) АБО (зображення не null І зображення не порожнє)
			OR: [
				{
					AND: [
						// Умови для імені
						{ name: { not: null } },
						{ name: { not: '' } },
					],
				},
				{
					AND: [
						// Умови для зображення
						{ image: { not: null } },
						{ image: { not: '' } },
					],
				},
			],
			// Можна додати інші фільтри, наприклад, щоб birthDate було заповнено
			// birthDate: { not: null }
		},
		select: {
			id: true,
			name: true,
			image: true,
			birthDate: true,
			city: true,
			aboutMe: true,
			gender: true,
		},
		orderBy: {
			// Можна додати сортування, наприклад, за датою створення (якщо є таке поле)
			// або випадкове сортування (складніше з Prisma без розширень)
			// Поки що без явного сортування, крім того, що дає БД
			name: 'asc', // Для прикладу, сортуємо за ім'ям
		},
		take: 50, // Обмежимо кількість для початку
	});

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center">
				Entdecke andere Profile
			</h1>{' '}
			{/* Знайти інші профілі */}
			{users.length === 0 && (
				<p className="text-center text-gray-500">
					Momentan gibt es keine anderen Profile zum Anzeigen.{' '}
					{/* На даний момент немає інших профілів для відображення. */}
				</p>
			)}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{users.map((user) => {
					const age = calculateAge(user.birthDate);
					return (
						// Додаємо 'relative' до самої картки
						<div
							key={user.id}
							className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105"
						>
							{/* Контейнер для зображення зі співвідношенням сторін через padding-top */}
							{/* Цей div вже має 'relative', що є правильним для next/image з fill */}
							<div
								className="relative w-full"
								style={{ position: 'relative', paddingTop: '100%' }} // 100% для квадрата
							>
								{' '}
								{/* 100% для квадрата */}
								{user.image ? (
									<Image
										src={user.image}
										alt={`Profilbild von ${user.name || 'Benutzer'}`}
										fill
										style={{ objectFit: 'cover' }} // Заповнює контейнер, зберігаючи пропорції та обрізаючи зайве
										sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
									/>
								) : (
									<div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
										<span className="text-gray-500">Kein Bild</span>
									</div>
								)}
							</div>
							<div className="p-4 flex flex-col flex-grow">
								<h2 className="text-xl font-semibold text-gray-800 mb-1 truncate">
									{user.name || 'Unbekannter Benutzer'}
									{age ? `, ${age}` : ''}
								</h2>
								{user.city && (
									<p className="text-sm text-gray-600 mb-1 truncate">
										{user.city}
									</p>
								)}
								{user.aboutMe && (
									<p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden text-ellipsis">
										{user.aboutMe}
									</p>
								)}
								<div className="mt-auto">
									{/* <Link href={`/users/${user.id}`}>
                    <a className="text-blue-500 hover:text-blue-600 font-medium">Profil ansehen</a>
                  </Link> */}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</main>
	);
}

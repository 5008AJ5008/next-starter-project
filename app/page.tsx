import type { Metadata } from 'next';
import { auth } from '@/auth'; // Функція для отримання сесії
import prisma from '@/lib/prisma'; // Ваш Prisma Client
import Image from 'next/image';
// import Link from 'next/link'; // Для посилань на детальні профілі (в майбутньому для авторизованих)
import SignIn from '@/components/Auth/SignIn';
import Link from 'next/link';
import UserFilters from '@/components/filters/UserFilters'; // Переконайтеся, що шлях правильний
import { Prisma } from '@prisma/client';

export const metadata: Metadata = {
	title: 'Next Starter', // Оновлений заголовок для головної
};

// Оновлюємо тип для HomePageProps, щоб searchParams був Promise
type HomePageProps = {
	searchParams?: Promise<{
		// searchParams тепер є Promise
		city?: string;
		minAge?: string;
		maxAge?: string;
		gender?: string;
	}>;
};

// Допоміжна функція для розрахунку дати народження на основі віку
function getDateFromAge(age: number): Date {
	const today = new Date();
	// Віднімаємо вік від поточного року, місяць і день залишаємо поточними
	// Це дасть нам дату, коли людина святкувала свій останній день народження цього року або минулого
	today.setFullYear(today.getFullYear() - age);
	return today;
}

export default async function HomePage({
	searchParams: searchParamsPromise,
}: HomePageProps) {
	const session = await auth();
	const currentUserId = session?.user?.id;
	const isAuthenticated = Boolean(session?.user);

	// Очікуємо searchParams, якщо вони є
	const searchParams = searchParamsPromise ? await searchParamsPromise : {};

	// Формуємо масив умов для AND
	const andConditions: Prisma.UserWhereInput[] = [
		{ image: { not: null } }, // Зображення не повинно бути null
		{ image: { not: '' } }, // Зображення не повинно бути порожнім рядком
	];

	if (searchParams?.city) {
		andConditions.push({
			city: {
				contains: searchParams.city,
				mode: 'insensitive',
			},
		});
	}

	if (searchParams?.gender) {
		andConditions.push({ gender: searchParams.gender });
	}

	// Обробка фільтрації за віком
	const minAge = searchParams?.minAge
		? parseInt(searchParams.minAge, 10)
		: null;
	const maxAge = searchParams?.maxAge
		? parseInt(searchParams.maxAge, 10)
		: null;

	if (minAge && maxAge && minAge <= maxAge) {
		andConditions.push({
			birthDate: {
				lte: getDateFromAge(minAge),
				gte: getDateFromAge(maxAge + 1),
			},
		});
	} else if (minAge) {
		andConditions.push({
			birthDate: {
				lte: getDateFromAge(minAge),
			},
		});
	} else if (maxAge) {
		andConditions.push({
			birthDate: {
				gte: getDateFromAge(maxAge + 1),
			},
		});
	}

	// Основний об'єкт whereClause
	const whereClause: Prisma.UserWhereInput = {
		NOT: {
			id: currentUserId || undefined,
		},
		// Всі інші умови об'єднуються через AND
		AND: andConditions,
	};

	const users = await prisma.user.findMany({
		where: whereClause,
		select: {
			id: true,
			image: true,
			...(isAuthenticated && {
				name: true,
			}),
		},
		orderBy: {
			id: 'desc',
		},
		take: 50,
	});

	return (
		<main className="default-layout">
			<div className="container mx-auto px-4 py-8">
				{/* 4. Додаємо компонент фільтрів */}
				<UserFilters />
				{!isAuthenticated && (
					<div className="text-center mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h1 className="text-2xl font-semibold text-blue-700">
							Willkommen!
						</h1>
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
						Keine Profile gefunden, die Ihren Kriterien entsprechen.
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
			</div>
		</main>
	);
}
///////////////////////////////////

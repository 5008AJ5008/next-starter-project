import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Meine Bookmarks', // Мої Закладки
};

// Допоміжна функція для розрахунку віку (можна винести в окремий файл utils, якщо ще не зроблено)
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

export default async function BookmarksPage() {
	const session = await auth();

	if (!session?.user?.id) {
		// Якщо користувач не авторизований, перенаправляємо на сторінку входу
		redirect('/api/auth/signin?callbackUrl=/bookmarks');
	}

	const currentUserId = session.user.id;

	// Отримуємо закладки поточного користувача, включаючи дані профілю користувача, якого додали в закладки
	const bookmarks = await prisma.bookmark.findMany({
		where: {
			bookmarkerId: currentUserId, // Закладки, зроблені поточним користувачем
		},
		include: {
			bookmarkedUser: {
				// Включаємо дані користувача, якого додали в закладки
				select: {
					id: true,
					name: true,
					image: true,
					city: true,
					birthDate: true, // Для розрахунку віку
					// Додайте інші поля, які хочете відображати
				},
			},
		},
		orderBy: {
			createdAt: 'desc', // Показуємо новіші закладки першими
		},
	});

	const bookmarkedUsers = bookmarks.map((bookmark) => bookmark.bookmarkedUser);

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center">Meine Lesezeichen</h1>

			{bookmarkedUsers.length === 0 && (
				<p className="text-center text-gray-500">
					Sie haben noch keine Profile zu Ihren Lesezeichen hinzugefügt.{' '}
					{/* Ви ще не додали жодного профілю до закладок. */}
				</p>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{bookmarkedUsers.map((user) => {
					if (!user) return null; // Пропускаємо, якщо з якоїсь причини user не завантажився
					const age = calculateAge(user.birthDate);
					return (
						// Картка користувача (схожа на ту, що на головній сторінці або /users)
						<div
							key={user.id}
							className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 group"
						>
							<Link
								href={`/users/${user.id}`}
								aria-label={`Profil von ${user.name || 'Benutzer'} ansehen`}
							>
								<div
									className="relative w-full"
									style={{ position: 'relative', paddingTop: '100%' }} // Квадратне співвідношення сторін
								>
									{user.image ? (
										<Image
											src={user.image}
											alt={`Profilbild von ${user.name || 'Benutzer'}`}
											fill
											style={{ objectFit: 'cover' }}
											sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
											className="transition-transform duration-300 group-hover:scale-110"
										/>
									) : (
										<div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
											<span className="text-gray-500">Kein Bild</span>
										</div>
									)}
								</div>
							</Link>
							<div className="p-4">
								<Link href={`/users/${user.id}`}>
									<h2 className="text-xl font-semibold text-gray-800 mb-1 truncate hover:text-blue-600">
										{user.name || 'Unbekannter Benutzer'}
										{age ? `, ${age}` : ''}
									</h2>
								</Link>
								{user.city && (
									<p className="text-sm text-gray-600 truncate">{user.city}</p>
								)}
								{/* Тут можна додати кнопку "Видалити з закладок", якщо потрібно */}
							</div>
						</div>
					);
				})}
			</div>
		</main>
	);
}

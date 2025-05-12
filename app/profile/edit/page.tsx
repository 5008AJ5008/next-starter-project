import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation'; // Для перенаправлення неавторизованих
import { updateProfile } from '@/actions/profileActions'; // Імпорт Server Action
import { ProfileForm } from '@/components/profile/ProfileForm'; // Компонент форми (створимо нижче або окремо)
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Profil bearbeiten', // Редагувати профіль
};

// Основний компонент сторінки (Серверний компонент)
export default async function EditProfilePage() {
	// 1. Отримати сесію
	const session = await auth();

	// 2. Якщо користувач не увійшов, перенаправити на сторінку входу
	if (!session?.user?.id) {
		// Ви можете перенаправити на головну або на сторінку входу
		redirect('/api/auth/signin?callbackUrl=/profile/edit'); // Стандартний шлях NextAuth
	}

	// 3. Отримати поточні дані профілю користувача з бази даних
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			name: true,
			birthDate: true,
			gender: true,
			city: true,
			aboutMe: true,
		},
	});

	// 4. Якщо користувача не знайдено (малоймовірно, але можливо)
	if (!user) {
		return <p className="text-red-500">Benutzer nicht gefunden.</p>; // Користувача не знайдено
	}

	// 5. Відобразити сторінку з формою
	return (
		<main className="container mx-auto px-4 py-8 max-w-2xl">
			<h1 className="text-2xl font-semibold mb-6">Profil bearbeiten</h1>{' '}
			{/* Редагувати профіль */}
			{/* Передаємо поточні дані користувача у форму */}
			<ProfileForm user={user} />
		</main>
	);
}

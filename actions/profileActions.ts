'use server';

import { z } from 'zod'; // Бібліотека для валідації
import { auth } from '@/auth'; // Функція для отримання сесії
import prisma from '@/lib/prisma'; // Ваш Prisma Client
import { revalidatePath } from 'next/cache'; // Для оновлення кешу сторінки профілю

// Схема валідації для даних форми профілю
const profileSchema = z.object({
	name: z
		.string()
		.min(1, 'Name ist erforderlich')
		.max(100, 'Name zu lang')
		.optional()
		.or(z.literal('')), // Ім'я може бути порожнім рядком або необов'язковим
	// Дата народження (перетворюємо рядок на дату, робимо необов'язковим)
	birthDate: z.preprocess((arg) => {
		if (!arg || typeof arg !== 'string' || arg === '') return null; // Дозволяємо порожній рядок як null
		try {
			return new Date(arg);
		} catch (error) {
			return null; // Повертаємо null при помилці парсингу
		}
	}, z.date().nullable().optional()), // Дозволяємо null або undefined
	// Стать (простий рядок, необов'язковий)
	gender: z.string().max(50, 'Angabe zu lang').optional().or(z.literal('')),
	// Місто (простий рядок, необов'язковий)
	city: z.string().max(100, 'Stadtname zu lang').optional().or(z.literal('')),
	// Про себе (текст, необов'язковий)
	aboutMe: z.string().max(1000, 'Text zu lang').optional().or(z.literal('')),
});

// Тип для стану форми (повідомлення про успіх/помилку)
type FormState = {
	message: string;
	status: 'success' | 'error';
} | null; // Може бути null на початку

// Server Action для оновлення профілю
export async function updateProfile(
	prevState: FormState, // Попередній стан форми
	formData: FormData // Дані з форми
): Promise<FormState> {
	// 1. Отримати сесію користувача
	const session = await auth();
	if (!session?.user?.id) {
		return {
			message: 'Nicht autorisiert.', // Не авторизовано
			status: 'error',
		};
	}
	const userId = session.user.id;

	// 2. Валідація даних форми
	// Перетворюємо FormData на об'єкт для валідації zod
	const formDataObject = Object.fromEntries(formData.entries());
	const validatedFields = profileSchema.safeParse(formDataObject);

	if (!validatedFields.success) {
		// Обробка помилок валідації (можна зробити детальнішою)
		console.error(
			'Validation errors:',
			validatedFields.error.flatten().fieldErrors
		);
		return {
			message: 'Validierungsfehler. Bitte überprüfen Sie Ihre Eingaben.', // Помилка валідації
			status: 'error',
		};
	}

	// 3. Оновлення даних у базі даних
	try {
		await prisma.user.update({
			where: { id: userId },
			data: {
				// Оновлюємо тільки ті поля, які пройшли валідацію
				name: validatedFields.data.name || null, // Зберігаємо null, якщо порожній рядок
				birthDate: validatedFields.data.birthDate, // Вже може бути null
				gender: validatedFields.data.gender || null,
				city: validatedFields.data.city || null,
				aboutMe: validatedFields.data.aboutMe || null,
			},
		});

		// 4. Оновлення кешу (щоб зміни відобразилися на інших сторінках)
		revalidatePath('/profile/edit'); // Оновити кеш сторінки редагування
		// revalidatePath('/profile'); // Якщо у вас є сторінка перегляду профілю

		return {
			message: 'Profil erfolgreich aktualisiert.', // Профіль успішно оновлено
			status: 'success',
		};
	} catch (error) {
		console.error('Database error:', error);
		return {
			message: 'Datenbankfehler. Bitte versuchen Sie es erneut.', // Помилка бази даних
			status: 'error',
		};
	}
}

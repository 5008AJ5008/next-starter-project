import NextAuth from 'next-auth';
// Краще використовувати повну назву імпорту для ясності
import GoogleProvider from 'next-auth/providers/google';
// Імпортуємо адаптер
import { PrismaAdapter } from '@auth/prisma-adapter';
// Імпортуємо ваш екземпляр PrismaClient (перевірте правильність шляху!)
import prisma from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
	// --- ДОДАНО АДАПТЕР ---
	adapter: PrismaAdapter(prisma),

	// --- НАЛАШТУВАННЯ ПРОВАЙДЕРА ---
	providers: [
		// Замість просто Google, передаємо об'єкт конфігурації
		GoogleProvider({
			// Переконайтеся, що ці змінні є у вашому .env.local
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],

	// --- ДОДАНО СЕКРЕТ (ВАЖЛИВО!) ---
	// Переконайтеся, що ця змінна є у вашому .env.local
	secret: process.env.AUTH_SECRET,

	// --- ДОДАНО КОЛБЕК ДЛЯ СЕСІЇ (РЕКОМЕНДОВАНО) ---
	callbacks: {
		async session({ session, user }) {
			// Додаємо ID користувача з бази даних до об'єкта сесії,
			// щоб ви могли легко отримати його в коді для зв'язку з постами тощо.
			if (session?.user) {
				session.user.id = user.id; // user.id тут - це ID з таблиці User
			}
			return session;
		},
		// Тут можна додати інші колбеки за потреби
	},

	// Можна додати інші налаштування за потреби (наприклад, кастомні сторінки)
});

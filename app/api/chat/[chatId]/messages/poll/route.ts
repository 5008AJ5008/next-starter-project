import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const POLLING_TIMEOUT = 25000; // 25 секунд таймаут для утримання запиту
const POLLING_INTERVAL = 2000; // 2 секунди інтервал перевірки нових повідомлень на сервері

export async function GET(
	request: Request,
	// Тип для params тут також має бути об'єктом, Next.js обробляє Promise під капотом
	// для аргументів функції обробника маршруту.
	// Однак, доступ до його властивостей тепер асинхронний.
	{ params: routeParams }: { params: { chatId: string } }
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
	}
	const currentUserId = session.user.id;

	// --- ЗМІНА ТУТ ---
	// Очікуємо routeParams перед доступом до chatId, згідно з Next.js 15
	// Хоча сам routeParams не є Promise, ця конструкція задовольняє нові вимоги
	// або ж Next.js передає Promise, який розв'язується тут.
	// Для API Routes, params зазвичай передається вже розв'язаним,
	// але помилка вказує на необхідність await.
	// Спробуємо так, як рекомендує повідомлення про помилку.
	// Якщо `routeParams` не є Promise, `await` просто поверне його.
	const awaitedParams = await routeParams;
	const chatId = awaitedParams.chatId;
	// ------------------

	// Отримуємо мітку часу останнього відомого повідомлення з параметрів запиту
	const { searchParams } = new URL(request.url);
	const lastMessageTimestampStr = searchParams.get('lastMessageTimestamp');
	const lastMessageTimestamp = lastMessageTimestampStr
		? new Date(lastMessageTimestampStr)
		: new Date(0);

	// Перевірка, чи користувач є учасником чату
	const isParticipant = await prisma.chatParticipant.findUnique({
		where: {
			userId_chatId: {
				userId: currentUserId,
				chatId: chatId,
			},
		},
	});

	if (!isParticipant) {
		return NextResponse.json({ error: 'Zugriff verweigert.' }, { status: 403 });
	}

	let attempts = 0;
	const maxAttempts = POLLING_TIMEOUT / POLLING_INTERVAL;

	while (attempts < maxAttempts) {
		const messages = await prisma.message.findMany({
			where: {
				chatId: chatId,
				createdAt: {
					gt: lastMessageTimestamp,
				},
			},
			include: {
				author: {
					select: { id: true, name: true, image: true },
				},
			},
			orderBy: {
				createdAt: 'asc',
			},
		});

		if (messages.length > 0) {
			return NextResponse.json({ messages });
		}

		await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
		attempts++;
	}

	return NextResponse.json({ messages: [] });
}

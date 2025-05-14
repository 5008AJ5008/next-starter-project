import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const POLLING_TIMEOUT = 25000; // 25 секунд таймаут для утримання запиту
const POLLING_INTERVAL = 2000; // 2 секунди інтервал перевірки нових повідомлень на сервері

export async function GET(
	request: Request,
	// --- ЗМІНА ТУТ: Оновлюємо тип для другого аргументу ---
	// Тепер params очікується як Promise, що містить об'єкт з chatId
	{ params: paramsPromise }: { params: Promise<{ chatId: string }> }
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
	}
	const currentUserId = session.user.id;

	// Очікуємо розв'язання Promise, щоб отримати об'єкт параметрів
	const params = await paramsPromise;
	const chatId = params.chatId;
	// ----------------------------------------------------

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
				chatId,
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
				chatId,
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

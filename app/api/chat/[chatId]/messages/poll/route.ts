import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const POLLING_TIMEOUT = 25000;
const POLLING_INTERVAL = 2000;

/**
 * Behandelt GET-Anfragen zum Abrufen neuer Nachrichten für einen bestimmten Chat mittels Long Polling.
 * Überprüft periodisch auf neue Nachrichten seit dem letzten bekannten Zeitstempel und gibt diese zurück,
 * sobald sie verfügbar sind, oder nach einem Timeout eine leere Antwort.
 *
 * @param request Das Anfrageobjekt, das die URL mit potenziellen Suchparametern (lastMessageTimestamp) enthält.
 * @param paramsPromise Ein Promise, das ein Objekt mit der `chatId` als Parameter auflöst.
 * @returns Eine NextResponse mit neuen Nachrichten oder einem Fehlerstatus.
 */
export async function GET(
	request: Request,
	{ params: paramsPromise }: { params: Promise<{ chatId: string }> }
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
	}
	const currentUserId = session.user.id;

	const params = await paramsPromise;
	const chatId = params.chatId;

	const { searchParams } = new URL(request.url);
	const lastMessageTimestampStr = searchParams.get('lastMessageTimestamp');
	const lastMessageTimestamp = lastMessageTimestampStr
		? new Date(lastMessageTimestampStr)
		: new Date(0);

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

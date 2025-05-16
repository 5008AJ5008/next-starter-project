import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import type { Message, Author } from '@/components/chat/ChatInterface';

type Props = {
	params: Promise<{ chatId: string }>;
};

/**
 * Generiert dynamisch Metadaten für die Chat-Seite.
 * Der Titel enthält den Namen des anderen Chat-Teilnehmers.
 * @param props Die Eigenschaften, die die `chatId` als Promise enthalten.
 * @returns Ein Promise, das die Metadaten-Objekte auflöst.
 */
export async function generateMetadata({
	params: paramsPromise,
}: Props): Promise<Metadata> {
	const session = await auth();
	const currentUserId = session?.user?.id;

	const params = await paramsPromise;
	const chatId = params.chatId;

	const chat = await prisma.chat.findUnique({
		where: { id: chatId },
		include: {
			participants: {
				include: {
					user: { select: { id: true, name: true } },
				},
			},
		},
	});

	if (!chat || !chat.participants.some((p) => p.userId === currentUserId)) {
		return { title: 'Chat nicht gefunden' };
	}

	const otherParticipant = chat.participants.find(
		(p) => p.userId !== currentUserId
	)?.user;
	const chatTitle = otherParticipant
		? `Chat mit ${otherParticipant.name || 'Benutzer'}`
		: 'Chat';

	return { title: chatTitle };
}

/**
 * Stellt die Chat-Seite dar.
 * Lädt die Chat-Details und initialen Nachrichten und rendert die Chat-Oberfläche.
 * Leitet nicht authentifizierte Benutzer zur Anmeldeseite weiter.
 * @param paramsPromise Ein Promise, das die `chatId` aus den Routenparametern enthält.
 * @returns JSX-Element, das die Chat-Seite anzeigt.
 */
export default async function ChatPage({ params: paramsPromise }: Props) {
	const session = await auth();

	const params = await paramsPromise;
	const chatId = params.chatId;

	if (!session?.user?.id) {
		redirect(`/api/auth/signin?callbackUrl=/chat/${chatId}`);
	}
	const currentUserId = session.user.id;

	const chatWithMessages = await prisma.chat.findUnique({
		where: {
			id: chatId,
			participants: {
				some: {
					userId: currentUserId,
				},
			},
		},
		include: {
			participants: {
				include: {
					user: {
						select: { id: true, name: true, image: true },
					},
				},
			},
			messages: {
				include: {
					author: {
						select: { id: true, name: true, image: true },
					},
				},
				orderBy: {
					createdAt: 'asc',
				},
			},
		},
	});

	if (!chatWithMessages) {
		notFound();
	}

	const initialMessages: Message[] = chatWithMessages.messages.map((msg) => ({
		id: msg.id,
		content: msg.content,
		createdAt: msg.createdAt.toISOString(),
		authorId: msg.authorId,
		author: msg.author
			? {
					id: msg.author.id,
					name: msg.author.name,
					image: msg.author.image,
			  }
			: null,
		chatId: msg.chatId,
		isSystemMessage: msg.isSystemMessage,
	}));

	const otherParticipantData = chatWithMessages.participants.find(
		(p) => p.userId !== currentUserId
	)?.user;

	const otherParticipant: Author | null = otherParticipantData
		? {
				id: otherParticipantData.id,
				name: otherParticipantData.name,
				image: otherParticipantData.image,
		  }
		: null;

	return (
		<main className="chat-page-container">
			{' '}
			<ChatInterface
				initialMessages={initialMessages}
				chatId={chatId}
				currentUserId={currentUserId}
				otherParticipant={otherParticipant}
			/>
		</main>
	);
}

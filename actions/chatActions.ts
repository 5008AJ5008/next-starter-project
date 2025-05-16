'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

interface MessageAuthor {
	id: string;
	name: string | null;
	image: string | null;
}

export interface ReturnedMessage {
	id: string;
	content: string;
	createdAt: string;
	authorId: string | null;
	chatId: string;
	author: MessageAuthor | null;
	isSystemMessage?: boolean | null;
}

/**
 * Sucht einen vorhandenen Chat zwischen dem aktuellen Benutzer und einem anderen Benutzer
 * oder erstellt einen neuen Chat, falls keiner existiert, und leitet dann zu diesem Chat weiter.
 * @param receiverId Die ID des Benutzers, mit dem ein Chat gestartet oder gefunden werden soll.
 */
export async function createOrFindChatAndRedirect(
	receiverId: string
): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) {
		console.error('Nicht autorisiert für Chat-Erstellung.');
		return;
	}
	const currentUserId = session.user.id;

	if (currentUserId === receiverId) {
		console.error('Sie können keinen Chat mit sich selbst erstellen.');
		return;
	}

	let chatIdToRedirect: string | undefined;

	try {
		const existingChat = await prisma.chat.findFirst({
			where: {
				AND: [
					{ participants: { some: { userId: currentUserId } } },
					{ participants: { some: { userId: receiverId } } },
					{
						participants: {
							every: { userId: { in: [currentUserId, receiverId] } },
						},
					},
				],
			},
			select: { id: true },
		});

		if (existingChat) {
			chatIdToRedirect = existingChat.id;
		} else {
			const newChat = await prisma.chat.create({
				data: {
					participants: {
						create: [{ userId: currentUserId }, { userId: receiverId }],
					},
				},
				select: { id: true },
			});
			chatIdToRedirect = newChat.id;
		}
	} catch (error) {
		console.error('Fehler beim Erstellen oder Suchen des Chats:', error);
		return;
	}

	if (chatIdToRedirect) {
		redirect(`/chat/${chatIdToRedirect}`);
	} else {
		console.error('Chat-ID wurde nicht gefunden oder erstellt.');
	}
}

const messageSchema = z.object({
	content: z
		.string()
		.min(1, 'Nachricht darf nicht leer sein.')
		.max(1000, 'Nachricht zu lang.'),
});

type SendMessageFormState = {
	status: 'success' | 'error';
	message?: string;
	errors?: {
		content?: string[];
	};
	newMessage?: ReturnedMessage;
} | null;

interface MessageWithAuthor {
	id: string;
	content: string;
	createdAt: Date;
	authorId: string | null;
	chatId: string;
	isSystemMessage: boolean | null;
	author: {
		id: string;
		name: string | null;
		image: string | null;
	} | null;
}

/**
 * Sendet eine Nachricht in einem bestimmten Chat.
 * @param chatId Die ID des Chats, in dem die Nachricht gesendet wird.
 * @param prevState Der vorherige Status des Formulars (für useFormState).
 * @param formData Die Formulardaten, die die Nachricht enthalten.
 * @returns Ein Objekt, das den Status der Operation und gegebenenfalls die neue Nachricht oder Fehler enthält.
 */
export async function sendMessage(
	chatId: string,
	prevState: SendMessageFormState,
	formData: FormData
): Promise<SendMessageFormState> {
	const session = await auth();
	if (!session?.user?.id) {
		return { status: 'error', message: 'Nicht autorisiert.' };
	}
	const currentUserId = session.user.id;

	const validatedFields = messageSchema.safeParse({
		content: formData.get('content'),
	});

	if (!validatedFields.success) {
		return {
			status: 'error',
			message: 'Validierungsfehler.',
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}
	const { content } = validatedFields.data;

	try {
		const chatParticipant = await prisma.chatParticipant.findUnique({
			where: {
				userId_chatId: {
					userId: currentUserId,
					chatId,
				},
			},
		});
		if (!chatParticipant) {
			return {
				status: 'error',
				message: 'Sie sind kein Teilnehmer dieses Chats.',
			};
		}

		let createdMessage: MessageWithAuthor | undefined;

		await prisma.$transaction(async (tx) => {
			const result = await tx.message.create({
				data: {
					content,
					chatId,
					authorId: currentUserId,
					isSystemMessage: false,
				},
				include: {
					author: {
						select: { id: true, name: true, image: true },
					},
				},
			});
			createdMessage = result as MessageWithAuthor;

			await tx.chat.update({
				where: { id: chatId },
				data: { updatedAt: new Date() },
			});
		});

		revalidatePath(`/chat/${chatId}`);
		revalidatePath('/chat');

		if (!createdMessage || !createdMessage.author) {
			console.error(
				'Nachricht konnte nicht erstellt werden oder Autor-Daten fehlen.',
				createdMessage
			);
			return {
				status: 'error',
				message:
					'Nachricht konnte nicht erstellt werden oder Autor-Daten fehlen.',
			};
		}

		const returnedNewMessage: ReturnedMessage = {
			id: createdMessage.id,
			content: createdMessage.content,
			createdAt: createdMessage.createdAt.toISOString(),
			authorId: createdMessage.authorId,
			chatId: createdMessage.chatId,
			author: createdMessage.author,
			isSystemMessage: createdMessage.isSystemMessage ?? false,
		};

		return {
			status: 'success',
			message: 'Nachricht gesendet!',
			newMessage: returnedNewMessage,
		};
	} catch (error) {
		console.error('Fehler beim Senden der Nachricht:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unbekannter Fehler.';
		console.log(
			`--- sendMessage Server Action ERROR for chatId: ${chatId} ---`
		);
		return {
			status: 'error',
			message: `Fehler beim Senden der Nachricht: ${errorMessage}`,
		};
	}
}

/**
 * Ruft die Anzahl der ungelesenen Nachrichten für den aktuellen Benutzer ab.
 * @returns Eine Promise, die die Gesamtzahl der ungelesenen Nachrichten auflöst.
 */
export async function getUnreadMessageCount(): Promise<number> {
	const session = await auth();
	if (!session?.user?.id) {
		return 0;
	}
	const currentUserId = session.user.id;

	try {
		const participations = await prisma.chatParticipant.findMany({
			where: { userId: currentUserId },
			select: {
				chatId: true,
				lastReadAt: true,
			},
		});

		if (participations.length === 0) {
			return 0;
		}

		let totalUnreadCount = 0;

		for (const participation of participations) {
			const unreadMessagesInChat = await prisma.message.count({
				where: {
					chatId: participation.chatId,
					authorId: {
						not: currentUserId,
					},
					createdAt: {
						gt: participation.lastReadAt || new Date(0),
					},
				},
			});
			totalUnreadCount += unreadMessagesInChat;
		}

		return totalUnreadCount;
	} catch (error) {
		console.error(
			'Fehler beim Abrufen der Anzahl ungelesener Nachrichten:',
			error
		);
		return 0;
	}
}

/**
 * Markiert einen Chat für den aktuellen Benutzer als gelesen, indem das Feld `lastReadAt` aktualisiert wird.
 * @param chatId Die ID des Chats, der als gelesen markiert werden soll.
 * @returns Ein Objekt, das den Erfolg der Operation anzeigt oder einen Fehler enthält.
 */
export async function markChatAsRead(
	chatId: string
): Promise<{ success: boolean; error?: string }> {
	const session = await auth();
	if (!session?.user?.id) {
		console.error('markChatAsRead: Nicht autorisiert.');
		return { success: false, error: 'Nicht autorisiert.' };
	}
	const currentUserId = session.user.id;

	try {
		await prisma.chatParticipant.update({
			where: {
				userId_chatId: {
					userId: currentUserId,
					chatId,
				},
			},
			data: {
				lastReadAt: new Date(),
			},
		});
		revalidatePath('/');
		revalidatePath('/chat');
		return { success: true };
	} catch (error) {
		console.error(
			`Fehler beim Markieren des Chats ${chatId} als gelesen:`,
			error
		);
		return {
			success: false,
			error: 'Fehler beim Aktualisieren des Lesestatus.',
		};
	}
}

const MESSAGES_PER_PAGE = 20;

type GetOlderMessagesResponse = {
	messages: ReturnedMessage[];
	nextCursor?: string | null;
	hasMore: boolean;
};

/**
 * Ruft ältere Nachrichten für einen bestimmten Chat ab, basierend auf einem Cursor für die Paginierung.
 * @param chatId Die ID des Chats, aus dem Nachrichten abgerufen werden sollen.
 * @param cursor Die ID der Nachricht, ab der ältere Nachrichten geladen werden sollen (optional).
 * @returns Ein Objekt, das die abgerufenen Nachrichten, den nächsten Cursor und einen booleschen Wert enthält, der angibt, ob weitere Nachrichten vorhanden sind.
 */
export async function getOlderMessages(
	chatId: string,
	cursor?: string | null
): Promise<GetOlderMessagesResponse> {
	const session = await auth();
	if (!session?.user?.id) {
		return { messages: [], hasMore: false };
	}
	const currentUserId = session.user.id;

	const isParticipant = await prisma.chatParticipant.count({
		where: { userId: currentUserId, chatId },
	});

	if (isParticipant === 0) {
		return { messages: [], hasMore: false, nextCursor: null };
	}

	try {
		const messagesFromDb = await prisma.message.findMany({
			where: {
				chatId,
			},
			take: MESSAGES_PER_PAGE + 1,
			...(cursor && {
				skip: 1,
				cursor: {
					id: cursor,
				},
			}),
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				author: {
					select: { id: true, name: true, image: true },
				},
			},
		});

		const hasMore = messagesFromDb.length > MESSAGES_PER_PAGE;
		const resultMessages = hasMore
			? messagesFromDb.slice(0, MESSAGES_PER_PAGE)
			: messagesFromDb;
		const nextCursor =
			resultMessages.length > 0
				? resultMessages[resultMessages.length - 1].id
				: null;

		const formattedMessages: ReturnedMessage[] = resultMessages
			.map((msg) => ({
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
				isSystemMessage: msg.isSystemMessage ?? false,
			}))
			.reverse();

		return { messages: formattedMessages, nextCursor, hasMore };
	} catch (error) {
		console.error('Fehler beim Laden älterer Nachrichten:', error);
		return { messages: [], hasMore: false };
	}
}

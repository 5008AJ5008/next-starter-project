'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
// Імпорт Prisma з @prisma/client більше не потрібен для визначення MessageWithAuthor,
// якщо ми визначаємо його поля явно.
// import { Prisma } from '@prisma/client';

// Тип для автора, який буде включено в повідомлення
interface MessageAuthor {
	id: string;
	name: string | null;
	image: string | null;
}

// Тип для повідомлення, яке повертається клієнту
interface ReturnedMessage {
	id: string;
	content: string;
	createdAt: string; // Будемо повертати як ISO рядок
	authorId: string;
	chatId: string;
	author: MessageAuthor;
}

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

// Явно визначаємо тип MessageWithAuthor на основі моделі Message з schema.prisma
// та того, що повертає include: { author: ... }
interface MessageWithAuthor {
	id: string;
	content: string;
	createdAt: Date; // Prisma DateTime - це Date в TypeScript
	authorId: string;
	chatId: string;
	// Додаємо поле author зі своєю структурою
	author: {
		id: string;
		name: string | null;
		image: string | null;
	};
}

export async function sendMessage(
	chatId: string,
	prevState: SendMessageFormState,
	formData: FormData
): Promise<SendMessageFormState> {
	console.log(
		`--- sendMessage Server Action CALLED for chatId: ${chatId} at ${new Date().toISOString()} ---`
	);
	console.log('Form Data Content:', formData.get('content'));

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
			// Тип result тепер має відповідати MessageWithAuthor завдяки include
			const result = await tx.message.create({
				data: {
					content,
					chatId,
					authorId: currentUserId,
				},
				include: {
					author: {
						select: { id: true, name: true, image: true },
					},
				},
			});
			createdMessage = result as MessageWithAuthor; // Можна додати явне приведення, якщо TS все ще не впевнений

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
			createdAt: createdMessage.createdAt.toISOString(), // createdAt тут є Date
			authorId: createdMessage.authorId,
			chatId: createdMessage.chatId,
			author: {
				id: createdMessage.author.id,
				name: createdMessage.author.name,
				image: createdMessage.author.image,
			},
		};
		console.log(
			`--- sendMessage Server Action SUCCESS for chatId: ${chatId} ---`
		);

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

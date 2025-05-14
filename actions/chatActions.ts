'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache'; // Додаємо для оновлення сторінки чату
import { z } from 'zod'; // Для валідації повідомлення

/**
 * Знаходить існуючий чат між двома користувачами або створює новий,
 * а потім перенаправляє на сторінку чату.
 * @param receiverId ID користувача, з яким потрібно створити/знайти чат.
 */
export async function createOrFindChatAndRedirect(
	receiverId: string
): Promise<void> {
	const session = await auth();

	if (!session?.user?.id) {
		console.error('Nicht autorisiert für Chat-Erstellung.');
		// У реальному додатку тут може бути redirect на сторінку входу або помилка
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
		// Можна кинути помилку або перенаправити на сторінку помилки
		return;
	}

	if (chatIdToRedirect) {
		redirect(`/chat/${chatIdToRedirect}`);
	} else {
		console.error('Chat-ID wurde nicht gefunden oder erstellt.');
		// redirect('/some-error-page');
	}
}

// --- НОВА SERVER ACTION ДЛЯ НАДСИЛАННЯ ПОВІДОМЛЕННЯ ---
const messageSchema = z.object({
	content: z
		.string()
		.min(1, 'Nachricht darf nicht leer sein.')
		.max(1000, 'Nachricht zu lang.'), // Повідомлення не може бути порожнім / Повідомлення задовге
});

type SendMessageFormState = {
	status: 'success' | 'error';
	message?: string;
	errors?: {
		content?: string[];
	};
} | null;

export async function sendMessage(
	chatId: string, // ID чату, до якого надсилається повідомлення
	prevState: SendMessageFormState, // Попередній стан форми
	formData: FormData
): Promise<SendMessageFormState> {
	const session = await auth();

	if (!session?.user?.id) {
		return { status: 'error', message: 'Nicht autorisiert.' };
	}
	const currentUserId = session.user.id;

	// Валідація вхідних даних
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
		// Перевірка, чи поточний користувач є учасником чату
		const chatParticipant = await prisma.chatParticipant.findUnique({
			where: {
				userId_chatId: {
					// Використовуємо унікальний складений ключ
					userId: currentUserId,
					chatId: chatId,
				},
			},
		});

		if (!chatParticipant) {
			return {
				status: 'error',
				message: 'Sie sind kein Teilnehmer dieses Chats.',
			}; // Ви не є учасником цього чату
		}

		// Створюємо нове повідомлення та оновлюємо updatedAt для чату в одній транзакції
		await prisma.$transaction(async (tx) => {
			await tx.message.create({
				data: {
					content: content,
					chatId: chatId,
					authorId: currentUserId,
				},
			});

			await tx.chat.update({
				where: { id: chatId },
				data: {
					updatedAt: new Date(), // Оновлюємо час останньої активності в чаті
				},
			});
		});

		// Оновлюємо кеш для сторінки чату, щоб відобразити нове повідомлення
		revalidatePath(`/chat/${chatId}`);
		revalidatePath('/chat'); // Також оновлюємо список чатів, оскільки порядок міг змінитися

		return { status: 'success', message: 'Nachricht gesendet!' }; // Повідомлення надіслано!
	} catch (error) {
		console.error('Fehler beim Senden der Nachricht:', error); // Помилка при надсиланні повідомлення
		return {
			status: 'error',
			message: 'Interner Serverfehler beim Senden der Nachricht.',
		}; // Внутрішня помилка сервера при надсиланні повідомлення
	}
}

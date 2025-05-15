import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
// 1. Імпортуємо компонент ChatInterface
import ChatInterface from '@/components/chat/ChatInterface'; // Переконайтеся, що шлях правильний
// Типи Message та Author тепер можна взяти з ChatInterface, якщо вони там експортовані,
// або залишити їх визначення в ChatInterface і передавати дані відповідного типу.
// Для простоти, припустимо, що ChatInterface очікує дані у форматі, який ми підготуємо.
import type { Message, Author } from '@/components/chat/ChatInterface'; // Припускаємо, що ці типи експортовані

type Props = {
	params: Promise<{ chatId: string }>;
};

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

export default async function ChatPage({ params: paramsPromise }: Props) {
	const session = await auth();

	const params = await paramsPromise;
	const chatId = params.chatId;

	if (!session?.user?.id) {
		redirect(`/api/auth/signin?callbackUrl=/chat/${chatId}`);
	}
	const currentUserId = session.user.id;

	// Завантажуємо дані чату та початкові повідомлення
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
						// Включаємо повні дані користувача для учасників
						select: { id: true, name: true, image: true },
					},
				},
			},
			messages: {
				// Завантажуємо всі повідомлення для початкового відображення
				include: {
					author: {
						// Включаємо дані автора для кожного повідомлення
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

	// Готуємо дані для передачі в клієнтський компонент
	// Перетворюємо Date на ISO рядок для серіалізації
	const initialMessages: Message[] = chatWithMessages.messages.map((msg) => ({
		id: msg.id,
		content: msg.content,
		createdAt: msg.createdAt.toISOString(), // Важливо для серіалізації
		authorId: msg.authorId, // Тепер може бути null
		// --- ЗМІНА ТУТ: Додано перевірку на msg.author ---
		author: msg.author
			? {
					// Якщо автор існує, передаємо його дані
					id: msg.author.id,
					name: msg.author.name,
					image: msg.author.image,
			  }
			: null, // Інакше передаємо null
		chatId: msg.chatId,
		isSystemMessage: msg.isSystemMessage,
	}));

	const otherParticipantData = chatWithMessages.participants.find(
		(p) => p.userId !== currentUserId
	)?.user;

	// Перетворюємо на тип Author, обробляючи можливий undefined
	const otherParticipant: Author | null = otherParticipantData
		? {
				id: otherParticipantData.id,
				name: otherParticipantData.name,
				image: otherParticipantData.image,
		  }
		: null;

	return (
		// Основний контейнер сторінки
		// h-[calc(100vh-var(--header-height,4rem))] - це Tailwind клас для висоти.
		// Якщо ви не використовуєте Tailwind, вам потрібно буде задати висоту через CSS.
		// Наприклад, style={{ height: 'calc(100vh - 64px)' }} (якщо висота хедера 64px)
		<main className="chat-page-container">
			{' '}
			{/* Замініть на ваш клас або додайте стилі */}
			<ChatInterface
				initialMessages={initialMessages}
				chatId={chatId}
				currentUserId={currentUserId}
				otherParticipant={otherParticipant}
			/>
		</main>
	);
}

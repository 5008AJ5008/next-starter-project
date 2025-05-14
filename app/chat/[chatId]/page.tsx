import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
// import { format } from 'date-fns';
// import { de } from 'date-fns/locale';

// 1. Імпортуємо компонент форми
import ChatMessageForm from '@/components/chat/ChatMessageForm'; // Переконайтеся, що шлях правильний

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

	const chat = await prisma.chat.findUnique({
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
						select: { id: true, name: true, image: true }, // Включаємо дані автора повідомлення
					},
				},
				orderBy: {
					createdAt: 'asc',
				},
			},
		},
	});

	if (!chat) {
		notFound();
	}

	const otherParticipant = chat.participants.find(
		(p) => p.userId !== currentUserId
	)?.user;

	return (
		<main className="container mx-auto px-0 sm:px-4 py-0 flex flex-col h-[calc(100vh-var(--header-height,4rem))]">
			<header className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
				<div className="flex items-center space-x-3">
					{otherParticipant?.image && (
						<Image
							src={otherParticipant.image}
							alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
							width={40}
							height={40}
							className="rounded-full"
						/>
					)}
					<h1 className="text-xl font-semibold">
						{otherParticipant?.name || 'Unbekannter Benutzer'}
					</h1>
				</div>
			</header>

			<div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100">
				{chat.messages.length === 0 && (
					<p className="text-center text-gray-500">
						Noch keine Nachrichten in diesem Chat.
					</p>
				)}
				{chat.messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${
							message.authorId === currentUserId
								? 'justify-end'
								: 'justify-start'
						}`}
					>
						{/* Можна додати аватар автора повідомлення поруч з повідомленням */}
						{message.authorId !== currentUserId && message.author.image && (
							<Image
								src={message.author.image}
								alt={message.author.name || ''}
								width={24}
								height={24}
								className="rounded-full mr-2 self-end"
							/>
						)}
						<div
							className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow ${
								// Зменшено padding
								message.authorId === currentUserId
									? 'bg-blue-500 text-white'
									: 'bg-white text-gray-800 border border-gray-200' // Додано рамку для чужих повідомлень
							}`}
						>
							<p className="text-sm">{message.content}</p>
							<p
								className={`text-xs mt-1 ${
									message.authorId === currentUserId
										? 'text-blue-100'
										: 'text-gray-400'
								} text-right`}
							>
								{new Date(message.createdAt).toLocaleTimeString('de-DE', {
									hour: '2-digit',
									minute: '2-digit',
								})}
							</p>
						</div>
						{message.authorId === currentUserId && message.author.image && (
							<Image
								src={message.author.image}
								alt={message.author.name || ''}
								width={24}
								height={24}
								className="rounded-full ml-2 self-end"
							/>
						)}
					</div>
				))}
			</div>

			{/* 2. Додаємо компонент форми надсилання повідомлення */}
			<div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
				{' '}
				{/* Змінено фон на білий */}
				<ChatMessageForm chatId={chat.id} />
			</div>
		</main>
	);
}

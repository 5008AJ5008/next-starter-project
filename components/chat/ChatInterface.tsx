'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ChatMessageForm from './ChatMessageForm'; // Форма надсилання повідомлень

// Локальні типи для зручності
export interface Author {
	id: string;
	name: string | null;
	image: string | null;
}

export interface Message {
	id: string;
	content: string;
	createdAt: string; // Зберігаємо як рядок, оскільки Date не серіалізується легко через props
	authorId: string;
	author: Author;
	chatId: string;
}

// Тип для відповіді від API polling-у
interface PollResponse {
	messages: Message[];
}

type ChatInterfaceProps = {
	initialMessages: Message[];
	chatId: string;
	currentUserId: string;
	otherParticipant: Author | null; // Додаємо інформацію про співрозмовника
};

export default function ChatInterface({
	initialMessages,
	chatId,
	currentUserId,
	otherParticipant,
}: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Оновлена логіка для Long Polling
	useEffect(() => {
		let isActive = true;

		const startPolling = async () => {
			if (!isActive || isLoading) return;
			setIsLoading(true);

			const lastTimestamp =
				messages.length > 0
					? messages[messages.length - 1].createdAt
					: new Date(0).toISOString();

			try {
				const response = await fetch(
					`/api/chat/${chatId}/messages/poll?lastMessageTimestamp=${encodeURIComponent(
						lastTimestamp
					)}`
				);
				if (!isActive) return;

				if (!response.ok) {
					console.error('Polling error:', response.status, response.statusText);
					await new Promise((resolve) => setTimeout(resolve, 5000));
				} else {
					// Явно вказуємо тип для даних, отриманих з response.json()
					const data = (await response.json()) as PollResponse; // <--- ЗМІНА ТУТ
					if (!isActive) return;

					if (data.messages && data.messages.length > 0) {
						setMessages((prevMessages) => {
							const newMessages = data.messages.filter(
								(newMessage) =>
									!prevMessages.some(
										(existingMessage) => existingMessage.id === newMessage.id
									)
							);
							return [...prevMessages, ...newMessages];
						});
					}
				}
			} catch (error) {
				if (!isActive) return;
				console.error('Failed to fetch new messages (catch):', error);
				await new Promise((resolve) => setTimeout(resolve, 5000));
			} finally {
				if (isActive) {
					setIsLoading(false);
					setTimeout(startPolling, 500); // Рекурсивний виклик для продовження polling
				}
			}
		};

		startPolling();

		return () => {
			isActive = false;
		};
		// Додаємо messages до залежностей, щоб lastTimestamp оновлювався,
		// але також потрібно обережно керувати isLoading, щоб уникнути зайвих запитів.
		// Поточна логіка з isLoading має це обробляти.
	}, [chatId, messages, isLoading]);

	return (
		<>
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
				{messages.length === 0 && (
					<p className="text-center text-gray-500">
						Noch keine Nachrichten in diesem Chat.
					</p>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${
							message.authorId === currentUserId
								? 'justify-end'
								: 'justify-start'
						}`}
					>
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
								message.authorId === currentUserId
									? 'bg-blue-500 text-white'
									: 'bg-white text-gray-800 border border-gray-200'
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
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
				<ChatMessageForm chatId={chatId} />
			</div>
		</>
	);
}

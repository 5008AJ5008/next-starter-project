'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import ChatMessageForm from './ChatMessageForm';

export interface Author {
	id: string;
	name: string | null;
	image: string | null;
}

export interface Message {
	id: string;
	content: string;
	createdAt: string; // Зберігаємо як рядок
	authorId: string;
	author: Author;
	chatId: string;
}

interface PollResponse {
	messages: Message[];
}

type ChatInterfaceProps = {
	initialMessages: Message[];
	chatId: string;
	currentUserId: string;
	otherParticipant: Author | null;
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
	const pollingFunctionRef = useRef<(() => Promise<void>) | undefined>(
		undefined
	);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		setMessages(initialMessages);
	}, [initialMessages]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);
	/////////////////////////////
	//////////////////////////////
	// Обгортаємо handleNewMessageFromForm у useCallback
	const handleNewMessageFromForm = useCallback((newMessage: Message) => {
		setMessages((prevMessages) => {
			// Перевіряємо, чи повідомлення вже існує, щоб уникнути дублікатів
			// Це може бути важливо, якщо і Long Polling, і onMessageSent можуть додати те саме повідомлення
			if (!prevMessages.find((msg) => msg.id === newMessage.id)) {
				return [...prevMessages, newMessage];
			}
			return prevMessages;
		});
	}, []); // setMessages є стабільною функцією, тому масив залежностей порожній

	// Оновлюємо pollingFunctionRef, коли змінюються залежності, які вона використовує
	useEffect(() => {
		pollingFunctionRef.current = async () => {
			if (isLoading) return;
			setIsLoading(true);

			const currentMessages = messages;
			const lastTimestamp =
				currentMessages.length > 0
					? currentMessages[currentMessages.length - 1].createdAt
					: new Date(0).toISOString();
			console.log(
				`[User: ${currentUserId}] Polling for chat ${chatId} with lastTimestamp: ${lastTimestamp}`
			);

			try {
				const response = await fetch(
					`/api/chat/${chatId}/messages/poll?lastMessageTimestamp=${encodeURIComponent(
						lastTimestamp
					)}`,
					{ cache: 'no-store' }
				);

				if (!response.ok) {
					console.error(
						`[User: ${currentUserId}] Polling error for chat ${chatId}:`,
						response.status,
						response.statusText
					);
					await new Promise((resolve) => setTimeout(resolve, 10000));
				} else {
					const data = (await response.json()) as PollResponse;
					if (data.messages && data.messages.length > 0) {
						console.log(
							`[User: ${currentUserId}] Polled new messages for chat ${chatId}:`,
							data.messages
						);
						setMessages((prevMessages) => {
							const uniqueNewMessages = data.messages.filter(
								(newMessagePolled) =>
									!prevMessages.some(
										(existingMessage) =>
											existingMessage.id === newMessagePolled.id
									)
							);
							if (uniqueNewMessages.length > 0) {
								return [...prevMessages, ...uniqueNewMessages];
							}
							return prevMessages;
						});
					}
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.log(
						`[User: ${currentUserId}] Fetch aborted for polling chat ${chatId}.`
					);
				} else {
					console.error(
						`[User: ${currentUserId}] Failed to fetch new messages for chat ${chatId} (catch):`,
						error
					);
					await new Promise((resolve) => setTimeout(resolve, 10000));
				}
			} finally {
				setIsLoading(false);
			}
		};
		// Залежності для оновлення pollingFunctionRef:
	}, [chatId, messages, isLoading, currentUserId, otherParticipant]); // otherParticipant тут, якщо він використовується для логування всередині

	// useEffect для запуску та рекурсивного виклику polling
	useEffect(() => {
		let isActive = true;
		let timeoutId: NodeJS.Timeout;

		const executePoll = async () => {
			if (!isActive) return;
			if (pollingFunctionRef.current) {
				await pollingFunctionRef.current();
			}
			if (isActive) {
				timeoutId = setTimeout(executePoll, 2000); // Інтервал між запитами
			}
		};

		if (chatId) {
			// Запускаємо polling тільки якщо є chatId
			const initialPollTimeoutId = setTimeout(() => {
				if (isActive) executePoll();
			}, 500); // Невеликий таймаут перед першим запуском
			return () => {
				clearTimeout(initialPollTimeoutId);
				isActive = false;
				clearTimeout(timeoutId);
				console.log(
					`[User: ${currentUserId}] Polling stopped for chat ${chatId}.`
				); // Оновлено лог
			};
		}

		return () => {
			// Функція очищення, якщо chatId не було
			isActive = false;
			clearTimeout(timeoutId);
		};
		// Змінено масив залежностей: тепер тільки chatId
	}, [chatId, currentUserId]); // currentUserId додано для логування в cleanup

	return (
		<div className="chat-interface-wrapper">
			<header className="chat-header">
				<div className="chat-header-content">
					{otherParticipant?.image && (
						<Image
							src={otherParticipant.image}
							alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
							width={40}
							height={40}
							className="chat-header-avatar"
							style={{ objectFit: 'cover' }}
						/>
					)}
					<h1 className="chat-header-name">
						{otherParticipant?.name || 'Unbekannter Benutzer'}
					</h1>
				</div>
			</header>

			<div className="chat-messages-list">
				{messages.length === 0 && (
					<p className="chat-no-messages-text">
						Noch keine Nachrichten in diesem Chat.
					</p>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`message-row ${
							message.authorId === currentUserId
								? 'message-row--own'
								: 'message-row--other'
						}`}
					>
						{message.authorId !== currentUserId && message.author.image && (
							<Image
								src={message.author.image}
								alt={message.author.name || ''}
								width={24}
								height={24}
								className="message-avatar message-avatar--other"
								style={{ objectFit: 'cover' }}
							/>
						)}
						<div
							className={`message-bubble ${
								message.authorId === currentUserId
									? 'message-bubble--own'
									: 'message-bubble--other'
							}`}
						>
							<p className="message-content">{message.content}</p>
							<p
								className={`message-timestamp ${
									message.authorId === currentUserId
										? 'message-timestamp--own'
										: 'message-timestamp--other'
								}`}
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
								className="message-avatar message-avatar--own"
								style={{ objectFit: 'cover' }}
							/>
						)}
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			<div className="chat-form-container">
				<ChatMessageForm
					chatId={chatId}
					onMessageSent={handleNewMessageFromForm}
				/>
			</div>
		</div>
	);
}

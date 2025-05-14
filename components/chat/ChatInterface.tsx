'use client';

import { useState, useEffect, useRef } from 'react';
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

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		setMessages(initialMessages);
	}, [initialMessages]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleNewMessageFromForm = (newMessage: Message) => {
		setMessages((prevMessages) => {
			if (!prevMessages.find((msg) => msg.id === newMessage.id)) {
				return [...prevMessages, newMessage];
			}
			return prevMessages;
		});
	};

	// useEffect для Long Polling
	useEffect(() => {
		let isActive = true;
		const controller = new AbortController();

		const startPolling = async () => {
			if (!isActive || isLoading) return;
			setIsLoading(true);

			// 'messages' використовується тут для lastTimestamp
			const lastTimestamp =
				messages.length > 0
					? messages[messages.length - 1].createdAt
					: new Date(0).toISOString();
			// 'currentUserId', 'otherParticipant?.id', 'otherParticipant?.name' використовуються в console.log
			console.log(
				`[${
					currentUserId === otherParticipant?.id
						? 'SELF'
						: otherParticipant?.name || 'Other'
				}] Polling with lastTimestamp: ${lastTimestamp}`
			);

			try {
				const response = await fetch(
					// 'chatId' використовується тут
					`/api/chat/${chatId}/messages/poll?lastMessageTimestamp=${encodeURIComponent(
						lastTimestamp
					)}`,
					{
						cache: 'no-store',
						signal: controller.signal,
					}
				);

				if (!isActive) return;

				if (!response.ok) {
					// 'otherParticipant?.name' використовується в console.error
					console.error(
						`[${otherParticipant?.name || 'Other'}] Polling error:`,
						response.status,
						response.statusText
					);
					await new Promise((resolve) => setTimeout(resolve, 10000));
				} else {
					const data = (await response.json()) as PollResponse;
					if (!isActive) return;

					if (data.messages && data.messages.length > 0) {
						// 'otherParticipant?.name' використовується в console.log
						console.log(
							`[${otherParticipant?.name || 'Other'}] Polled new messages:`,
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
				if (!isActive) return;
				if (error instanceof Error) {
					if (error.name === 'AbortError') {
						// 'otherParticipant?.name' використовується в console.log
						console.log(
							`[${
								otherParticipant?.name || 'Other'
							}] Fetch aborted for polling.`
						);
					} else {
						// 'otherParticipant?.name' використовується в console.error
						console.error(
							`[${
								otherParticipant?.name || 'Other'
							}] Failed to fetch new messages (catch):`,
							error.message
						);
					}
				} else {
					// 'otherParticipant?.name' використовується в console.error
					console.error(
						`[${
							otherParticipant?.name || 'Other'
						}] An unknown error occurred during polling:`,
						error
					);
				}
				if (!(error instanceof Error && error.name === 'AbortError')) {
					await new Promise((resolve) => setTimeout(resolve, 10000));
				}
			} finally {
				if (isActive) {
					setIsLoading(false);
					setTimeout(startPolling, 2000);
				}
			}
		};

		if (chatId) {
			// 'chatId' використовується тут
			startPolling();
		}

		return () => {
			isActive = false;
			controller.abort();
			// 'otherParticipant?.name' використовується в console.log
			console.log(`[${otherParticipant?.name || 'Other'}] Polling stopped.`);
		};
		// Оновлений масив залежностей, що включає всі необхідні змінні
	}, [chatId, isLoading, messages, currentUserId, otherParticipant]); // Змінено otherParticipant?.id та otherParticipant?.name на otherParticipant

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

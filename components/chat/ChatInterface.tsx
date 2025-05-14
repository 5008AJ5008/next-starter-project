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
	createdAt: string;
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
	const [isLoading, setIsLoading] = useState(false); // Для Long Polling
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		setMessages(initialMessages);
		scrollToBottom();
	}, [initialMessages]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Функція для додавання нового повідомлення, отриманого від ChatMessageForm
	const handleNewMessageFromForm = (newMessage: Message) => {
		setMessages((prevMessages) => {
			if (!prevMessages.find((msg) => msg.id === newMessage.id)) {
				return [...prevMessages, newMessage];
			}
			return prevMessages;
		});
	};

	// Long Polling для отримання повідомлень від інших користувачів
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
					const data = (await response.json()) as PollResponse;
					if (!isActive) return;

					if (data.messages && data.messages.length > 0) {
						setMessages((prevMessages) => {
							const uniqueNewMessages = data.messages.filter(
								(newMessage) =>
									!prevMessages.some(
										(existingMessage) => existingMessage.id === newMessage.id
									)
							);
							if (uniqueNewMessages.length > 0) {
								return [...prevMessages, ...uniqueNewMessages];
							}
							return prevMessages;
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
					setTimeout(startPolling, 1000);
				}
			}
		};

		if (chatId) {
			startPolling();
		}

		return () => {
			isActive = false;
		};
	}, [chatId, messages, isLoading]);

	return (
		<div className="chat-interface-wrapper">
			{' '}
			{/* Ваш клас: display: flex; flex-direction: column; height: 100%; */}
			<header className="chat-header">
				{' '}
				{/* Ваш клас: flex-shrink: 0; ... */}
				<div className="chat-header-content">
					{' '}
					{/* Ваш клас: display: flex; align-items: center; ... */}
					{otherParticipant?.image && (
						<Image
							src={otherParticipant.image}
							alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
							width={40}
							height={40}
							className="chat-header-avatar" // Ваш клас
							style={{ objectFit: 'cover' }} // Додано для правильного масштабування
						/>
					)}
					<h1 className="chat-header-name">
						{' '}
						{/* Ваш клас */}
						{otherParticipant?.name || 'Unbekannter Benutzer'}
					</h1>
				</div>
			</header>
			<div className="chat-messages-list">
				{' '}
				{/* Ваш клас: flex-grow: 1; overflow-y: auto; padding: 1rem; ... */}
				{messages.length === 0 && (
					<p className="chat-no-messages-text">
						Noch keine Nachrichten in diesem Chat.
					</p>
				)}
				{messages.map((message) => (
					// Використовуємо ваші класи для контейнера повідомлення
					<div
						key={message.id}
						className={`message-container ${
							// Базовий клас
							message.authorId === currentUserId
								? 'my-message-container'
								: 'other-message-container' // Для вирівнювання
						}`}
					>
						{/* Аватар для чужих повідомлень */}
						{message.authorId !== currentUserId && message.author.image && (
							<Image
								src={message.author.image}
								alt={message.author.name || ''}
								width={24} // Розмір аватара в повідомленні
								height={24}
								className="message-avatar message-avatar--other" // Ваші класи
								style={{ objectFit: 'cover' }}
							/>
						)}
						{/* Бульбашка повідомлення */}
						<div
							className={`chat-message-bubble ${
								// Базовий клас для бульбашки
								message.authorId === currentUserId
									? 'my-message' // Клас для ваших повідомлень
									: 'other-message' // Клас для чужих повідомлень
							}`}
						>
							<p className="message-content">{message.content}</p>{' '}
							{/* Ваш клас для тексту */}
							<p
								className={`message-timestamp ${
									message.authorId === currentUserId
										? 'message-timestamp--own'
										: 'message-timestamp--other'
								}`}
							>
								{' '}
								{/* Ваші класи для часу */}
								{new Date(message.createdAt).toLocaleTimeString('de-DE', {
									hour: '2-digit',
									minute: '2-digit',
								})}
							</p>
						</div>
						{/* Аватар для ваших повідомлень */}
						{message.authorId === currentUserId && message.author.image && (
							<Image
								src={message.author.image}
								alt={message.author.name || ''}
								width={24} // Розмір аватара в повідомленні
								height={24}
								className="message-avatar message-avatar--own" // Ваші класи
								style={{ objectFit: 'cover' }}
							/>
						)}
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
			<div className="chat-form-container">
				{' '}
				{/* Ваш клас: flex-shrink: 0; ... */}
				<ChatMessageForm
					chatId={chatId}
					onMessageSent={handleNewMessageFromForm}
				/>
			</div>
		</div>
	);
}

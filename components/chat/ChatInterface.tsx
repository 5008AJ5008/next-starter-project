'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import ChatMessageForm from './ChatMessageForm';
import { markChatAsRead } from '@/actions/chatActions';

export interface Author {
	id: string;
	name: string | null;
	image: string | null;
}

export interface Message {
	id: string;
	content: string;
	createdAt: string;
	authorId: string | null;
	author: Author | null;
	chatId: string;
	isSystemMessage?: boolean | null;
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

/**
 * Stellt die Benutzeroberfläche für einen Chat dar.
 * Beinhaltet das Anzeigen von Nachrichten, das Senden neuer Nachrichten,
 * automatisches Scrollen, Markieren des Chats als gelesen und Long-Polling für neue Nachrichten.
 *
 * @param {ChatInterfaceProps} props - Die Eigenschaften für die Komponente.
 * @param {Message[]} props.initialMessages - Die anfänglich zu ladenden Nachrichten.
 * @param {string} props.chatId - Die ID des aktuellen Chats.
 * @param {string} props.currentUserId - Die ID des aktuell angemeldeten Benutzers.
 * @param {Author | null} props.otherParticipant - Die Informationen zum anderen Chat-Teilnehmer.
 * @returns JSX.Element - Die Chat-Oberfläche.
 */
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

	/**
	 * Scrollt das Nachrichtenfenster zum untersten Punkt.
	 */
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		setMessages(initialMessages);
	}, [initialMessages]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	/**
	 * Callback-Funktion, die aufgerufen wird, wenn eine neue Nachricht über das Formular gesendet wird.
	 * Fügt die neue Nachricht zum Nachrichten-State hinzu, falls sie noch nicht vorhanden ist.
	 */
	const handleNewMessageFromForm = useCallback((newMessage: Message) => {
		setMessages((prevMessages) => {
			if (!prevMessages.find((msg) => msg.id === newMessage.id)) {
				return [...prevMessages, newMessage];
			}
			return prevMessages;
		});
	}, []);

	useEffect(() => {
		if (chatId && currentUserId) {
			markChatAsRead(chatId).then((response) => {
				if (response.success) {
					// Log or state update if needed on successful mark as read
				} else {
					console.error(
						`Failed to mark chat ${chatId} as read:`,
						response.error
					);
				}
			});
		}
	}, [chatId, currentUserId]);

	useEffect(() => {
		pollingFunctionRef.current = async () => {
			if (isLoading) return;
			setIsLoading(true);

			const currentMessages = messages; // Capture current messages state for this poll request
			const lastTimestamp =
				currentMessages.length > 0
					? currentMessages[currentMessages.length - 1].createdAt
					: new Date(0).toISOString();

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
	}, [chatId, messages, isLoading, currentUserId, otherParticipant]);

	useEffect(() => {
		let isActive = true;
		let timeoutId: NodeJS.Timeout;

		const executePoll = async () => {
			if (!isActive) return;
			if (pollingFunctionRef.current) {
				await pollingFunctionRef.current();
			}
			if (isActive) {
				timeoutId = setTimeout(executePoll, 2000);
			}
		};

		if (chatId) {
			const initialPollTimeoutId = setTimeout(() => {
				if (isActive) executePoll();
			}, 500);
			return () => {
				clearTimeout(initialPollTimeoutId);
				isActive = false;
				clearTimeout(timeoutId);
			};
		}

		return () => {
			isActive = false;
			clearTimeout(timeoutId);
		};
	}, [chatId, currentUserId]);

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
				{messages.map((message) => {
					const isOwnMessage = message.authorId === currentUserId;
					const authorName = message.author?.name || 'System';
					const authorImage = message.author?.image;

					if (message.isSystemMessage) {
						return (
							<div key={message.id} className="message-row message-row--system">
								<p className="message-bubble message-bubble--system">
									{message.content}
								</p>
							</div>
						);
					}

					return (
						<div
							key={message.id}
							className={`message-row ${
								isOwnMessage ? 'message-row--own' : 'message-row--other'
							}`}
						>
							{!isOwnMessage && authorImage && (
								<Image
									src={authorImage}
									alt={authorName}
									width={24}
									height={24}
									className="message-avatar message-avatar--other"
									style={{ objectFit: 'cover' }}
								/>
							)}
							<div
								className={`message-bubble ${
									isOwnMessage ? 'message-bubble--own' : 'message-bubble--other'
								}`}
							>
								<p className="message-content">{message.content}</p>
								<p
									className={`message-timestamp ${
										isOwnMessage
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
							{isOwnMessage && authorImage && (
								<Image
									src={authorImage}
									alt={authorName}
									width={24}
									height={24}
									className="message-avatar message-avatar--own"
									style={{ objectFit: 'cover' }}
								/>
							)}
						</div>
					);
				})}
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

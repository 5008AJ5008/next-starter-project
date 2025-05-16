'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Message } from './ChatInterface';

type ChatMessageFormProps = {
	chatId: string;
	onMessageSent: (newMessage: Message) => void;
};

type SendMessageFormState = {
	status: 'success' | 'error';
	message?: string;
	errors?: {
		content?: string[];
	};
	newMessage?: Message;
} | null;

/**
 * Eine Hilfskomponente für die Absende-Schaltfläche des Chat-Formulars.
 * Zeigt einen Ladezustand an, während das Formular gesendet wird.
 * @returns JSX.Element - Die Absende-Schaltfläche.
 */
function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="chat-form-submit-button"
		>
			{pending ? 'Senden...' : 'Senden'}
		</button>
	);
}

/**
 * Stellt das Formular zum Senden von Chat-Nachrichten dar.
 * Verwendet Reacts `useActionState` Hook zur Handhabung des Formularzustands und der Server-Aktion.
 * Ruft `onMessageSent` auf, nachdem eine Nachricht erfolgreich gesendet wurde.
 * Das Eingabefeld ist eine kontrollierte Komponente.
 *
 * @param {ChatMessageFormProps} props - Die Eigenschaften für die Komponente.
 * @param {string} props.chatId - Die ID des Chats, an den die Nachricht gesendet wird.
 * @param {(newMessage: Message) => void} props.onMessageSent - Callback-Funktion, die nach dem erfolgreichen Senden einer Nachricht aufgerufen wird.
 * @returns JSX.Element - Das Formular zum Senden von Chat-Nachrichten.
 */
export default function ChatMessageForm({
	chatId,
	onMessageSent,
}: ChatMessageFormProps) {
	const sendMessageWithChatId = sendMessage.bind(null, chatId);
	const [formState, formAction] = useActionState<
		SendMessageFormState,
		FormData
	>(sendMessageWithChatId, null);

	const formRef = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		if (formState?.status === 'success') {
			setInputValue('');
			inputRef.current?.focus();
			if (formState.newMessage) {
				onMessageSent(formState.newMessage);
			} else {
				console.warn(
					'ChatMessageForm: newMessage is missing in formState on success.'
				);
			}
		}
	}, [formState, onMessageSent]);

	/**
	 * Aktualisiert den Zustand des Eingabewerts bei jeder Änderung.
	 * @param {ChangeEvent<HTMLInputElement>} event - Das Änderungsereignis des Eingabefelds.
	 */
	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
	};

	return (
		<form ref={formRef} action={formAction} className="chat-message-form">
			{' '}
			<input
				ref={inputRef}
				type="text"
				name="content"
				placeholder="Nachricht eingeben..."
				required
				className="chat-form-input"
				autoComplete="off"
				value={inputValue}
				onChange={handleInputChange}
			/>
			<SubmitButton />
			{formState?.status === 'error' &&
				formState.message &&
				!formState.errors?.content && (
					<p className="chat-form-error-message">{formState.message}</p>
				)}
			{formState?.errors?.content && (
				<p className="chat-form-error-message">{formState.errors.content[0]}</p>
			)}
		</form>
	);
}

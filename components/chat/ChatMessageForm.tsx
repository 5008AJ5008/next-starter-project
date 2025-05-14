'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useEffect, useRef } from 'react';
// 1. Імпортуємо тип Message з ChatInterface (переконайтеся, що він експортований)
import type { Message } from './ChatInterface';

type ChatMessageFormProps = {
	chatId: string;
	// 2. Розкоментовуємо та використовуємо onMessageSent
	onMessageSent: (newMessage: Message) => void;
};

// Тип для стану форми, що повертається з sendMessage
type SendMessageFormState = {
	status: 'success' | 'error';
	message?: string;
	errors?: {
		content?: string[];
	};
	// 3. Розкоментовуємо newMessage і використовуємо тип Message
	newMessage?: Message;
} | null;

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="chat-form-submit-button" // Використовуйте ваші CSS класи
		>
			{pending ? 'Senden...' : 'Senden'}
		</button>
	);
}

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

	useEffect(() => {
		if (formState?.status === 'success') {
			formRef.current?.reset(); // Скидаємо поля форми
			inputRef.current?.focus(); // Повертаємо фокус на поле вводу
			// 4. Якщо є нове повідомлення, викликаємо callback onMessageSent
			if (formState.newMessage) {
				onMessageSent(formState.newMessage);
			}
		}
	}, [formState, onMessageSent]);

	return (
		<form ref={formRef} action={formAction} className="chat-message-form">
			{' '}
			{/* Використовуйте ваші CSS класи */}
			<input
				ref={inputRef}
				type="text"
				name="content" // Це ім'я має відповідати тому, що очікує messageSchema в Server Action
				placeholder="Nachricht eingeben..."
				required
				className="chat-form-input" // Використовуйте ваші CSS класи
				autoComplete="off"
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

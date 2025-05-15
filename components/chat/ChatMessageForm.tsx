'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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

	// 1. Стан для значення поля вводу
	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		// console.log('ChatMessageForm formState updated:', formState);
		if (formState?.status === 'success') {
			setInputValue(''); // 2. Очищуємо стан inputValue після успішного надсилання
			// formRef.current?.reset(); // Це може бути вже не потрібно, оскільки інпут контрольований
			inputRef.current?.focus();
			if (formState.newMessage) {
				// console.log(
				// 	'ChatMessageForm calling onMessageSent with:',
				// 	formState.newMessage
				// );
				onMessageSent(formState.newMessage);
			} else {
				console.warn(
					'ChatMessageForm: newMessage is missing in formState on success.'
				);
			}
		}
	}, [formState, onMessageSent]);

	// 3. Обробник для оновлення стану inputValue
	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
	};

	return (
		<form ref={formRef} action={formAction} className="chat-message-form">
			{' '}
			{/* Використовуйте ваші CSS класи */}
			<input
				ref={inputRef}
				type="text"
				name="content" // Атрибут name все ще потрібен для Server Action FormData
				placeholder="Nachricht eingeben..."
				required
				className="chat-form-input" // Використовуйте ваші CSS класи
				autoComplete="off"
				value={inputValue} // 4. Прив'язуємо value до стану
				onChange={handleInputChange} // 5. Оновлюємо стан при зміні
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

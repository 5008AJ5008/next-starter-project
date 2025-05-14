'use client';

import { useFormStatus } from 'react-dom'; // Для React 19+
import { useActionState } from 'react';
// Для React 18: import { useFormState, useFormStatus } from 'react-dom';
import { sendMessage } from '@/actions/chatActions'; // Імпортуємо Server Action
import { useEffect, useRef } from 'react';

type ChatMessageFormProps = {
	chatId: string;
};

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
		>
			{pending ? 'Senden...' : 'Senden'} {/* Надсилання... / Надіслати */}
		</button>
	);
}

export default function ChatMessageForm({ chatId }: ChatMessageFormProps) {
	// Прив'язуємо chatId до Server Action sendMessage
	const sendMessageWithChatId = sendMessage.bind(null, chatId);
	const [formState, formAction] = useActionState(sendMessageWithChatId, null);

	const formRef = useRef<HTMLFormElement>(null); // Ref для доступу до форми
	const inputRef = useRef<HTMLInputElement>(null); // Ref для доступу до поля вводу

	// Очищуємо поле вводу після успішного надсилання
	useEffect(() => {
		if (formState?.status === 'success') {
			formRef.current?.reset(); // Скидаємо форму
			inputRef.current?.focus(); // Повертаємо фокус на поле вводу
		}
	}, [formState]);

	return (
		<form ref={formRef} action={formAction} className="flex items-center">
			<input
				ref={inputRef}
				type="text"
				name="content" // Це ім'я має відповідати тому, що очікує messageSchema
				placeholder="Nachricht eingeben..." // Введіть повідомлення...
				required
				className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
				autoComplete="off"
			/>
			<SubmitButton />
			{/* Можна відображати повідомлення про помилку валідації з formState?.errors?.content */}
			{formState?.status === 'error' &&
				formState.message &&
				!formState.errors?.content && (
					<p className="text-xs text-red-500 ml-2">{formState.message}</p>
				)}
			{formState?.errors?.content && (
				<p className="text-xs text-red-500 ml-2">
					{formState.errors.content[0]}
				</p>
			)}
		</form>
	);
}

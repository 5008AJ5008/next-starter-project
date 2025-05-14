'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile } from '@/actions/profileActions';
import { uploadProfilePhoto } from '@/actions/profileActions';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';

// Тип для даних користувача
type UserProfileData = {
	name: string | null;
	birthDate: Date | null;
	gender: string | null;
	city: string | null;
	aboutMe: string | null;
	image?: string | null;
};

// Тип для стану форми оновлення профілю
type UpdateFormState = {
	message: string;
	status: 'success' | 'error';
} | null;

// Тип для стану форми завантаження фото
type UploadFormState = {
	message: string;
	status: 'success' | 'error';
	imageUrl?: string | null;
} | null;

// Компонент кнопки для основної форми
function SubmitProfileButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{pending ? 'Speichern...' : 'Profil speichern'}
		</button>
	);
}

// Компонент кнопки для форми завантаження фото
function SubmitPhotoButton({ disabled }: { disabled?: boolean }) {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending || disabled}
			className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
		>
			{pending ? 'Hochladen...' : 'Foto hochladen'}
		</button>
	);
}

// Основний компонент форми
export function ProfileForm({ user }: { user: UserProfileData }) {
	const [updateFormState, updateFormAction] = useActionState<
		UpdateFormState,
		FormData
	>(updateProfile, null);
	const [uploadFormState, uploadFormAction] = useActionState<
		UploadFormState,
		FormData
	>(uploadProfilePhoto, null);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Стани для відображення повідомлень з таймером
	const [displayUpdateMessage, setDisplayUpdateMessage] =
		useState<UpdateFormState>(null);
	const [displayUploadMessage, setDisplayUploadMessage] =
		useState<UploadFormState>(null);

	const MESSAGE_TIMEOUT_MS = 5000; // 5 секунд

	// useEffect для повідомлення про оновлення профілю
	useEffect(() => {
		if (updateFormState?.message) {
			setDisplayUpdateMessage(updateFormState);
			const timer = setTimeout(() => {
				setDisplayUpdateMessage(null);
			}, MESSAGE_TIMEOUT_MS);
			return () => clearTimeout(timer); // Очищення таймера при розмонтуванні або повторному виклику
		}
	}, [updateFormState]); // Залежність від updateFormState

	// useEffect для повідомлення про завантаження фото
	useEffect(() => {
		if (uploadFormState?.message) {
			setDisplayUploadMessage(uploadFormState);
			const timer = setTimeout(() => {
				setDisplayUploadMessage(null);
			}, MESSAGE_TIMEOUT_MS);
			return () => clearTimeout(timer); // Очищення таймера
		}
	}, [uploadFormState]); // Залежність від uploadFormState

	const MAX_FILE_SIZE_MB = 5;
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setFileError(
					`Datei zu groß (max. ${MAX_FILE_SIZE_MB}MB). Bitte wählen Sie eine kleinere Datei.`
				);
				setSelectedFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
			} else if (!file.type.startsWith('image/')) {
				setFileError(
					'Nur Bilddateien sind erlaubt. Bitte wählen Sie eine Bilddatei.'
				);
				setSelectedFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
			} else {
				setSelectedFile(file);
				setFileError(null);
			}
		} else {
			setSelectedFile(null);
			setFileError(null);
		}
	};

	const formatDateForInput = (date: Date | null): string => {
		if (!date) return '';
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	if (uploadFormState?.status === 'success' && selectedFile) {
		setSelectedFile(null);
		setFileError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	return (
		<div className="space-y-8">
			<form
				action={uploadFormAction}
				className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50"
			>
				<h2 className="text-lg font-medium">Profilbild ändern</h2>
				<div className="flex items-center space-x-4">
					<div className="flex-shrink-0">
						{user.image || uploadFormState?.imageUrl ? (
							<Image
								src={uploadFormState?.imageUrl ?? user.image!}
								alt="Aktuelles Profilbild"
								width={80}
								height={80}
								className="rounded-full object-cover"
								key={uploadFormState?.imageUrl ?? user.image}
							/>
						) : (
							<div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
								<span>Kein Bild</span>
							</div>
						)}
					</div>
					<div className="flex-grow">
						<label
							htmlFor="profileImage"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Neues Foto auswählen (max. {MAX_FILE_SIZE_MB}MB)
						</label>
						<div className="flex items-center">
							<input
								type="file"
								id="profileImage"
								name="profileImage"
								accept="image/*"
								onChange={handleFileChange}
								ref={fileInputRef}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							<SubmitPhotoButton
								disabled={!selectedFile || Boolean(fileError)}
							/>
						</div>
						{selectedFile && !fileError && (
							<p className="mt-1 text-xs text-gray-600">
								Ausgewählt: {selectedFile.name}
							</p>
						)}
						{fileError && (
							<p className="mt-1 text-xs text-red-600">{fileError}</p>
						)}
					</div>
				</div>
				{/* Відображаємо displayUploadMessage замість uploadFormState */}
				{displayUploadMessage?.message && (
					<p
						className={`mt-2 text-sm ${
							displayUploadMessage.status === 'success'
								? 'text-green-600'
								: 'text-red-600'
						}`}
					>
						{displayUploadMessage.message}
					</p>
				)}
			</form>

			<form action={updateFormAction} className="space-y-4">
				<h2 className="text-lg font-medium">Profilinformationen bearbeiten</h2>
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700"
					>
						Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						placeholder="Ihr Name, max. 20 Zeichen"
						defaultValue={user.name ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				<div>
					<label
						htmlFor="birthDate"
						className="block text-sm font-medium text-gray-700"
					>
						Geburtsdatum
					</label>
					<input
						type="date"
						id="birthDate"
						name="birthDate"
						defaultValue={formatDateForInput(user.birthDate)}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				<div>
					<label
						htmlFor="gender"
						className="block text-sm font-medium text-gray-700"
					>
						Geschlecht {/* Стать */}
					</label>
					<select
						id="gender"
						name="gender"
						defaultValue={user.gender ?? ''} // Встановлюємо поточне значення
						className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					>
						<option value="">Bitte wählen...</option>{' '}
						{/* Будь ласка, виберіть... */}
						<option value="weiblich">Weiblich</option> {/* Жіноча */}
						<option value="männlich">Männlich</option> {/* Чоловіча */}
						<option value="divers">Divers</option> {/* Інша/Різна */}
					</select>
				</div>
				<div>
					<label
						htmlFor="city"
						className="block text-sm font-medium text-gray-700"
					>
						Stadt
					</label>
					<input
						type="text"
						id="city"
						name="city"
						placeholder="Ihre Stadt, max. 20 Zeichen"
						defaultValue={user.city ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				<div>
					<label
						htmlFor="aboutMe"
						className="block text-sm font-medium text-gray-700"
					>
						Über mich
					</label>
					<textarea
						id="aboutMe"
						name="aboutMe"
						placeholder="Ihr Text, max. 50 Zeichen"
						rows={4}
						defaultValue={user.aboutMe ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					></textarea>
				</div>
				<div>
					<SubmitProfileButton />
					{/* Відображаємо displayUpdateMessage замість updateFormState */}
					{displayUpdateMessage?.message && (
						<p
							className={`mt-2 text-sm ${
								displayUpdateMessage.status === 'success'
									? 'text-green-600'
									: 'text-red-600'
							}`}
						>
							{displayUpdateMessage.message}
						</p>
					)}
				</div>
			</form>
		</div>
	);
}

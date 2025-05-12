'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile } from '@/actions/profileActions';
// 1. Імпортуємо Server Action для завантаження фото
import { uploadProfilePhoto } from '@/actions/profileActions'; // Або з '@/actions/photoActions'
// 2. Імпортуємо Image для відображення аватара
import Image from 'next/image';
// 3. Імпортуємо хуки для стану файлу та доступу до елемента
import { useState, useRef } from 'react';

// 4. Додаємо 'image' до типу даних користувача
type UserProfileData = {
	name: string | null;
	birthDate: Date | null;
	gender: string | null;
	city: string | null;
	aboutMe: string | null;
	image?: string | null; // Додано поле для поточного URL зображення
};

// Тип для стану форми оновлення профілю
type UpdateFormState = {
	message: string;
	status: 'success' | 'error';
} | null;

// 5. Додаємо тип для стану форми завантаження фото
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

// 6. Додаємо компонент кнопки для форми завантаження фото
function SubmitPhotoButton() {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
		>
			{pending ? 'Hochladen...' : 'Foto hochladen'}
		</button>
	);
}

// Основний компонент форми
export function ProfileForm({ user }: { user: UserProfileData }) {
	// Стан для форми оновлення текстових даних
	const [updateFormState, updateFormAction] = useActionState<
		UpdateFormState,
		FormData
	>(updateProfile, null);
	// 7. Додаємо стан для форми завантаження фото
	const [uploadFormState, uploadFormAction] = useActionState<
		UploadFormState,
		FormData
	>(uploadProfilePhoto, null);

	// 8. Додаємо стан для імені файлу та ref для input
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 9. Додаємо обробник зміни файлу
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		setFileName(file ? file.name : null);
	};

	// Функція для форматування дати (залишається без змін)
	const formatDateForInput = (date: Date | null): string => {
		if (!date) return '';
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// 10. Додаємо логіку для скидання імені файлу після успішного завантаження
	if (uploadFormState?.status === 'success' && fileName) {
		setFileName(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	return (
		// 11. Обгортаємо обидві форми в один div для кращого структурування
		<div className="space-y-8">
			{/* 12. Додаємо нову форму для завантаження фото */}
			<form
				action={uploadFormAction}
				className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50"
			>
				<h2 className="text-lg font-medium">Profilbild ändern</h2>
				<div className="flex items-center space-x-4">
					{/* Відображення поточного/нового фото */}
					<div className="flex-shrink-0">
						{user.image || uploadFormState?.imageUrl ? ( // Перевіряємо обидва джерела
							<Image
								src={uploadFormState?.imageUrl ?? user.image!} // Використовуємо нове фото якщо є, інакше старе
								alt="Aktuelles Profilbild"
								width={80}
								height={80}
								className="rounded-full object-cover"
								key={uploadFormState?.imageUrl ?? user.image} // Ключ для оновлення
							/>
						) : (
							<div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
								<span>Kein Bild</span>
							</div>
						)}
					</div>
					{/* Поле вибору файлу та кнопка завантаження */}
					<div className="flex-grow">
						<label
							htmlFor="profileImage"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Neues Foto auswählen
						</label>
						<div className="flex items-center">
							<input
								type="file"
								id="profileImage"
								name="profileImage" // Важливо: name="profileImage"
								accept="image/*"
								onChange={handleFileChange}
								ref={fileInputRef}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							<SubmitPhotoButton />
						</div>
						{/* Відображення імені вибраного файлу */}
						{fileName && (
							<p className="mt-1 text-xs text-gray-600">
								Ausgewählt: {fileName}
							</p>
						)}
					</div>
				</div>
				{/* Повідомлення про стан завантаження фото */}
				{uploadFormState?.message && (
					<p
						className={`mt-2 text-sm ${
							uploadFormState.status === 'success'
								? 'text-green-600'
								: 'text-red-600'
						}`}
					>
						{uploadFormState.message}
					</p>
				)}
			</form>

			{/* Ваша існуюча форма для оновлення текстових даних профілю */}
			<form action={updateFormAction} className="space-y-4">
				<h2 className="text-lg font-medium">Profilinformationen bearbeiten</h2>
				{/* ... всі ваші поля input/textarea для name, birthDate, gender, city, aboutMe ... */}
				{/* Поле для імені */}
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
						defaultValue={user.name ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				{/* Поле для дати народження */}
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
				{/* Поле для статі */}
				<div>
					<label
						htmlFor="gender"
						className="block text-sm font-medium text-gray-700"
					>
						Geschlecht
					</label>
					<input
						type="text"
						id="gender"
						name="gender"
						defaultValue={user.gender ?? ''}
						placeholder="z.B. männlich, weiblich, divers"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				{/* Поле для міста */}
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
						defaultValue={user.city ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
				{/* Поле "Про себе" */}
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
						rows={4}
						defaultValue={user.aboutMe ?? ''}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					></textarea>
				</div>
				{/* Кнопка надсилання та повідомлення про стан */}
				<div>
					<SubmitProfileButton />
					{updateFormState?.message && (
						<p
							className={`mt-2 text-sm ${
								updateFormState.status === 'success'
									? 'text-green-600'
									: 'text-red-600'
							}`}
						>
							{updateFormState.message}
						</p>
					)}
				</div>
			</form>
		</div>
	);
}

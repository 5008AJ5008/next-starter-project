'use client';
import { useFormState, useFormStatus } from 'react-dom';

// Тип для даних користувача, які передаються у форму
type UserProfileData = {
	name: string | null;
	birthDate: Date | null;
	gender: string | null;
	city: string | null;
	aboutMe: string | null;
};

// Компонент кнопки надсилання, що показує статус
function SubmitButton() {
	const { pending } = useFormStatus(); // Хук для відстеження стану надсилання форми

	return (
		<button
			type="submit"
			disabled={pending} // Деактивуємо кнопку під час надсилання
			className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{pending ? 'Speichern...' : 'Profil speichern'}{' '}
			{/* Зберігаємо... / Зберегти профіль */}
		</button>
	);
}

// Компонент форми
export function ProfileForm({ user }: { user: UserProfileData }) {
	// Використовуємо useFormState для обробки стану форми та відповіді від Server Action
	const [formState, formAction] = useFormState(updateProfile, null); // null - початковий стан

	// Функція для форматування дати у формат YYYY-MM-DD для input type="date"
	const formatDateForInput = (date: Date | null): string => {
		if (!date) return '';
		// Обережно з часовими зонами! Цей метод використовує локальну зону браузера.
		// Для надійності може знадобитися бібліотека date-fns або схожа.
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	return (
		<form action={formAction} className="space-y-4">
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
					defaultValue={user.name ?? ''} // Заповнюємо поточним значенням
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			{/* Поле для дати народження */}
			<div>
				<label
					htmlFor="birthDate"
					className="block text-sm font-medium text-gray-700"
				>
					Geburtsdatum {/* Дата народження */}
				</label>
				<input
					type="date"
					id="birthDate"
					name="birthDate"
					defaultValue={formatDateForInput(user.birthDate)} // Форматуємо дату
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			{/* Поле для статі */}
			<div>
				<label
					htmlFor="gender"
					className="block text-sm font-medium text-gray-700"
				>
					Geschlecht {/* Стать */}
				</label>
				<input
					type="text"
					id="gender"
					name="gender"
					defaultValue={user.gender ?? ''}
					placeholder="z.B. männlich, weiblich, divers" // напр., чоловіча, жіноча, інша
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			{/* Поле для міста */}
			<div>
				<label
					htmlFor="city"
					className="block text-sm font-medium text-gray-700"
				>
					Stadt {/* Місто */}
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
					Über mich {/* Про мене */}
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
				<SubmitButton />
				{formState?.message && (
					<p
						className={`mt-2 text-sm ${
							formState.status === 'success' ? 'text-green-600' : 'text-red-600'
						}`}
					>
						{formState.message}
					</p>
				)}
			</div>
		</form>
	);
}

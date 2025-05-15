'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Для навігації та читання поточних параметрів
// Іконка для кнопки фільтрів, наприклад
import { FaFilter } from 'react-icons/fa';

export default function UserFilters() {
	const router = useRouter();
	const searchParams = useSearchParams(); // Отримуємо поточні параметри пошуку

	// Стани для значень фільтрів, ініціалізуємо з поточних URL параметрів
	const [city, setCity] = useState(searchParams.get('city') || '');
	const [minAge, setMinAge] = useState(searchParams.get('minAge') || '');
	const [maxAge, setMaxAge] = useState(searchParams.get('maxAge') || '');
	const [gender, setGender] = useState(searchParams.get('gender') || '');

	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

	const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const params = new URLSearchParams();

		if (city) params.set('city', city);
		if (minAge) params.set('minAge', minAge);
		if (maxAge) params.set('maxAge', maxAge);
		if (gender) params.set('gender', gender);

		// Переходимо на головну сторінку з новими параметрами фільтрації
		// Якщо параметрів немає, рядок запиту буде порожнім, що скине фільтри
		router.push(`/?${params.toString()}`);
		setIsFilterMenuOpen(false); // Закриваємо меню після застосування
	};

	const handleResetFilters = () => {
		setCity('');
		setMinAge('');
		setMaxAge('');
		setGender('');
		router.push('/'); // Переходимо на головну без параметрів
		setIsFilterMenuOpen(false);
	};

	return (
		<div className="user-filters-container relative mb-4">
			{' '}
			{/* Ваш CSS клас */}
			<button
				onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
				className="user-filters-button" // Ваш CSS клас для кнопки
				aria-expanded={isFilterMenuOpen}
				aria-controls="filter-menu"
			>
				<FaFilter className="mr-2" /> {/* Іконка */}
				Filter {/* Або інший текст */}
			</button>
			{isFilterMenuOpen && (
				<div
					id="filter-menu"
					className="user-filters-dropdown" // Ваш CSS клас для випадаючого меню
					// Стилі для позиціонування та вигляду мають бути в CSS
					// Наприклад: position: absolute; top: 100%; left: 0; background-color: white; padding: 1rem; border: 1px solid #ccc; z-index: 10;
				>
					<form onSubmit={handleApplyFilters} className="space-y-4">
						<div>
							<label
								htmlFor="filter-city"
								className="block text-sm font-medium"
							>
								Stadt
							</label>
							<input
								type="text"
								id="filter-city"
								value={city}
								onChange={(e) => setCity(e.target.value)}
								className="filter-input" // Ваш CSS клас
								placeholder="z.B. Berlin"
							/>
						</div>

						<div className="flex space-x-2">
							<div className="flex-1">
								<label
									htmlFor="filter-min-age"
									className="block text-sm font-medium"
								>
									Alter (min)
								</label>
								<input
									type="number"
									id="filter-min-age"
									value={minAge}
									onChange={(e) => setMinAge(e.target.value)}
									min="18"
									className="filter-input" // Ваш CSS клас
									placeholder="18"
								/>
							</div>
							<div className="flex-1">
								<label
									htmlFor="filter-max-age"
									className="block text-sm font-medium"
								>
									Alter (max)
								</label>
								<input
									type="number"
									id="filter-max-age"
									value={maxAge}
									onChange={(e) => setMaxAge(e.target.value)}
									min="18"
									className="filter-input" // Ваш CSS клас
									placeholder="99"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="filter-gender"
								className="block text-sm font-medium"
							>
								Geschlecht
							</label>
							<select
								id="filter-gender"
								value={gender}
								onChange={(e) => setGender(e.target.value)}
								className="filter-select" // Ваш CSS клас
							>
								<option value="">Alle</option>
								<option value="männlich">Männlich</option>
								<option value="weiblich">Weiblich</option>
								<option value="divers">Divers</option>
							</select>
						</div>

						<div className="flex justify-between">
							<button type="submit" className="filter-button-apply">
								{' '}
								{/* Ваш CSS клас */}
								Filter anwenden
							</button>
							<button
								type="button"
								onClick={handleResetFilters}
								className="filter-button-reset"
							>
								{' '}
								{/* Ваш CSS клас */}
								Zurücksetzen
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

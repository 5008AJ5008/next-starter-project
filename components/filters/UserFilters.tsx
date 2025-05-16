'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaFilter } from 'react-icons/fa';

/**
 * Stellt eine Benutzeroberfläche zum Filtern von Benutzerprofilen bereit.
 * Ermöglicht das Filtern nach Stadt, Mindest-/Höchstalter und Geschlecht.
 * Die Filterwerte werden aus den aktuellen URL-Suchparametern initialisiert und
 * bei Anwendung oder Zurücksetzung über den Next.js Router aktualisiert.
 * Die Filter erscheinen in einem aufklappbaren Menü.
 *
 * @returns JSX.Element - Die Filterkomponente für Benutzer.
 */
export default function UserFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [city, setCity] = useState(searchParams.get('city') || '');
	const [minAge, setMinAge] = useState(searchParams.get('minAge') || '');
	const [maxAge, setMaxAge] = useState(searchParams.get('maxAge') || '');
	const [gender, setGender] = useState(searchParams.get('gender') || '');

	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

	/**
	 * Behandelt das Absenden des Filterformulars.
	 * Erstellt eine neue URL mit den aktuellen Filterparametern und navigiert dorthin.
	 * Schließt das Filtermenü nach der Anwendung.
	 * @param {FormEvent<HTMLFormElement>} event - Das Formular-Absendeereignis.
	 */
	const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const params = new URLSearchParams();

		if (city) params.set('city', city);
		if (minAge) params.set('minAge', minAge);
		if (maxAge) params.set('maxAge', maxAge);
		if (gender) params.set('gender', gender);

		router.push(`/?${params.toString()}`);
		setIsFilterMenuOpen(false);
	};

	/**
	 * Setzt alle Filterwerte zurück und navigiert zur Hauptseite ohne Suchparameter.
	 * Schließt das Filtermenü nach dem Zurücksetzen.
	 */
	const handleResetFilters = () => {
		setCity('');
		setMinAge('');
		setMaxAge('');
		setGender('');
		router.push('/');
		setIsFilterMenuOpen(false);
	};

	return (
		<div className="user-filters-container relative mb-4">
			{' '}
			<button
				onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
				className="user-filters-button"
				aria-expanded={isFilterMenuOpen}
				aria-controls="filter-menu"
			>
				<FaFilter className="mr-2" />
				Filter
			</button>
			{isFilterMenuOpen && (
				<div id="filter-menu" className="user-filters-dropdown">
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
								className="filter-input"
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
									className="filter-input"
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
									className="filter-input"
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
								className="filter-select"
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
								Filter anwenden
							</button>
							<button
								type="button"
								onClick={handleResetFilters}
								className="filter-button-reset"
							>
								{' '}
								Zurücksetzen
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

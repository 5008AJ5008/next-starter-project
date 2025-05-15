'use client';

import React from 'react';
import { CgClose } from 'react-icons/cg'; // Іконка для кнопки закриття (опціонально)

type DeleteProfileModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void>; // Функція підтвердження може бути асинхронною
	isDeleting?: boolean; // Опціональний стан для індикації процесу видалення
};

export default function DeleteProfileModal({
	isOpen,
	onClose,
	onConfirm,
	isDeleting = false, // Значення за замовчуванням
}: DeleteProfileModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		// Оверлей (фон)
		// Використовуйте ваші CSS класи для стилізації
		<div
			className="delete-modal-overlay" // Клас для CSS
			// style={{
			//   position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
			//   backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
			//   alignItems: 'center', justifyContent: 'center', zIndex: 50
			// }}
			onClick={onClose} // Закриття при кліку на фон
		>
			{/* Саме модальне вікно */}
			<div
				className="delete-modal-content" // Клас для CSS
				// style={{
				//   backgroundColor: 'white', padding: '20px', borderRadius: '8px',
				//   textAlign: 'center', maxWidth: '400px', width: '90%'
				// }}
				onClick={(e) => e.stopPropagation()} // Запобігає закриттю при кліку на саме вікно
			>
				{/* Опціональна кнопка закриття у кутку */}
				<button
					onClick={onClose}
					className="delete-modal-close-button"
					aria-label="Schließen"
				>
					<CgClose size={20} />
				</button>

				<h2 className="delete-modal-title">Profil endgültig löschen?</h2>
				<p className="delete-modal-text">
					Sind Sie sicher, dass Sie Ihr Profil endgültig löschen möchten? Alle
					Ihre Daten gehen verloren und diese Aktion kann nicht rückgängig
					gemacht werden.
				</p>
				<div className="delete-modal-actions">
					{' '}
					{/* Клас для контейнера кнопок */}
					<button
						onClick={onClose}
						disabled={isDeleting} // Деактивуємо під час видалення
						className="delete-modal-button delete-modal-button--cancel" // Класи для CSS
					>
						Abbrechen
					</button>
					<button
						onClick={onConfirm}
						disabled={isDeleting} // Деактивуємо під час видалення
						className="delete-modal-button delete-modal-button--confirm" // Класи для CSS
					>
						{isDeleting ? 'Löschen...' : 'Endgültig löschen'}
					</button>
				</div>
			</div>
		</div>
	);
}

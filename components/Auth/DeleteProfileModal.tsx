'use client';

import React from 'react';
import { CgClose } from 'react-icons/cg';

type DeleteProfileModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void>;
	isDeleting?: boolean;
};

/**
 * Stellt ein modales Fenster zur Bestätigung der Profillöschung dar.
 * Ermöglicht dem Benutzer, die Löschaktion abzubrechen oder zu bestätigen.
 * Zeigt einen Ladezustand an, während die Löschung durchgeführt wird.
 *
 * @param {DeleteProfileModalProps} props - Die Eigenschaften für die Komponente.
 * @param {boolean} props.isOpen - Bestimmt, ob das Modal sichtbar ist.
 * @param {() => void} props.onClose - Funktion, die aufgerufen wird, wenn das Modal geschlossen werden soll (z.B. Klick auf Abbrechen, Schließen-Button oder Overlay).
 * @param {() => Promise<void>} props.onConfirm - Asynchrone Funktion, die aufgerufen wird, wenn der Benutzer die Löschung bestätigt.
 * @param {boolean} [props.isDeleting=false] - Zeigt an, ob der Löschvorgang gerade ausgeführt wird (optional).
 * @returns JSX.Element | null - Das Modal-JSX-Element, wenn `isOpen` true ist, andernfalls null.
 */
export default function DeleteProfileModal({
	isOpen,
	onClose,
	onConfirm,
	isDeleting = false,
}: DeleteProfileModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="delete-modal-overlay" onClick={onClose}>
			<div
				className="delete-modal-content"
				onClick={(e) => e.stopPropagation()}
			>
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
					<button
						onClick={onClose}
						disabled={isDeleting}
						className="delete-modal-button delete-modal-button--cancel"
					>
						Abbrechen
					</button>
					<button
						onClick={onConfirm}
						disabled={isDeleting}
						className="delete-modal-button delete-modal-button--confirm"
					>
						{isDeleting ? 'Löschen...' : 'Endgültig löschen'}
					</button>
				</div>
			</div>
		</div>
	);
}

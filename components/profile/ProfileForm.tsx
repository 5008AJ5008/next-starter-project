'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile } from '@/actions/profileActions';
import { uploadProfilePhoto } from '@/actions/profileActions';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';

type UserProfileData = {
	name: string | null;
	birthDate: Date | null;
	gender: string | null;
	city: string | null;
	aboutMe: string | null;
	image?: string | null;
};

type UpdateFormState = {
	message: string;
	status: 'success' | 'error';
} | null;

type UploadFormState = {
	message: string;
	status: 'success' | 'error';
	imageUrl?: string | null;
} | null;

/**
 * Eine Absende-Schaltfläche für das Formular zur Profilaktualisierung.
 * Zeigt einen Ladezustand an ("Speichern..."), während die Server-Aktion ausgeführt wird.
 * @returns JSX.Element - Die Absende-Schaltfläche für Profildaten.
 */
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

/**
 * Eine Absende-Schaltfläche für das Formular zum Hochladen von Profilfotos.
 * Zeigt einen Ladezustand an ("Hochladen..."), während die Server-Aktion ausgeführt wird.
 * @param {{ disabled?: boolean }} props - Eigenschaften für die Schaltfläche.
 * @param {boolean} [props.disabled] - Deaktiviert die Schaltfläche zusätzlich zum Ladezustand.
 * @returns JSX.Element - Die Absende-Schaltfläche für das Profilfoto.
 */
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

/**
 * Stellt ein Formular zur Bearbeitung von Benutzerprofildaten und zum Hochladen eines Profilbildes dar.
 * Enthält zwei separate Formulare für die Aktualisierung von Textdaten und das Hochladen von Bildern.
 * Zeigt Erfolgs- oder Fehlermeldungen nach Server-Aktionen zeitgesteuert an.
 * Validiert die Dateigröße und den Dateityp für das hochgeladene Bild.
 * @param {{ user: UserProfileData }} props - Die Eigenschaften für die Komponente.
 * @param {UserProfileData} props.user - Die initialen Profildaten des Benutzers.
 * @returns JSX.Element - Die Komponente mit den Profilbearbeitungsformularen.
 */
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

	const [displayUpdateMessage, setDisplayUpdateMessage] =
		useState<UpdateFormState>(null);
	const [displayUploadMessage, setDisplayUploadMessage] =
		useState<UploadFormState>(null);

	const MESSAGE_TIMEOUT_MS = 5000;

	useEffect(() => {
		if (updateFormState?.message) {
			setDisplayUpdateMessage(updateFormState);
			const timer = setTimeout(() => {
				setDisplayUpdateMessage(null);
			}, MESSAGE_TIMEOUT_MS);
			return () => clearTimeout(timer);
		}
	}, [updateFormState]);

	useEffect(() => {
		if (uploadFormState?.message) {
			setDisplayUploadMessage(uploadFormState);
			const timer = setTimeout(() => {
				setDisplayUploadMessage(null);
			}, MESSAGE_TIMEOUT_MS);
			return () => clearTimeout(timer);
		}
	}, [uploadFormState]);

	const MAX_FILE_SIZE_MB = 5;
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	/**
	 * Behandelt Änderungen an der Dateiauswahl für das Profilbild.
	 * Validiert Dateigröße und -typ und aktualisiert den Zustand entsprechend.
	 * @param {ChangeEvent<HTMLInputElement>} event - Das Änderungsereignis des Datei-Eingabefelds.
	 */
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

	/**
	 * Formatiert ein Datumsobjekt in einen String im Format YYYY-MM-DD für das Datums-Eingabefeld.
	 * @param {Date | null} date - Das zu formatierende Datumsobjekt.
	 * @returns {string} Das formatierte Datum als String oder ein leerer String, wenn das Datum null ist.
	 */
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
		<div className="profile-sections-container">
			<form
				action={uploadFormAction}
				className="profile-form photo-upload-form"
			>
				<h2 className="form-title">Profilbild ändern</h2>
				<div className="photo-upload-area">
					<div className="profile-image-wrapper">
						{user.image || uploadFormState?.imageUrl ? (
							<Image
								src={uploadFormState?.imageUrl ?? user.image!}
								alt="Aktuelles Profilbild"
								width={80}
								height={80}
								className="profile-image"
								key={uploadFormState?.imageUrl ?? user.image}
							/>
						) : (
							<div className="profile-image-placeholder">
								<span>Kein Bild</span>
							</div>
						)}
					</div>
					<div className="photo-input-section">
						<label htmlFor="profileImage" className="form-label">
							Neues Foto auswählen (max. {MAX_FILE_SIZE_MB}MB)
						</label>
						<div className="file-input-group">
							<input
								type="file"
								id="profileImage"
								name="profileImage"
								accept="image/*"
								onChange={handleFileChange}
								ref={fileInputRef}
								className="file-input"
							/>
							<SubmitPhotoButton
								disabled={!selectedFile || Boolean(fileError)}
							/>
						</div>
						{selectedFile && !fileError && (
							<p className="form-hint form-hint-default">
								Ausgewählt: {selectedFile.name}
							</p>
						)}
						{fileError && (
							<p className="form-hint form-error-text">{fileError}</p>
						)}
					</div>
				</div>
				{displayUploadMessage?.message && (
					<p
						className={`form-message ${
							displayUploadMessage.status === 'success'
								? 'form-message-success'
								: 'form-message-error'
						}`}
					>
						{displayUploadMessage.message}
					</p>
				)}
			</form>

			<form
				action={updateFormAction}
				className="profile-form profile-info-form"
			>
				<h2 className="form-title">Profilinformationen bearbeiten</h2>
				<div>
					<label htmlFor="name" className="form-label">
						Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						placeholder="Ihr Name, max. 20 Zeichen"
						defaultValue={user.name ?? ''}
						className="form-input"
					/>
				</div>
				<div>
					<label htmlFor="birthDate" className="form-label">
						Geburtsdatum
					</label>
					<input
						type="date"
						id="birthDate"
						name="birthDate"
						defaultValue={formatDateForInput(user.birthDate)}
						className="form-input"
					/>
				</div>
				<div>
					<label htmlFor="gender" className="form-label">
						Geschlecht
					</label>
					<select
						id="gender"
						name="gender"
						defaultValue={user.gender ?? ''}
						className="form-input form-select"
					>
						<option value="">Bitte wählen...</option>{' '}
						<option value="weiblich">Weiblich</option>
						<option value="männlich">Männlich</option>
						<option value="divers">Divers</option>
					</select>
				</div>
				<div>
					<label htmlFor="city" className="form-label">
						Stadt
					</label>
					<input
						type="text"
						id="city"
						name="city"
						placeholder="Ihre Stadt, max. 20 Zeichen"
						defaultValue={user.city ?? ''}
						className="form-input"
					/>
				</div>
				<div>
					<label htmlFor="aboutMe" className="form-label">
						Über mich
					</label>
					<textarea
						id="aboutMe"
						name="aboutMe"
						placeholder="Ihr Text, max. 50 Zeichen"
						rows={4}
						defaultValue={user.aboutMe ?? ''}
						className="form-input form-textarea"
					></textarea>
				</div>
				<div>
					<SubmitProfileButton />
					{displayUpdateMessage?.message && (
						<p
							className={`form-message ${
								displayUpdateMessage.status === 'success'
									? 'form-message-success'
									: 'form-message-error'
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

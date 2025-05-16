'use client';

import { useState, useTransition } from 'react';
import { togglePhotoLike } from '@/actions/likeActions';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import type { MouseEvent as ReactMouseEvent } from 'react';

type LikeButtonProps = {
	likedUserId: string;
	initialIsLiked: boolean;
	currentUserId?: string;
};

/**
 * Stellt eine Schaltfläche zum Liken oder Entliken eines Benutzerprofils/Fotos dar.
 * Verwendet optimistisches Update für eine reaktionsschnelle Benutzeroberfläche und zeigt einen Ladezustand an.
 * Die Schaltfläche wird nicht angezeigt, wenn der aktuelle Benutzer das eigene Profil betrachtet oder nicht angemeldet ist.
 * Bei einem Match (gegenseitiges Liken) wird eine Konsolennachricht ausgegeben.
 *
 * @param {LikeButtonProps} props - Die Eigenschaften für die Komponente.
 * @param {string} props.likedUserId - Die ID des Benutzers, dessen Profil/Foto geliked wird.
 * @param {boolean} props.initialIsLiked - Der anfängliche Like-Status.
 * @param {string} [props.currentUserId] - Die ID des aktuell angemeldeten Benutzers.
 * @returns JSX.Element | null - Die Like-Schaltfläche oder null, wenn sie nicht angezeigt werden soll.
 */
export default function LikeButton({
	likedUserId,
	initialIsLiked,
	currentUserId,
}: LikeButtonProps) {
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [isPending, startTransition] = useTransition();

	if (!currentUserId || currentUserId === likedUserId) {
		return null;
	}

	/**
	 * Behandelt das Umschalten des Like-Status.
	 * Stoppt die Ereignisweitergabe und verhindert Standardaktionen.
	 * Führt ein optimistisches UI-Update durch und ruft die Server-Aktion `togglePhotoLike` auf.
	 * Behandelt Erfolgs- und Fehlerantworten der Server-Aktion.
	 * @param {ReactMouseEvent<HTMLButtonElement>} event - Das Klick-Ereignis der Schaltfläche.
	 */
	const handleToggleLike = async (
		event: ReactMouseEvent<HTMLButtonElement>
	) => {
		event.stopPropagation();
		event.preventDefault();

		startTransition(async () => {
			const newIsLikedState = !isLiked;
			setIsLiked(newIsLikedState);

			const response = await togglePhotoLike(likedUserId);

			if (!response.success) {
				setIsLiked(!newIsLikedState);
				console.error(response.error || 'Fehler beim Umschalten des Likes.');
				alert(
					response.error ||
						'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.'
				);
			} else {
				if (typeof response.isLiked === 'boolean') {
					setIsLiked(response.isLiked);
				}

				if (response.isMatch && response.chatId) {
					console.log(
						`CLIENT: Match! Chat ID: ${response.chatId}. Consider UI update.`
					);
				}
			}
		});
	};

	return (
		<button
			onClick={handleToggleLike}
			disabled={isPending}
			className="like-button p-2 rounded-full hover:bg-pink-100 disabled:opacity-50"
			aria-label={isLiked ? 'Like entfernen' : 'Like hinzufügen'}
			title={isLiked ? 'Like entfernen' : 'Like hinzufügen'}
		>
			{isPending ? (
				<span className="loading-spinner"></span>
			) : isLiked ? (
				<FaHeart size={24} className="text-red-500" />
			) : (
				<FaRegHeart size={24} className="text-gray-500" />
			)}
		</button>
	);
}

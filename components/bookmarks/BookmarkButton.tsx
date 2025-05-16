'use client';

import { useState, useTransition } from 'react';
import { toggleBookmark } from '@/actions/bookmarkActions';
import { FaStar, FaRegStar } from 'react-icons/fa';

type BookmarkButtonProps = {
	bookmarkedUserId: string;
	initialIsBookmarked: boolean;
	currentUserId?: string;
};

/**
 * Stellt eine Schaltfläche zum Hinzufügen oder Entfernen eines Lesezeichens für ein Benutzerprofil dar.
 * Verwendet optimistisches Update für eine reaktionsschnelle Benutzeroberfläche und zeigt einen Ladezustand an.
 * Die Schaltfläche wird nicht angezeigt, wenn der aktuelle Benutzer das eigene Profil betrachtet oder nicht angemeldet ist.
 *
 * @param {BookmarkButtonProps} props - Die Eigenschaften für die Komponente.
 * @param {string} props.bookmarkedUserId - Die ID des Benutzers, dessen Profil mit einem Lesezeichen versehen werden soll.
 * @param {boolean} props.initialIsBookmarked - Der anfängliche Lesezeichenstatus.
 * @param {string} [props.currentUserId] - Die ID des aktuell angemeldeten Benutzers.
 * @returns JSX.Element | null - Die Lesezeichen-Schaltfläche oder null, wenn sie nicht angezeigt werden soll.
 */
export default function BookmarkButton({
	bookmarkedUserId,
	initialIsBookmarked,
	currentUserId,
}: BookmarkButtonProps) {
	const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
	const [isPending, startTransition] = useTransition();

	if (!currentUserId || currentUserId === bookmarkedUserId) {
		return null;
	}

	const handleToggleBookmark = async () => {
		startTransition(async () => {
			setIsBookmarked(!isBookmarked);
			const response = await toggleBookmark(bookmarkedUserId);
			if (!response.success) {
				setIsBookmarked(isBookmarked);
				console.error(
					response.error || 'Fehler beim Umschalten des Lesezeichens.'
				);
				alert(
					response.error ||
						'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.'
				);
			} else {
				if (typeof response.isBookmarked === 'boolean') {
					setIsBookmarked(response.isBookmarked);
				}
			}
		});
	};

	return (
		<button
			onClick={handleToggleBookmark}
			disabled={isPending}
			className="bookmark-button p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
			aria-label={
				isBookmarked ? 'Aus Lesezeichen entfernen' : 'Zu Lesezeichen hinzufügen'
			}
			title={
				isBookmarked ? 'Aus Lesezeichen entfernen' : 'Zu Lesezeichen hinzufügen'
			}
		>
			{isPending ? (
				<span className="loading-spinner"></span>
			) : isBookmarked ? (
				<FaStar size={24} className="text-yellow-500" />
			) : (
				<FaRegStar size={24} className="text-gray-500" />
			)}
		</button>
	);
}

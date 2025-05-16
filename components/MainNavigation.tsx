'use client';

import { useToggle } from '@/hooks/useToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
	CgCloseO,
	CgMenuRound,
	CgMail,
	CgMailOpen,
	CgTrash,
} from 'react-icons/cg';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import DeleteProfileModal from '@/components/Auth/DeleteProfileModal';
import { deleteCurrentUserAccount } from '@/actions/profileActions';

type LinkTarget = {
	text: string;
	url: string;
	isPrivate?: boolean;
	isPublicOnly?: boolean;
	action?: () => void;
	isButton?: boolean;
};

type Props = {
	isLoggedIn: boolean;
	userName?: string | null;
	userImage?: string | null;
	unreadMessageCount?: number;
};

/**
 * Stellt die Hauptnavigationsleiste der Anwendung dar.
 * Beinhaltet das Logo, Navigationslinks, Benutzerinformationen (wenn angemeldet),
 * eine Schaltfläche für ungelesene Nachrichten und ein Dropdown-Menü für weitere Aktionen
 * wie Profilbearbeitung, Abmelden und Profillöschung (mit Bestätigungsmodal).
 * @param {Props} props - Die Eigenschaften für die Komponente.
 * @param {boolean} props.isLoggedIn - Zeigt an, ob der Benutzer angemeldet ist.
 * @param {string | null} [props.userName] - Der Name des angemeldeten Benutzers.
 * @param {string | null} [props.userImage] - Die URL zum Avatarbild des angemeldeten Benutzers.
 * @param {number} [props.unreadMessageCount=0] - Die Anzahl der ungelesenen Nachrichten.
 * @returns JSX-Element, das die Hauptnavigation anzeigt.
 */
export default function MainNavigation({
	isLoggedIn,
	userName,
	userImage,
	unreadMessageCount = 0,
}: Props) {
	const [isOpen, toggleMenu, , , closeMenu] = useToggle(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const pathname = usePathname();
	const prevPathnameRef = useRef(pathname);

	useEffect(() => {
		if (prevPathnameRef.current !== pathname) {
			closeMenu();
			if (isDeleteModalOpen) {
				setIsDeleteModalOpen(false);
			}
			prevPathnameRef.current = pathname;
		}
	}, [pathname, closeMenu, isDeleteModalOpen, setIsDeleteModalOpen]);

	const handleDeleteProfileClick = () => {
		closeMenu();
		setIsDeleteModalOpen(true);
	};

	const confirmDeleteProfile = async () => {
		setIsDeleting(true);
		console.log(
			'Profilentfernung bestätigt - hier wird die Server Action aufgerufen'
		);
		try {
			const result = await deleteCurrentUserAccount();
			if (result.success) {
				await signOut({ callbackUrl: '/' });
			} else {
				alert(result.error || 'Fehler beim Löschen des Profils.');
			}
		} catch (error) {
			console.error('Fehler im confirmDeleteProfile:', error);
			alert('Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsDeleting(false);
			setIsDeleteModalOpen(false);
		}
	};

	const linkTargets: LinkTarget[] = [
		{
			text: 'Startseite',
			url: '/',
		},
		{
			text: 'Profil bearbeiten',
			url: '/profile/edit',
			isPrivate: true,
		},
		{
			text: 'Chat',
			url: '/chat',
			isPrivate: true,
		},
		{
			text: 'Bookmarks',
			url: '/bookmarks',
			isPrivate: true,
		},
		{
			text: 'Likes',
			url: '/likes',
			isPrivate: true,
		},
	];

	const hasUnreadMessages = unreadMessageCount > 0;

	return (
		<>
			<nav className="main-navigation">
				<Link href="/" className="main-navigation__logo" onClick={closeMenu}>
					Amoria
				</Link>
				<div className="site-nav__center-content">
					{' '}
					<span className="site-nav__tagline">Liebe beginnt hier</span>{' '}
				</div>

				<div className="user-actions-container">
					{' '}
					{isLoggedIn && (
						<Link
							href="/chat"
							className="unread-messages-button"
							aria-label="Meine Chats"
						>
							{hasUnreadMessages ? (
								<CgMailOpen size={22} className="text-blue-600" />
							) : (
								<CgMail size={22} className="text-gray-600" />
							)}
							{hasUnreadMessages && (
								<span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
									{unreadMessageCount > 9 ? '9+' : unreadMessageCount}
								</span>
							)}
						</Link>
					)}
					{isLoggedIn && userImage && (
						<div className="avatar-container">
							<Image
								src={userImage}
								alt={userName || 'Benutzeravatar'}
								fill
								style={{ objectFit: 'cover' }}
								sizes="32px"
							/>
						</div>
					)}
					{isLoggedIn && userName && (
						<span className="user-greeting">Hallo, {userName}!</span>
					)}
					{isLoggedIn && (
						<button
							className="main-navigation__button"
							onClick={toggleMenu}
							aria-expanded={isOpen}
							aria-label="Hauptmenü"
						>
							Menü {isOpen ? <CgCloseO /> : <CgMenuRound />}
						</button>
					)}
				</div>

				{isOpen && (
					<ul className="main-navigation__list">
						{' '}
						{getMenuItems(linkTargets, pathname, isLoggedIn, closeMenu)}
						{isLoggedIn && (
							<>
								<li key="signout" className="border-t border-gray-200">
									<button
										className="main-navigation__link main-navigation__link--button w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										onClick={async () => {
											await signOut({ callbackUrl: '/' });
											closeMenu();
										}}
									>
										Abmelden
									</button>
								</li>
								<li key="deleteprofile" className="border-t border-gray-200">
									<button
										className="button-delete-profile"
										onClick={handleDeleteProfileClick}
									>
										<CgTrash className="mr-2" />
										Abmelden und Profil löschen
									</button>
								</li>
							</>
						)}
					</ul>
				)}
			</nav>
			{isDeleteModalOpen && (
				<DeleteProfileModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					onConfirm={confirmDeleteProfile}
					isDeleting={isDeleting}
				/>
			)}
		</>
	);
}

/**
 * Generiert Menüeinträge basierend auf den Link-Zielen, dem aktuellen Pfad und dem Anmeldestatus.
 * @param {LinkTarget[]} linkTargets - Ein Array von Link-Ziel-Objekten.
 * @param {string} pathname - Der aktuelle URL-Pfad.
 * @param {boolean} isLoggedIn - Zeigt an, ob der Benutzer angemeldet ist.
 * @param {() => void} closeMenu - Funktion zum Schließen des Menüs bei Klick.
 * @returns {JSX.Element[]} Ein Array von JSX-Elementen, die die Menüeinträge darstellen.
 */
function getMenuItems(
	linkTargets: LinkTarget[],
	pathname: string,
	isLoggedIn: boolean,
	closeMenu: () => void
) {
	return linkTargets
		.filter(({ isPrivate = false, isPublicOnly = false }) => {
			if (isPrivate) return isLoggedIn;
			if (isPublicOnly) return !isLoggedIn;
			return true;
		})
		.map(({ text, url, isButton, action }) => {
			if (isButton && action) {
				return (
					<li key={text}>
						<button
							className="main-navigation__link main-navigation__link--button w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							onClick={() => {
								action();
								closeMenu();
							}}
						>
							{text}
						</button>
					</li>
				);
			}

			const isCurrentPage = url === pathname;
			const attributes = isCurrentPage
				? ({ 'aria-current': 'page' } as const)
				: {};
			const cssClasses = `main-navigation__link block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
				isCurrentPage
					? 'main-navigation__link--current bg-gray-100 font-semibold'
					: ''
			}`;

			return (
				<li key={url}>
					<Link
						className={cssClasses}
						href={url!}
						onClick={closeMenu}
						{...attributes}
					>
						{text}
					</Link>
				</li>
			);
		});
}

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
} from 'react-icons/cg'; // CgMail - для звичайного стану, CgMailOpen - для непрочитаних
import { signOut } from 'next-auth/react';
import Image from 'next/image';
// Пізніше ми створимо та імпортуємо компонент модального вікна
import DeleteProfileModal from '@/components/Auth/DeleteProfileModal';
// Також потрібна буде Server Action для видалення
import { deleteCurrentUserAccount } from '@/actions/profileActions'; // Приклад шляху
///////////////////////////////////////
type LinkTarget = {
	text: string;
	url: string;
	isPrivate?: boolean;
	isPublicOnly?: boolean;
	action?: () => void;
	isButton?: boolean;
	// isDestructive?: boolean; // Для стилізації "небезпечних" дій
};

type Props = {
	isLoggedIn: boolean;
	userName?: string | null;
	userImage?: string | null;
	unreadMessageCount?: number; // Кількість непрочитаних повідомлень
};

export default function MainNavigation({
	isLoggedIn,
	userName,
	userImage,
	unreadMessageCount = 0, // 2. Приймаємо unreadMessageCount, встановлюємо значення за замовчуванням
}: Props) {
	const [isOpen, toggleMenu, , , closeMenu] = useToggle(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const pathname = usePathname();
	const prevPathnameRef = useRef(pathname); // Для відстеження зміни pathname

	// useEffect для закриття меню та модального вікна при зміні шляху
	useEffect(() => {
		// Перевіряємо, чи дійсно змінився pathname
		if (prevPathnameRef.current !== pathname) {
			// console.log('Pathname changed, closing menus/modal if open.');
			closeMenu(); // Закриваємо основне меню
			if (isDeleteModalOpen) {
				// Закриваємо модальне вікно, якщо воно було відкрите
				setIsDeleteModalOpen(false);
			}
			prevPathnameRef.current = pathname; // Оновлюємо попередній pathname
		}
		// Додаємо isDeleteModalOpen та setIsDeleteModalOpen до залежностей,
		// оскільки вони використовуються всередині.
		// Функція setIsDeleteModalOpen стабільна.
		// Ефект спрацює при зміні isDeleteModalOpen, але if (prevPathnameRef.current !== pathname)
		// запобігатиме закриттю модального вікна, якщо шлях не змінився.
	}, [pathname, closeMenu, isDeleteModalOpen, setIsDeleteModalOpen]);

	// Обробник для кнопки "Profil löschen"
	const handleDeleteProfileClick = () => {
		// --- ДІАГНОСТИЧНИЙ LOG ---
		// console.log('handleDeleteProfileClick wurde aufgerufen!');
		// -------------------------
		closeMenu(); // Закриваємо основне меню
		setIsDeleteModalOpen(true); // Відкриваємо модальне вікно
	};

	// Функція, яка буде викликана з модального вікна для підтвердження видалення
	const confirmDeleteProfile = async () => {
		setIsDeleting(true); // Починаємо процес видалення
		console.log(
			'Видалення профілю підтверджено - тут буде виклик Server Action'
		);
		try {
			const result = await deleteCurrentUserAccount();
			if (result.success) {
				await signOut({ callbackUrl: '/' }); // Вихід після успішного видалення
			} else {
				alert(result.error || 'Fehler beim Löschen des Profils.');
			}
		} catch (error) {
			console.error('Fehler im confirmDeleteProfile:', error);
			alert('Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsDeleting(false); // Завершуємо процес видалення
			setIsDeleteModalOpen(false); // Закриваємо модальне вікно
		}
		// Тут буде виклик Server Action:
		// setIsDeleting(false); // Завершуємо процес видалення
		// setIsDeleteModalOpen(false); // Закриваємо модальне вікно
		// Тимчасово просто вихід для демонстрації, якщо потрібно перевірити signOut
		// await signOut({ callbackUrl: '/' });
	};

	// Оновлюємо список посилань, видаляючи "Profil bearbeiten" та "Abmelden",
	// оскільки вони будуть у меню користувача (якщо ви реалізуєте окреме меню користувача)
	// Або, якщо меню користувача немає, то "Profil bearbeiten" залишається тут.
	// Кнопка "Abmelden" вже є окремо в кінці списку.

	// Оновлюємо список посилань, додаючи нові пункти
	const linkTargets: LinkTarget[] = [
		{
			text: 'Startseite', // Головна сторінка
			url: '/',
		},
		{
			text: 'Profil bearbeiten', // Редагувати профіль
			url: '/profile/edit',
			isPrivate: true,
		},
		// --- Нові пункти меню (тільки для авторизованих) ---
		{
			text: 'Chat', // Чат
			url: '/chat', // Заглушка для шляху
			isPrivate: true,
		},
		{
			text: 'Bookmarks', // Закладки
			url: '/bookmarks', // Заглушка для шляху
			isPrivate: true,
		},
		{
			text: 'Likes', // Лайки
			url: '/likes', // Заглушка для шляху
			isPrivate: true,
		},
		// ----------------------------------------------------
	];

	const hasUnreadMessages = unreadMessageCount > 0;

	// --- ДІАГНОСТИЧНИЙ LOG ---
	// console.log('MainNavigation RENDER, isDeleteModalOpen:', isDeleteModalOpen);
	// -------------------------

	return (
		<>
			<nav className="main-navigation">
				{/* Логотип (посилання на головну) */}
				<Link href="/" className="main-navigation__logo" onClick={closeMenu}>
					{/* Замініть "Logo" на ваш <Image /> компонент або SVG */}
					Amoria
				</Link>
				<div className="site-nav__center-content">
					{' '}
					{/* Новий блок з новим класом */}
					<span className="site-nav__tagline">Liebe beginnt hier</span>{' '}
					{/* Новий клас */}
				</div>

				<div className="user-actions-container">
					{' '}
					{/* Контейнер для інформації про користувача та кнопки меню */}
					{isLoggedIn && (
						<Link
							href="/chat"
							className="unread-messages-button"
							aria-label="Meine Chats"
						>
							{hasUnreadMessages ? (
								<CgMailOpen size={22} className="text-blue-600" /> // Іконка для непрочитаних
							) : (
								<CgMail size={22} className="text-gray-600" /> // Стандартна іконка
							)}
							{hasUnreadMessages && (
								<span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
									{unreadMessageCount > 9 ? '9+' : unreadMessageCount}
								</span>
							)}
						</Link>
					)}
					{/* Відображення імені та аватара, якщо користувач увійшов */}
					{isLoggedIn && userImage && (
						<div className="avatar-container">
							<Image
								src={userImage}
								alt={userName || 'Benutzeravatar'}
								fill // Використовуємо fill
								style={{ objectFit: 'cover' }} // Зберігає пропорції, обрізаючи зайве
								sizes="32px" // Підказка для оптимізації
							/>
						</div>
					)}
					{isLoggedIn && userName && (
						<span className="user-greeting">Hallo, {userName}!</span>
					)}
					{isLoggedIn && (
						<button
							className="main-navigation__button" // Ваші стилі для кнопки меню
							onClick={toggleMenu}
							aria-expanded={isOpen}
							aria-label="Hauptmenü"
						>
							Menü {isOpen ? <CgCloseO /> : <CgMenuRound />}
						</button>
					)}
				</div>

				{/* Випадаюче меню */}
				{isOpen && (
					<ul className="main-navigation__list">
						{' '}
						{/* Позиціонування меню */}
						{getMenuItems(
							linkTargets,
							pathname,
							isLoggedIn,
							closeMenu
							// handleDeleteProfileClick
						)}
						{isLoggedIn && (
							<>
								<li key="signout" className="border-t border-gray-200">
									<button
										className="main-navigation__link main-navigation__link--button w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" // Стилі для кнопки виходу
										onClick={async () => {
											await signOut({ callbackUrl: '/' });
											closeMenu();
										}}
									>
										Abmelden
									</button>
								</li>
								{/* Новий пункт "Profil löschen" */}
								<li key="deleteprofile" className="border-t border-gray-200">
									<button
										className="button-delete-profile" // Стилі для небезпечної дії
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
			{/* Перевіряємо значення isDeleteModalOpen перед рендерингом */}
			{isDeleteModalOpen && (
				<DeleteProfileModal
					isOpen={isDeleteModalOpen} // Передаємо актуальний стан
					onClose={() => setIsDeleteModalOpen(false)}
					onConfirm={confirmDeleteProfile}
					isDeleting={isDeleting}
				/>
			)}
		</>
	);
}

// Додаємо closeMenu до аргументів, щоб закривати меню при кліку на посилання
function getMenuItems(
	linkTargets: LinkTarget[],
	pathname: string,
	isLoggedIn: boolean,
	closeMenu: () => void // Функція для закриття меню
	// handleDeleteProfileClick: () => void // Додано, але не використовується в map нижче
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
								closeMenu(); // Закриваємо меню
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
				// Базові стилі для посилань
				isCurrentPage
					? 'main-navigation__link--current bg-gray-100 font-semibold'
					: '' // Стилі для активного посилання
			}`;

			return (
				<li key={url}>
					<Link
						className={cssClasses}
						href={url!}
						onClick={closeMenu} // Закриваємо меню при кліку на посилання
						{...attributes}
					>
						{text}
					</Link>
				</li>
			);
		});
}
////////////////////
//////////////////////////

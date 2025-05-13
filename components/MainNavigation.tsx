'use client';

import { useToggle } from '@/hooks/useToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CgCloseO, CgMenuRound } from 'react-icons/cg';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

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
};

export default function MainNavigation({
	isLoggedIn,
	userName,
	userImage,
}: Props) {
	const [isOpen, toggleMenu, , , closeMenu] = useToggle(false);
	const pathname = usePathname();

	useEffect(() => closeMenu(), [pathname, closeMenu]);

	// Оновлюємо список посилань, додаючи нові пункти
	const linkTargets: LinkTarget[] = [
		{
			text: 'Startseite', // Головна сторінка
			url: '/',
		},
		{
			text: 'Benutzer entdecken', // Знайти користувачів
			url: '/users',
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
			text: 'Lesezeichen', // Закладки
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

	return (
		// Додаємо flex-контейнер для розміщення логотипу зліва та решти справа
		<nav className="main-navigation flex items-center justify-between w-full">
			{/* Логотип (посилання на головну) */}
			<Link
				href="/"
				className="text-xl font-bold text-gray-800 hover:text-blue-600"
				onClick={closeMenu}
			>
				{/* Замініть "Logo" на ваш <Image /> компонент або SVG */}
				Badoo-Clone
			</Link>

			<div className="flex items-center">
				{' '}
				{/* Контейнер для інформації про користувача та кнопки меню */}
				{/* Відображення імені та аватара, якщо користувач увійшов */}
				{isLoggedIn && userImage && (
					<Image
						src={userImage}
						alt={userName || 'Benutzeravatar'}
						width={32}
						height={32}
						className="rounded-full mr-2 hidden sm:block" // Ховаємо на дуже маленьких екранах
					/>
				)}
				{isLoggedIn && userName && (
					<span className="mr-4 text-sm hidden md:inline">
						Hallo, {userName}!
					</span> // Ховаємо на маленьких екранах
				)}
				<button
					className="main-navigation__button" // Ваші стилі для кнопки меню
					onClick={toggleMenu}
					aria-expanded={isOpen}
					aria-label="Hauptmenü"
				>
					Menü {isOpen ? <CgCloseO /> : <CgMenuRound />}
				</button>
			</div>

			{/* Випадаюче меню */}
			{isOpen && (
				<ul className="main-navigation__list absolute right-0 mt-10 py-2 w-48 bg-white rounded-md shadow-xl z-20">
					{' '}
					{/* Позиціонування меню */}
					{getMenuItems(linkTargets, pathname, isLoggedIn, closeMenu)}
					{isLoggedIn && (
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
					)}
				</ul>
			)}
		</nav>
	);
}

// Додаємо closeMenu до аргументів, щоб закривати меню при кліку на посилання
function getMenuItems(
	linkTargets: LinkTarget[],
	pathname: string,
	isLoggedIn: boolean,
	closeMenu: () => void // Функція для закриття меню
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

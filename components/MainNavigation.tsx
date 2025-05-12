'use client';

import { useToggle } from '@/hooks/useToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CgCloseO, CgMenuRound } from 'react-icons/cg';
import { signOut } from 'next-auth/react'; // Імпорт для функції виходу
import Image from 'next/image'; // Для аватара

type LinkTarget = {
	text: string;
	url: string;
	isPrivate?: boolean; // Показувати тільки для авторизованих
	isPublicOnly?: boolean; // Показувати тільки для НЕавторизованих
	action?: () => void; // Для кнопок, як "Вийти"
	isButton?: boolean; // Якщо це кнопка, а не посилання
};

// Оновлюємо типи пропсів
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

	// Оновлений список посилань/дій
	const linkTargets: LinkTarget[] = [
		{
			text: 'Startseite',
			url: '/',
		},
		// Додаємо посилання на редагування профілю
		{
			text: 'Profil bearbeiten', // Редагувати профіль
			url: '/profile/edit', // Шлях до сторінки редагування
			isPrivate: true, // Тільки для авторизованих
		},
		// Можна додати кнопку входу, якщо потрібно (але у вас є SignInButton окремо)
		// {
		//   text: 'Anmelden',
		//   url: '/api/auth/signin', // Або ваша сторінка входу
		//   isPublicOnly: true,
		// },
	];

	return (
		<nav className="main-navigation">
			<div className="flex items-center">
				{' '}
				{/* Контейнер для вирівнювання */}
				{/* Відображення імені та аватара, якщо користувач увійшов */}
				{isLoggedIn && userImage && (
					<Image
						src={userImage}
						alt={userName || 'Benutzeravatar'}
						width={32}
						height={32}
						className="rounded-full mr-2"
					/>
				)}
				{isLoggedIn && userName && (
					<span className="mr-4 text-sm hidden sm:inline">
						Hallo, {userName}!
					</span>
				)}
			</div>

			<button
				className="main-navigation__button"
				onClick={toggleMenu}
				aria-expanded={isOpen}
				aria-label="Hauptmenü"
			>
				Menü {isOpen ? <CgCloseO /> : <CgMenuRound />}
			</button>
			{isOpen && (
				<ul className="main-navigation__list">
					{getMenuItems(linkTargets, pathname, isLoggedIn)}
					{/* Додаємо кнопку виходу, якщо користувач авторизований */}
					{isLoggedIn && (
						<li key="signout">
							<button
								className="main-navigation__link main-navigation__link--button" // Стилізуємо як посилання, але це кнопка
								onClick={async () => {
									await signOut({ callbackUrl: '/' }); // Вихід і перенаправлення на головну
									closeMenu(); // Закриваємо меню після кліку
								}}
							>
								Abmelden {/* Вийти */}
							</button>
						</li>
					)}
				</ul>
			)}
		</nav>
	);
}

function getMenuItems(
	linkTargets: LinkTarget[],
	pathname: string,
	isLoggedIn: boolean
) {
	return (
		linkTargets
			// Фільтруємо посилання:
			// - якщо isPrivate = true, показуємо тільки якщо isLoggedIn = true
			// - якщо isPublicOnly = true, показуємо тільки якщо isLoggedIn = false
			// - інакше (isPrivate та isPublicOnly не вказані або false) показуємо завжди
			.filter(({ isPrivate = false, isPublicOnly = false }) => {
				if (isPrivate) return isLoggedIn;
				if (isPublicOnly) return !isLoggedIn;
				return true;
			})
			.map(({ text, url, isButton, action }) => {
				if (isButton && action) {
					// Якщо це кнопка з дією (теоретично, хоча вихід реалізовано окремо)
					return (
						<li key={text}>
							<button
								className="main-navigation__link main-navigation__link--button"
								onClick={action}
							>
								{text}
							</button>
						</li>
					);
				}

				// Якщо це звичайне посилання
				const isCurrentPage = url === pathname;
				const attributes = isCurrentPage
					? ({ 'aria-current': 'page' } as const)
					: {};
				const cssClasses = `main-navigation__link ${
					isCurrentPage ? 'main-navigation__link--current' : ''
				}`;

				return (
					<li key={url}>
						<Link className={cssClasses} href={url!} {...attributes}>
							{text}
						</Link>
					</li>
				);
			})
	);
}

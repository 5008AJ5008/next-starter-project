import MainNavigation from './MainNavigation';
import { auth } from '@/auth'; // Розкоментуйте, щоб отримати сесію

export default async function Header() {
	const session = await auth(); // Отримуємо сесію

	return (
		<header className="site-header">
			{/* Передаємо актуальний стан авторизації та дані користувача */}
			<MainNavigation
				isLoggedIn={Boolean(session)}
				userName={session?.user?.name ?? null}
				userImage={session?.user?.image ?? null}
			/>
		</header>
	);
}

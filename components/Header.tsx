import MainNavigation from './MainNavigation';
import { auth } from '@/auth'; // Розкоментуйте, щоб отримати сесію
import { getUnreadMessageCount } from '@/actions/chatActions';

export default async function Header() {
	const session = await auth(); // Отримуємо сесію

	let unreadMessages = 0;

	// 2. Викликаємо Server Action, якщо користувач авторизований
	if (session?.user?.id) {
		unreadMessages = await getUnreadMessageCount();
	}

	return (
		<header className="site-header">
			{/* Передаємо актуальний стан авторизації та дані користувача */}
			<MainNavigation
				isLoggedIn={Boolean(session)}
				userName={session?.user?.name ?? null}
				userImage={session?.user?.image ?? null}
				// 3. Передаємо кількість непрочитаних повідомлень
				unreadMessageCount={unreadMessages}
			/>
		</header>
	);
}

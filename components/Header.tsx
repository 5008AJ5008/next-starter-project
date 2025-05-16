import MainNavigation from './MainNavigation';
import { auth } from '@/auth';
import { getUnreadMessageCount } from '@/actions/chatActions';

/**
 * Stellt die Kopfzeile der Webseite dar.
 * Ruft die aktuelle Benutzersitzung und die Anzahl ungelesener Nachrichten ab
 * und übergibt diese Informationen an die Hauptnavigationskomponente.
 * @returns JSX-Element, das die Kopfzeile der Seite anzeigt.
 */
export default async function Header() {
	const session = await auth();

	let unreadMessages = 0;

	if (session?.user?.id) {
		unreadMessages = await getUnreadMessageCount();
	}

	return (
		<header className="site-header">
			<MainNavigation
				isLoggedIn={Boolean(session)}
				userName={session?.user?.name ?? null}
				userImage={session?.user?.image ?? null}
				unreadMessageCount={unreadMessages}
			/>
		</header>
	);
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: '404 - Nicht gefunden 🤷',
};

/**
 * Stellt die Standard-404-Fehlerseite dar, wenn eine Route nicht gefunden wird.
 * @returns JSX-Element, das die Nicht-gefunden-Seite anzeigt.
 */
export default function NotFound() {
	return (
		<main className="default-layout">
			<h1>Zu dieser URL wurde leider nichts gefunden 🤷</h1>

			<p>Versuchen Sie es doch mit einem der folgenden Links:</p>
			<ul>
				<li>
					<Link href="/">Startseite</Link>
				</li>
			</ul>
		</main>
	);
}

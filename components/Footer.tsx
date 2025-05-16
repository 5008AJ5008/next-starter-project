/**
 * Stellt die Fußzeile der Webseite dar.
 * Zeigt das aktuelle Jahr und Copyright-Informationen an.
 * @returns JSX-Element, das die Fußzeile der Seite anzeigt.
 */
export default async function Footer() {
	return (
		<footer className="site-footer">
			<small>&copy; {new Date().getFullYear()}</small>
		</footer>
	);
}

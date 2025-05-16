import type { AuthUserProfile } from '@/types/auth-types';
import Image from 'next/image';

type Props = AuthUserProfile;

/**
 * Stellt die Informationen eines angemeldeten Benutzers dar, einschließlich Name und Avatarbild.
 * Verarbeitet gracefully Fälle, in denen Name oder Bild nicht vorhanden sind.
 *
 * @param {Props} props - Die Eigenschaften für die Komponente, die Benutzername und Bild-URL enthalten.
 * @param {string | null | undefined} props.name - Der Name des Benutzers.
 * @param {string | null | undefined} props.image - Die URL zum Avatarbild des Benutzers.
 * @returns JSX.Element - Ein Div-Element, das den Anmeldestatus und optional das Benutzerbild anzeigt.
 */
export default function User({ name, image }: Props) {
	const displayName = name ?? 'Unbekannter Benutzer';
	const altText = name ? `Avatar von ${name}` : 'Benutzer-Avatar';

	return (
		<div>
			Angemeldet als {displayName}
			{image && (
				<Image
					src={image}
					width={32}
					height={32}
					alt={altText}
					style={{
						borderRadius: '50%',
						marginLeft: '10px',
						verticalAlign: 'middle',
					}}
				/>
			)}
		</div>
	);
}

// User.tsx
import type { AuthUserProfile } from '@/types/auth-types'; // Імпортуємо правильний тип
import Image from 'next/image';

// Використовуємо правильний тип для Props
type Props = AuthUserProfile;

export default function User({ name, image }: Props) {
	// Обробляємо можливі null значення
	const displayName = name ?? 'Unbekannter Benutzer'; // Якщо name = null/undefined
	const altText = name ? `Avatar von ${name}` : 'Benutzer-Avatar'; // Безпечний alt

	return (
		<div>
			Angemeldet als {displayName}
			{/* Перевірка наявності image перед рендерингом */}
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

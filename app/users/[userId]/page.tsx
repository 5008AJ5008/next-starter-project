import type { Metadata, ResolvingMetadata } from 'next';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createOrFindChatAndRedirect } from '@/actions/chatActions';
import BookmarkButton from '@/components/bookmarks/BookmarkButton';
import { isBookmarked } from '@/actions/bookmarkActions';
import LikeButton from '@/components/likes/LikeButton';
import { hasUserLiked } from '@/actions/likeActions';

/**
 * Berechnet das Alter einer Person anhand ihres Geburtsdatums.
 * @param birthDate Das Geburtsdatum der Person. Kann null sein.
 * @returns Das Alter in Jahren oder null, wenn kein Geburtsdatum angegeben ist.
 */
function calculateAge(birthDate: Date | null): number | null {
	if (!birthDate) return null;
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDifference = today.getMonth() - birth.getMonth();
	if (
		monthDifference < 0 ||
		(monthDifference === 0 && today.getDate() < birth.getDate())
	) {
		age--;
	}
	return age;
}

type Props = {
	params: Promise<{ userId: string }>;
};

/**
 * Generiert dynamisch Metadaten für die Benutzerprofilseite.
 * Der Titel enthält den Namen des Benutzers.
 * @param props Die Eigenschaften, die die `userId` als Promise enthalten.
 * @param parent Ein Promise, das die Metadaten der übergeordneten Route auflöst.
 * @returns Ein Promise, das die Metadaten-Objekte auflöst.
 */
export async function generateMetadata(
	{ params: paramsPromise }: Props,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	parent: ResolvingMetadata
): Promise<Metadata> {
	const params = await paramsPromise;
	const userId = params.userId;

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true },
	});

	if (!user) {
		return {
			title: 'Profil nicht gefunden',
		};
	}

	return {
		title: user.name ? `${user.name}s Profil` : 'Benutzerprofil',
	};
}

/**
 * Stellt die Profilseite eines Benutzers dar.
 * Zeigt detaillierte Informationen über den Benutzer an, einschließlich Name, Alter, Bild, Stadt, Geschlecht und "Über mich".
 * Ermöglicht authentifizierten Benutzern das Setzen von Lesezeichen, das Liken und das Starten eines Chats mit dem angezeigten Benutzer (außer mit sich selbst).
 * Leitet nicht authentifizierte Benutzer zur Anmeldeseite weiter.
 * @param props Die Eigenschaften der Komponente, die die `userId` des anzuzeigenden Profils als Promise enthalten.
 * @returns JSX-Element, das die Benutzerprofilseite anzeigt.
 */
export default async function UserProfilePage({
	params: paramsPromise,
}: Props) {
	const params = await paramsPromise;
	const userId = params.userId;

	const session = await auth();
	const isAuthenticated = Boolean(session?.user);
	const currentUserId = session?.user?.id;

	if (!isAuthenticated) {
		const paramsForRedirect = await paramsPromise;
		const viewedUserId = paramsForRedirect.userId;
		redirect(`/api/auth/signin?callbackUrl=/users/${viewedUserId}`);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			birthDate: true,
			gender: true,
			city: true,
			aboutMe: true,
		},
	});

	if (!user) {
		notFound();
	}

	const age = calculateAge(user.birthDate);

	let initialIsBookmarked = false;
	let initialIsLiked = false;

	if (currentUserId && currentUserId !== userId) {
		initialIsBookmarked = await isBookmarked(userId);
		initialIsLiked = await hasUserLiked(userId);
	}

	const startChatAction = createOrFindChatAndRedirect.bind(null, user.id);

	return (
		<main className="container mx-auto px-4 py-8">
			{' '}
			<div
				className="profile-container"
				style={{
					position: 'relative',
					maxWidth: '42rem',
					marginLeft: 'auto',
					marginRight: 'auto',
					backgroundColor: 'white',
					boxShadow:
						'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
					borderRadius: '0.5rem',
					overflow: 'hidden',
				}}
			>
				<div
					className="profile-image-container"
					style={{ position: 'relative', width: '100%', paddingTop: '75%' }}
				>
					{user.image ? (
						<Image
							src={user.image}
							alt={`Profilbild von ${user.name || 'Benutzer'}`}
							fill
							style={{ objectFit: 'contain' }}
							sizes="(max-width: 42rem) 100vw, 42rem"
						/>
					) : (
						<div
							className="profile-image-placeholder"
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: '#D1D5DB',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<span style={{ color: '#6B7280' }}>Kein Profilbild</span>
						</div>
					)}
				</div>

				<div className="profile-content" style={{ padding: '1.5rem' }}>
					<div className="name_and_bookmark">
						<h1 className="text-3xl font-bold text-gray-800 mb-1">
							{user.name || 'Unbekannter Benutzer'}
							{age && <span className="text-2xl text-gray-600">, {age}</span>}
						</h1>
						{isAuthenticated && currentUserId !== userId && (
							<BookmarkButton
								bookmarkedUserId={userId}
								initialIsBookmarked={initialIsBookmarked}
								currentUserId={currentUserId}
							/>
						)}
						{isAuthenticated && currentUserId !== userId && (
							<LikeButton
								likedUserId={userId}
								initialIsLiked={initialIsLiked}
								currentUserId={currentUserId}
							/>
						)}
					</div>

					{(user.city || user.gender) && (
						<p className="text-md text-gray-600 mb-4">
							{user.city}
							{user.city && user.gender && ', '}
							{user.gender}
						</p>
					)}

					{user.aboutMe && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-700 mb-2">
								Über mich
							</h2>
							<p className="text-gray-600 whitespace-pre-wrap">
								{user.aboutMe}
							</p>
						</div>
					)}

					{currentUserId !== user.id && (
						<div className="mt-6 pt-4 border-t border-gray-200">
							{' '}
							<form action={startChatAction}>
								{' '}
								<button
									type="submit"
									className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
								>
									Nachricht senden
								</button>
							</form>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Profil bearbeiten',
};

/**
 * Stellt die Seite zum Bearbeiten des Benutzerprofils dar.
 * Ruft die aktuellen Benutzerdaten ab und übergibt sie an das ProfileForm-Komponente.
 * Leitet nicht authentifizierte Benutzer zur Anmeldeseite weiter.
 * @returns JSX-Element, das die Seite zum Bearbeiten des Profils anzeigt.
 */
export default async function EditProfilePage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/api/auth/signin?callbackUrl=/profile/edit');
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			name: true,
			birthDate: true,
			gender: true,
			city: true,
			aboutMe: true,
		},
	});

	if (!user) {
		return <p className="text-red-500">Benutzer nicht gefunden.</p>;
	}

	return (
		<main className="container mx-auto px-4 py-8 max-w-2xl">
			<h1 className="text-2xl font-semibold mb-6">Profil bearbeiten</h1>{' '}
			<ProfileForm user={user} />
		</main>
	);
}

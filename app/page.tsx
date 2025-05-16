import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import SignIn from '@/components/Auth/SignIn';
import Link from 'next/link';
import UserFilters from '@/components/filters/UserFilters';
import LikeButton from '@/components/likes/LikeButton';
import { hasUserLiked } from '@/actions/likeActions';

export const metadata: Metadata = {
	title: 'Next Starter',
};

type HomePageProps = {
	searchParams?: Promise<{
		city?: string;
		minAge?: string;
		maxAge?: string;
		gender?: string;
	}>;
};

/**
 * Hilfsfunktion zur Berechnung des Geburtsdatums basierend auf einem Alter.
 * @param age Das Alter in Jahren.
 * @returns Das berechnete Geburtsdatum.
 */
function getDateFromAge(age: number): Date {
	const today = new Date();
	today.setFullYear(today.getFullYear() - age);
	return today;
}

/**
 * Stellt die Hauptseite der Anwendung dar, die Benutzerprofile basierend auf Filterkriterien anzeigt.
 * @param props Die Eigenschaften der Komponente, einschließlich Suchparameter.
 * @returns JSX-Element, das die Homepage anzeigt.
 */
export default async function HomePage({
	searchParams: searchParamsPromise,
}: HomePageProps) {
	const session = await auth();
	const currentUserId = session?.user?.id;
	const isAuthenticated = Boolean(session?.user);

	const searchParams = searchParamsPromise ? await searchParamsPromise : {};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const andConditions: any[] = [];

	andConditions.push({ image: { not: null } });
	andConditions.push({ image: { not: '' } });

	if (searchParams?.city) {
		andConditions.push({
			city: {
				contains: searchParams.city,
				mode: 'insensitive',
			},
		});
	}

	if (searchParams?.gender) {
		andConditions.push({ gender: searchParams.gender });
	}

	const minAge = searchParams?.minAge
		? parseInt(searchParams.minAge, 10)
		: null;
	const maxAge = searchParams?.maxAge
		? parseInt(searchParams.maxAge, 10)
		: null;

	if (minAge && maxAge && minAge <= maxAge) {
		andConditions.push({
			birthDate: {
				lte: getDateFromAge(minAge),
				gte: getDateFromAge(maxAge + 1),
			},
		});
	} else if (minAge) {
		andConditions.push({
			birthDate: {
				lte: getDateFromAge(minAge),
			},
		});
	} else if (maxAge) {
		andConditions.push({
			birthDate: {
				gte: getDateFromAge(maxAge + 1),
			},
		});
	}

	const whereClause = {
		NOT: {
			id: currentUserId || undefined,
		},
		AND: andConditions.length > 0 ? andConditions : undefined,
	};

	const users = await prisma.user.findMany({
		where: whereClause,
		select: {
			id: true,
			image: true,
			...(isAuthenticated && {
				name: true,
			}),
		},
		orderBy: {
			id: 'desc',
		},
		take: 50,
	});

	const likedStates: Record<string, boolean> = {};
	if (isAuthenticated && currentUserId) {
		for (const user of users) {
			likedStates[user.id] = await hasUserLiked(user.id);
		}
	}

	return (
		<main className="default-layout">
			<div className="container mx-auto px-4 py-8">
				<UserFilters />
				{!isAuthenticated && (
					<div className="willkommen">
						<h1 className="willkommen-text">Willkommen!</h1>
						<p className="grund-text">
							Entdecke Profile und verbinde dich. Melde dich an, um mehr Details
							zu sehen und zu interagieren.
						</p>
						<div className="signin-button">
							<SignIn />
						</div>
					</div>
				)}
				{isAuthenticated && (
					<h1 className="grund-text">Entdecke andere Profile</h1>
				)}

				{users.length === 0 && (
					<p className="text-center text-gray-500 mt-10">
						Keine Profile gefunden, die Ihren Kriterien entsprechen.
					</p>
				)}

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
					{users.map((user) => {
						const userCardContent = (
							<div
								className="relative w-full"
								style={{ position: 'relative', paddingTop: '100%' }}
							>
								{user.image ? (
									<Image
										src={user.image}
										alt={
											isAuthenticated && user.name
												? `Profilbild von ${user.name}`
												: 'Profilbild'
										}
										fill
										style={{ objectFit: 'cover' }}
										sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
										className="transition-transform duration-300 group-hover:scale-110"
									/>
								) : (
									<div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
										<span className="text-gray-500">Kein Bild</span>
									</div>
								)}
								{isAuthenticated &&
									currentUserId &&
									currentUserId !== user.id && (
										<div className="like-button-container-on-image">
											{' '}
											<LikeButton
												likedUserId={user.id}
												initialIsLiked={likedStates[user.id] || false}
												currentUserId={currentUserId}
											/>
										</div>
									)}
							</div>
						);

						return (
							<div
								key={user.id}
								className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 group"
							>
								{isAuthenticated ? (
									<Link
										href={`/users/${user.id}`}
										aria-label={
											user.name
												? `Profil von ${user.name} ansehen`
												: 'Profil ansehen'
										}
									>
										{userCardContent}
									</Link>
								) : (
									userCardContent
								)}
							</div>
						);
					})}
				</div>
			</div>
		</main>
	);
}

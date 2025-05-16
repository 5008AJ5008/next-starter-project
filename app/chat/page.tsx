import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
	title: 'Meine Chats',
};

/**
 * Stellt die Seite "Meine Chats" dar.
 * Zeigt eine Liste der Chats an, an denen der aktuell authentifizierte Benutzer beteiligt ist.
 * Jeder Eintrag in der Liste zeigt den anderen Teilnehmer, dessen Avatar und die letzte Nachricht an.
 * Leitet nicht authentifizierte Benutzer zur Anmeldeseite weiter oder zeigt eine entsprechende Meldung an.
 * @returns JSX-Element, das die Chat-Liste-Seite anzeigt.
 */
export default async function ChatListPage() {
	const session = await auth();

	if (!session?.user?.id) {
		return (
			<main className="chat-list-page chat-list-page--unauthenticated">
				<p className="auth-prompt__message">
					Bitte melden Sie sich an, um Ihre Chats anzuzeigen.
				</p>
			</main>
		);
	}

	const currentUserId = session.user.id;

	const userChats = await prisma.chat.findMany({
		where: {
			participants: {
				some: {
					userId: currentUserId,
				},
			},
		},
		include: {
			participants: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			},
			messages: {
				orderBy: {
					createdAt: 'desc',
				},
				take: 1,
			},
		},
		orderBy: {
			updatedAt: 'desc',
		},
	});

	return (
		<main className="chat-list-page">
			<h1 className="chat-list-page__title">Meine Chats</h1>

			{userChats.length === 0 && (
				<p className="chat-list-page__empty-message">
					Sie haben noch keine aktiven Chats.{' '}
				</p>
			)}

			<div className="chat-list">
				{userChats.map((chat) => {
					const otherParticipant = chat.participants.find(
						(p) => p.userId !== currentUserId
					)?.user;

					const lastMessage = chat.messages[0];

					if (!otherParticipant) {
						return null;
					}

					return (
						<Link href={`/chat/${chat.id}`} key={chat.id} className="chat-item">
							<div className="chat-item__content">
								{' '}
								<div className="chat-item__avatar-container">
									{' '}
									{otherParticipant.image ? (
										<Image
											src={otherParticipant.image}
											alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
											width={50}
											height={50}
											className="chat-item__avatar"
											style={{ objectFit: 'cover' }}
										/>
									) : (
										<div className="chat-item__avatar-placeholder">
											{' '}
											<span className="avatar-placeholder__initials">
												{' '}
												{otherParticipant.name?.charAt(0).toUpperCase() || '?'}
											</span>
										</div>
									)}
								</div>
								<div className="chat-item__details">
									{' '}
									<p className="chat-item__participant-name">
										{' '}
										{otherParticipant.name || 'Unbekannter Benutzer'}
									</p>
									{lastMessage && (
										<p className="chat-item__last-message">
											{' '}
											{lastMessage.authorId === currentUserId ? 'Du: ' : ''}
											{lastMessage.content}
										</p>
									)}
								</div>
								{lastMessage && (
									<div className="chat-item__timestamp">
										{' '}
										{new Date(lastMessage.createdAt).toLocaleTimeString(
											'de-DE',
											{ hour: '2-digit', minute: '2-digit' }
										)}
									</div>
								)}
							</div>
						</Link>
					);
				})}
			</div>
		</main>
	);
}

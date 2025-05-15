import type { Metadata } from 'next';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
// import { formatDistanceToNow } from 'date-fns'; // Для часу останнього повідомлення (додамо пізніше)
// import { de } from 'date-fns/locale'; // Для німецької локалі (додамо пізніше)

export const metadata: Metadata = {
	title: 'Meine Chats', // Мої чати
};

export default async function ChatListPage() {
	const session = await auth();

	if (!session?.user?.id) {
		// Якщо користувач не авторизований, можна перенаправити на сторінку входу
		// або показати повідомлення. Для простоти поки що просто повернемо null або повідомлення.
		return (
			<main className="chat-list-page chat-list-page--unauthenticated">
				<p className="auth-prompt__message">
					Bitte melden Sie sich an, um Ihre Chats anzuzeigen.
				</p>
			</main>
		);
	}

	const currentUserId = session.user.id;

	// Отримуємо чати, в яких бере участь поточний користувач
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
				// Включаємо учасників
				include: {
					user: {
						// Включаємо дані користувача для кожного учасника
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			},
			messages: {
				// Включаємо останні повідомлення для сортування та відображення (опціонально)
				orderBy: {
					createdAt: 'desc',
				},
				take: 1, // Беремо тільки останнє повідомлення
			},
		},
		orderBy: {
			updatedAt: 'desc', // Сортуємо чати за часом останнього оновлення (останнього повідомлення)
		},
	});

	return (
		<main className="chat-list-page">
			<h1 className="chat-list-page__title">Meine Chats</h1>

			{userChats.length === 0 && (
				<p className="chat-list-page__empty-message">
					Sie haben noch keine aktiven Chats.{' '}
					{/* У вас ще немає активних чатів. */}
				</p>
			)}

			<div className="chat-list">
				{userChats.map((chat) => {
					// Знаходимо іншого учасника чату (не поточного користувача)
					const otherParticipant = chat.participants.find(
						(p) => p.userId !== currentUserId
					)?.user;

					// Останнє повідомлення (якщо є)
					const lastMessage = chat.messages[0];

					if (!otherParticipant) {
						// Це не мало б статися в чаті двох осіб, але про всяк випадок
						return null;
					}

					return (
						<Link
							href={`/chat/${chat.id}`} // Посилання на конкретний чат
							key={chat.id}
							className="chat-item" // Новий клас для елемента списку чатів
						>
							<div className="chat-item__content">
								{' '}
								{/* Новий клас для вмісту елемента */}
								<div className="chat-item__avatar-container">
									{' '}
									{/* Новий клас для контейнера аватара */}
									{otherParticipant.image ? (
										<Image
											src={otherParticipant.image}
											alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
											width={50}
											height={50}
											className="chat-item__avatar" // Новий клас для аватара
											style={{ objectFit: 'cover' }}
										/>
									) : (
										<div className="chat-item__avatar-placeholder">
											{' '}
											{/* Новий клас для заглушки аватара */}
											<span className="avatar-placeholder__initials">
												{' '}
												{/* Новий клас для ініціалів */}
												{otherParticipant.name?.charAt(0).toUpperCase() || '?'}
											</span>
										</div>
									)}
								</div>
								<div className="chat-item__details">
									{' '}
									{/* Новий клас для текстових деталей */}
									<p className="chat-item__participant-name">
										{' '}
										{/* Новий клас для імені учасника */}
										{otherParticipant.name || 'Unbekannter Benutzer'}
									</p>
									{lastMessage && (
										<p className="chat-item__last-message">
											{' '}
											{/* Новий клас для останнього повідомлення */}
											{/* Показуємо, хто надіслав останнє повідомлення */}
											{lastMessage.authorId === currentUserId ? 'Du: ' : ''}
											{lastMessage.content}
										</p>
									)}
								</div>
								{lastMessage && (
									<div className="chat-item__timestamp">
										{' '}
										{/* Новий клас для часу */}
										{/* Тут можна буде додати форматування часу останнього повідомлення */}
										{/* {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: de })} */}
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

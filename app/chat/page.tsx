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
			<main className="container mx-auto px-4 py-8 text-center">
				<p>Bitte melden Sie sich an, um Ihre Chats anzuzeigen.</p>{' '}
				{/* Будь ласка, увійдіть, щоб переглянути свої чати. */}
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
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center">Meine Chats</h1>

			{userChats.length === 0 && (
				<p className="text-center text-gray-500">
					Sie haben noch keine aktiven Chats.{' '}
					{/* У вас ще немає активних чатів. */}
				</p>
			)}

			<div className="space-y-4 max-w-2xl mx-auto">
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
							className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
						>
							<div className="flex items-center space-x-4">
								<div className="flex-shrink-0">
									{otherParticipant.image ? (
										<Image
											src={otherParticipant.image}
											alt={`Avatar von ${otherParticipant.name || 'Benutzer'}`}
											width={50}
											height={50}
											className="rounded-full"
										/>
									) : (
										<div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
											<span className="text-xl text-gray-500">
												{otherParticipant.name?.charAt(0).toUpperCase() || '?'}
											</span>
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-lg font-semibold text-gray-800 truncate">
										{otherParticipant.name || 'Unbekannter Benutzer'}
									</p>
									{lastMessage && (
										<p className="text-sm text-gray-500 truncate">
											{/* Показуємо, хто надіслав останнє повідомлення */}
											{lastMessage.authorId === currentUserId ? 'Du: ' : ''}
											{lastMessage.content}
										</p>
									)}
								</div>
								{lastMessage && (
									<div className="text-xs text-gray-400 whitespace-nowrap">
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

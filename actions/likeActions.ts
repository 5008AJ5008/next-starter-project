'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// Імпорт createOrFindChatAndRedirect видалено, оскільки він не використовується тут.
// Якщо знадобиться функція для отримання/створення ID чату без redirect,
// її потрібно буде створити/імпортувати окремо.

// Тип для відповіді від togglePhotoLike
type ToggleLikeResponse = {
	success: boolean;
	isLiked?: boolean; // Повертаємо новий стан лайка
	isMatch?: boolean; // Повертаємо, чи стався метч
	chatId?: string; // Повертаємо ID чату, якщо стався метч
	error?: string;
	message?: string;
};

/**
 * Додає або видаляє лайк для профілю/фото іншого користувача.
 * Якщо виникає взаємний лайк (метч), створює/знаходить чат
 * та надсилає системне повідомлення в цей чат.
 * @param likedUserId ID користувача, чиє фото/профіль лайкають.
 */
export async function togglePhotoLike(
	likedUserId: string
): Promise<ToggleLikeResponse> {
	const session = await auth();

	if (!session?.user?.id) {
		return { success: false, error: 'Nicht autorisiert.' };
	}

	const likerId = session.user.id;

	if (likerId === likedUserId) {
		return { success: false, error: 'Sie können sich nicht selbst liken.' }; // Ви не можете лайкнути себе
	}

	try {
		let isCurrentlyLiked = false;
		let matchOccurred = false;
		let newChatIdForMatch: string | undefined = undefined;

		// Використовуємо транзакцію для атомарності операцій
		await prisma.$transaction(async (tx) => {
			// Перевіряємо, чи існує вже такий лайк
			const existingLike = await tx.photoLike.findUnique({
				where: {
					likerId_likedUserId: {
						likerId,
						likedUserId,
					},
				},
			});

			if (existingLike) {
				// Якщо лайк існує, видаляємо його
				await tx.photoLike.delete({
					where: {
						id: existingLike.id,
					},
				});
				isCurrentlyLiked = false;
				// console.log(`Like von ${likerId} für ${likedUserId} entfernt.`);
			} else {
				// Якщо лайка немає, створюємо його
				await tx.photoLike.create({
					data: {
						likerId,
						likedUserId,
					},
				});
				isCurrentlyLiked = true;
				// console.log(`Like von ${likerId} für ${likedUserId} hinzugefügt.`);

				// Перевіряємо на взаємний лайк (метч)
				const mutualLike = await tx.photoLike.findUnique({
					where: {
						likerId_likedUserId: {
							likerId: likedUserId, // Тепер likedUser є liker
							likedUserId: likerId, // А liker є likedUser
						},
					},
				});

				if (mutualLike) {
					matchOccurred = true;
					console.log(`METCH zwischen ${likerId} und ${likedUserId}!`);

					let chat = await tx.chat.findFirst({
						where: {
							AND: [
								{ participants: { some: { userId: likerId } } },
								{ participants: { some: { userId: likedUserId } } },
								{
									participants: {
										every: { userId: { in: [likerId, likedUserId] } },
									},
								},
							],
						},
						select: { id: true },
					});

					if (!chat) {
						chat = await tx.chat.create({
							data: {
								participants: {
									create: [{ userId: likerId }, { userId: likedUserId }],
								},
							},
							select: { id: true },
						});
					}
					newChatIdForMatch = chat.id;

					const likerUser = await tx.user.findUnique({
						where: { id: likerId },
						select: { name: true },
					});
					// const likedUser = await tx.user.findUnique({ where: { id: likedUserId }, select: { name: true } }); // Це вже є, можна використовувати likerUser для другого імені

					// Змінна messageContentForLiker видалена, оскільки messageContent використовується для обох
					const messageContent = `🎉 Sie und ${
						likerUser?.name || 'jemand'
					} haben sich gegenseitig geliked! Starten Sie ein Gespräch.`;

					if (newChatIdForMatch) {
						await tx.message.create({
							data: {
								chatId: newChatIdForMatch,
								content: messageContent,
								isSystemMessage: true,
							},
						});
						await tx.chat.update({
							where: { id: newChatIdForMatch },
							data: { updatedAt: new Date() },
						});
					}
				}
			}
		}); // Кінець транзакції

		revalidatePath(`/users/${likedUserId}`);
		revalidatePath('/likes');
		if (matchOccurred && newChatIdForMatch) {
			revalidatePath(`/chat/${newChatIdForMatch}`);
			revalidatePath('/chat');
		}

		return {
			success: true,
			isLiked: isCurrentlyLiked,
			isMatch: matchOccurred,
			chatId: newChatIdForMatch,
			message: isCurrentlyLiked
				? matchOccurred
					? 'Es ist ein Match! Chat erstellt.'
					: 'Geliked!'
				: 'Like entfernt.',
		};
	} catch (error) {
		console.error('Fehler beim Umschalten des Likes:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unbekannter Fehler.';
		return { success: false, error: `Fehler: ${errorMessage}` };
	}
}

export async function hasUserLiked(likedUserId: string): Promise<boolean> {
	const session = await auth();
	if (!session?.user?.id) {
		return false;
	}
	const likerId = session.user.id;

	if (likerId === likedUserId) {
		return false;
	}

	try {
		const like = await prisma.photoLike.findUnique({
			where: {
				likerId_likedUserId: {
					likerId,
					likedUserId,
				},
			},
		});
		return Boolean(like);
	} catch (error) {
		console.error('Fehler beim Überprüfen des Like-Status:', error);
		return false;
	}
}

'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type ToggleLikeResponse = {
	success: boolean;
	isLiked?: boolean;
	isMatch?: boolean;
	chatId?: string;
	error?: string;
	message?: string;
};

/**
 * Fügt ein "Like" für das Profil/Foto eines anderen Benutzers hinzu oder entfernt es.
 * Wenn ein gegenseitiges "Like" (Match) auftritt, wird ein Chat erstellt/gefunden
 * und eine Systemnachricht an diesen Chat gesendet.
 * @param likedUserId ID des Benutzers, dessen Foto/Profil geliked wird.
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
		return { success: false, error: 'Sie können sich nicht selbst liken.' };
	}

	try {
		let isCurrentlyLiked = false;
		let matchOccurred = false;
		let newChatIdForMatch: string | undefined = undefined;

		await prisma.$transaction(async (tx) => {
			const existingLike = await tx.photoLike.findUnique({
				where: {
					likerId_likedUserId: {
						likerId,
						likedUserId,
					},
				},
			});

			if (existingLike) {
				await tx.photoLike.delete({
					where: {
						id: existingLike.id,
					},
				});
				isCurrentlyLiked = false;
			} else {
				await tx.photoLike.create({
					data: {
						likerId,
						likedUserId,
					},
				});
				isCurrentlyLiked = true;

				const mutualLike = await tx.photoLike.findUnique({
					where: {
						likerId_likedUserId: {
							likerId: likedUserId,
							likedUserId: likerId,
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
		});

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

/**
 * Überprüft, ob der aktuelle Benutzer einen anderen Benutzer geliked hat.
 * @param likedUserId Die ID des Benutzers, für den der Like-Status überprüft werden soll.
 * @returns True, wenn der Benutzer geliked wurde, andernfalls false.
 */
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

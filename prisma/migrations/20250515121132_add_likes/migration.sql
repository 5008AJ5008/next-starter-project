-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSystemMessage" BOOLEAN DEFAULT false,
ALTER COLUMN "authorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PhotoLike" (
    "id" TEXT NOT NULL,
    "likerId" TEXT NOT NULL,
    "likedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLike_likerId_likedUserId_key" ON "PhotoLike"("likerId", "likedUserId");

-- AddForeignKey
ALTER TABLE "PhotoLike" ADD CONSTRAINT "PhotoLike_likerId_fkey" FOREIGN KEY ("likerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLike" ADD CONSTRAINT "PhotoLike_likedUserId_fkey" FOREIGN KEY ("likedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

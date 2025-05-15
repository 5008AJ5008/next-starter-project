-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "bookmarkerId" TEXT NOT NULL,
    "bookmarkedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_bookmarkerId_bookmarkedUserId_key" ON "Bookmark"("bookmarkerId", "bookmarkedUserId");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookmarkerId_fkey" FOREIGN KEY ("bookmarkerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookmarkedUserId_fkey" FOREIGN KEY ("bookmarkedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

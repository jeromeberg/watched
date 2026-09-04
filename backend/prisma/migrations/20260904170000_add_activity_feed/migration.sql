-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TITLE_ADDED', 'TITLE_STATUS_CHANGED', 'TITLE_RATING_CHANGED', 'TITLE_NOTE_CHANGED', 'COLLECTION_CREATED', 'COLLECTION_UPDATED', 'COLLECTION_ITEM_ADDED', 'COLLECTION_ITEM_REMOVED');

-- AlterTable
ALTER TABLE "UserTitle" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "UserTitle" SET "updatedAt" = "addedAt";
ALTER TABLE "UserTitle" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Collection" SET "updatedAt" = "createdAt";
ALTER TABLE "Collection" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "userTitleUserId" INTEGER,
    "userTitleTitleId" INTEGER,
    "collectionId" INTEGER,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Activity_actor_matches_user_title" CHECK ("userTitleUserId" IS NULL OR "userTitleUserId" = "actorId")
);

-- CreateIndex
CREATE INDEX "Activity_actorId_id_idx" ON "Activity"("actorId", "id");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userTitleUserId_userTitleTitleId_fkey" FOREIGN KEY ("userTitleUserId", "userTitleTitleId") REFERENCES "UserTitle"("userId", "titleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

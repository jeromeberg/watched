-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'USER_FOLLOWED';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "subjectUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

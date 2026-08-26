-- Remove episode-level watch tracking and its dependent data.
DROP TABLE "EpisodeWatch";

-- Remove TV season and episode metadata. Title-level library data is retained.
DROP TABLE "Episode";
DROP TABLE "Season";

-- Support the title-level library's filtered and recently-added lists.
CREATE INDEX "UserTitle_userId_status_idx" ON "UserTitle"("userId", "status");
CREATE INDEX "UserTitle_userId_addedAt_idx" ON "UserTitle"("userId", "addedAt");
CREATE INDEX "UserTitle_userId_status_addedAt_idx" ON "UserTitle"("userId", "status", "addedAt");

-- Support listing one user's collections.
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

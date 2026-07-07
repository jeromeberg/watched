-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'TV');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHED', 'TO_WATCH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "type" "TitleType" NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "releaseYear" INTEGER,
    "imdbId" TEXT,
    "director" TEXT,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "showId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "airDate" TEXT,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeWatch" (
    "userId" INTEGER NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeWatch_pkey" PRIMARY KEY ("userId","episodeId")
);

-- CreateTable
CREATE TABLE "UserTitle" (
    "userId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL,
    "rating" INTEGER,
    "status" "WatchStatus" NOT NULL DEFAULT 'TO_WATCH',
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTitle_pkey" PRIMARY KEY ("userId","titleId")
);

-- CreateTable
CREATE TABLE "UserTopPick" (
    "userId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "UserTopPick_pkey" PRIMARY KEY ("userId","rank")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","titleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Title_tmdbId_type_key" ON "Title"("tmdbId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Season_showId_seasonNumber_key" ON "Season"("showId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopPick_userId_titleId_key" ON "UserTopPick"("userId", "titleId");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeWatch" ADD CONSTRAINT "EpisodeWatch_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopPick" ADD CONSTRAINT "UserTopPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopPick" ADD CONSTRAINT "UserTopPick_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

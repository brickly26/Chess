/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerBlackId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playerWhiteId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `playedAt` on the `Move` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blackPlayerId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeControl` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whitePlayerId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endFen` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startFen` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('WHITE_WINS', 'BLACK_WINS', 'DRAW');

-- CreateEnum
CREATE TYPE "TimeControl" AS ENUM ('CLASSICAL', 'RAPID', 'BLITZ', 'BULLET');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'FACEBOOK', 'GITHUB');

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_playerBlackId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_playerWhiteId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdAt",
DROP COLUMN "playerBlackId",
DROP COLUMN "playerWhiteId",
ADD COLUMN     "blackPlayerId" TEXT NOT NULL,
ADD COLUMN     "currentFen" TEXT,
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "event" TEXT,
ADD COLUMN     "opening" TEXT,
ADD COLUMN     "result" "GameResult",
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startingFen" TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
ADD COLUMN     "status" "GameStatus" NOT NULL,
ADD COLUMN     "timeControl" "TimeControl" NOT NULL,
ADD COLUMN     "whitePlayerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "playedAt",
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endFen" TEXT NOT NULL,
ADD COLUMN     "startFen" TEXT NOT NULL,
ADD COLUMN     "timeTaken" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "provider" "AuthProvider" NOT NULL,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Game_status_result_idx" ON "Game"("status", "result");

-- CreateIndex
CREATE INDEX "Move_gameId_idx" ON "Move"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_rating_idx" ON "User"("rating");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

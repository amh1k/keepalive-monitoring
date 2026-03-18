/*
  Warnings:

  - You are about to drop the column `isAnomaly` on the `Monitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Check" ADD COLUMN     "isAnomaly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "isAnomaly";

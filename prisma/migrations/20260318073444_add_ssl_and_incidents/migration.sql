-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('VALID', 'INVALID', 'EXPIRING_SOON');

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "sslExpirationDate" TIMESTAMP(3),
ADD COLUMN     "sslIssuer" TEXT,
ADD COLUMN     "sslLastCheck" TIMESTAMP(3),
ADD COLUMN     "sslStatus" "SslStatus";

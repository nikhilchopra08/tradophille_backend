-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "verified" SET DEFAULT false;

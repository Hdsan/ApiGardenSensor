/*
  Warnings:

  - Added the required column `order` to the `sensor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."sensor" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."plantingBed" ADD COLUMN     "wateringLevel" INTEGER NOT NULL DEFAULT 1500;

-- CreateTable
CREATE TABLE "public"."schedule" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "public"."plantingBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."event" ADD COLUMN     "bedId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "public"."plantingBed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

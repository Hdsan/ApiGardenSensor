-- CreateTable
CREATE TABLE "public"."plantingBed" (
    "id" TEXT NOT NULL,

    CONSTRAINT "plantingBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sensor" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."read" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensorId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "read_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensorId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."sensor" ADD CONSTRAINT "sensor_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "public"."plantingBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."read" ADD CONSTRAINT "read_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "public"."sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "public"."sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

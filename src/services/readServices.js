import pkg from "@prisma/client";
import moment from "moment-timezone";
import evapotranspirationServices from "./evapotranspirationServices.js";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const storeSensorInfos = async (postBody) => {
  try {
    const {
      plantingBedId,
      sensor1,
      sensor2,
      sensor3,
      sensor4
    } = postBody;

    // await prisma.air_data.create({
    //   data: {
    //     air_temperature: air_temperature,
    //     air_humidity: air_humidity,
    //   },
    // });

    if ([sensor1, sensor2, sensor3, sensor4].every((v) => v == null)) {
      throw new Error("Nenhum dado de sensor de umidade fornecido.");
    }

    const sensors = await prisma.sensor.findMany({
      where: { bed_id: plantingBedId, type: "soil_moisture" },
      orderBy: { order: "asc" },
    });

    const values = [sensor1, sensor2, sensor3, sensor4];

    const readsToCreate = sensors
      .map((sensor, i) => {
        const raw = values[i];

        if (raw == null) return null;

        const dry = sensor.dry_reference_adc;
        const wet = sensor.wet_reference_adc;

        let percent = ((dry - raw) / (dry - wet)) * 100;

        // limitar 0–150% - 50 de saturação
        percent = Math.max(0, Math.min(150, percent));
        percent = Math.round(percent * 100) / 100; // arredondar para 2 casas decimais

        return {
          sensor_id: sensor.id,
          bed_id: plantingBedId,
          raw_value: raw,
          value: percent,
          date: moment().tz("America/Sao_Paulo").format(),
        };
      })
      .filter(Boolean);

    await prisma.reads.createMany({
      data: readsToCreate,
    });

    const irrigation_miliseconds =
      await evapotranspirationServices.verifyEvapotranspiration(
        plantingBedId,
        readsToCreate,
      );
    
    return irrigation_miliseconds;
  } catch (e) {
    console.error("Erro ao salvar os dados:", e);
    return false;
  }
};

const validateAllowedHour = async (plantingBedId) => {
  console.log("Validando horario permitido para irrigação");
  console.log(moment().tz("America/Sao_Paulo").hour());
  const currentHour = moment().tz("America/Sao_Paulo").hour();
  const schedules = await prisma.schedule.findMany({
    where: { bed_id: plantingBedId },
  });
  const isAllowed = schedules.some(
    (s) => currentHour >= s.startHour && currentHour <= s.endHour,
  );
  if (isAllowed) {
    console.log("Horario permitido para irrigação");
    return true;
  }
  return false;
};
const validateUmidity = async (
  plantingBedId,
  sumSensores,
  numSensoresValidos,
) => {
  try {
    console.log(
      "Validando umidade com a media dos sensores:",
      sumSensores / numSensoresValidos,
    );
    const plantingBed = await prisma.plantingBed.findUnique({
      where: { id: plantingBedId },
    });
    if (
      sumSensores / numSensoresValidos > plantingBed.wateringLevel &&
      (await validateAllowedHour(plantingBedId))
    ) {
      console.log("irrigação permitida");
      return true;
    }
    return false;
  } catch (e) {
    console.error("Erro ao validar umidade:", e);
    return false;
  }
};
async function getReadInfos(bedId) {
  const sensors = await prisma.sensor.findMany({
    where: {
      bed_id: bedId,
    },
    select: {
      order: true,
      type: true,
      reads: {
        select: {
          value: true,
          date: true,
        },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });
  return sensors;
}
export default {
  storeSensorInfos,
  getReadInfos,
};

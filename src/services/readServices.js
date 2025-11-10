import pkg from "@prisma/client";
import moment from "moment-timezone";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const storeIrrigationSalinitySensorInfo = async (postBody) => {
  const { plantingBedId, salinity } = postBody;

  const salinitySensor = await prisma.sensor.findFirst({
    where: {
      bedId: plantingBedId,
      type: "irrigation_salinity",
    },
  });

  if (salinitySensor) {
    await prisma.read.create({
      data: {
        sensorId: salinitySensor.id,
        value: salinity,
        date: moment().tz("America/Sao_Paulo").format(),
      },
    });
  }
  return salinity;
};
const storeSensorInfos = async (postBody) => {
  try {
    console.log(moment().tz("America/Sao_Paulo").format());
    console.log("post de sensores");

    const {
      plantingBedId,
      sensor1,
      sensor2,
      sensor3,
      sensor4,
      airTemperature,
      airUmidity,
    } = postBody;

    console.log(
      plantingBedId,
      sensor1,
      sensor2,
      sensor3,
      sensor4,
      airTemperature,
      airUmidity
    );
    if (
      [sensor1, sensor2, sensor3, sensor4, plantingBedId].every(
        (v) => v == null
      )
    ) {
      throw new Error("Nenhum dado de sensor de umidade fornecido.");
    }
    const plantingBed = await prisma.plantingBed.findUnique({
      where: { id: plantingBedId },
    });
    if (!plantingBed) {
      throw new Error("Canteiro de plantio não encontrado.");
    }

    const sensors = await prisma.sensor.findMany({
      where: { bedId: plantingBedId, NOT: { type: "irrigation_salinity" } },
      orderBy: { order: "asc" },
    });

    const values = [
      sensor1,
      sensor2,
      sensor3,
      sensor4,
      airTemperature,
      airUmidity,
    ];
    const readsToCreate = sensors.map((sensor, i) => ({
      sensorId: sensor.id,
      value: values[i],
      date: moment().tz("America/Sao_Paulo").format(),
    }));

    await prisma.read.createMany({
      data: readsToCreate,
    });
    const sumSensores = sensor1 + sensor2 + sensor3 + sensor4;

    if (await validateUmidity(plantingBedId, sumSensores)) {
      return true;
    }
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
    where: { bedId: plantingBedId },
  });
  const isAllowed = schedules.some(
    (s) => currentHour >= s.startHour && currentHour <= s.endHour
  );
  if (isAllowed) {
    console.log("Horario permitido para irrigação");
    return true;
  }
  return false;
};
const validateUmidity = async (plantingBedId, sumSensores) => {
  try {
    console.log("Validando umidade com a media dos sensores:", sumSensores / 4);
    const plantingBed = await prisma.plantingBed.findUnique({
      where: { id: plantingBedId },
    }); // TODO: definir de acordo com o banco
    if (
      sumSensores / 4 > plantingBed.wateringLevel &&
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
      bedId,
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
  storeIrrigationSalinitySensorInfo,
};

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
};
const storeSensorInfos = async (postBody) => {
  try {
    const {
      plantingBedId,
      sensor1,
      sensor2,
      sensor3,
      sensor4,
      airTemperature,
      airUmidity,
    } = postBody;

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
  console.log("sensores:")
  console.log(sensor1, sensor2, sensor3, sensor4);

    const readsToCreate = sensors.map((sensor, i) => ({
      sensorId: sensor.id,
      value: values[i],
      date: moment().tz("America/Sao_Paulo").format(),
    }));

    await prisma.read.createMany({
      data: readsToCreate,
    });
    const sumSensores = sensor1 + sensor2 + sensor3 + sensor4;

    if (await validateUmidity(sumSensores)) {
      return true;
    }
  } catch (e) {
    console.error("Erro ao salvar os dados:", e);
    return false;
  }
};
const validateAllowedHour = () =>{
  console.log("Validando horario permitido para irrigação");
  console.log(moment().tz("America/Sao_Paulo").hour());
  const currentHour = moment().tz("America/Sao_Paulo").hour();
  if((currentHour >= 5 && currentHour <= 9) || (currentHour>= 16 && currentHour <=18)){ //TODO: definir de acordo com o banco
    return true;
  }
  return false;
}
const validateUmidity = async (sumSensores) => {
  console.log("Validando umidade com a media dos sensores:", sumSensores/4);
  const threshold = 2000; // TODO: definir de acordo com o banco
  if ((sumSensores / 4 > threshold) && validateAllowedHour()) { //futuramente, mudar de 4 fixo para conforme o número dinamico de sensores
    return false;
  }
  console.log("irrigação permitida")
  return true;
};
async function getReadInfos(bedId) {
  const sensors = await prisma.sensor.findMany({
    where: {
      bedId,
    },
    select: {
      order: true,
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

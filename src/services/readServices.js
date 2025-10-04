import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const storeSensorInfos = async (postBody) => {
  try {
    let formattedSensors = [];
    const { plantingBedId, sensor1, sensor2, sensor3, sensor4 } = postBody;

    const sensors = await prisma.sensor.findMany({
      where: { bedId: plantingBedId }, 
      orderBy: { order: "asc" }, 
    });

    const values = [sensor1, sensor2, sensor3, sensor4];

    const readsToCreate = sensors.map((sensor, i) => ({
      sensorId: sensor.id,
      value: values[i],
      date: new Date(),
    }));

    await prisma.read.createMany({
      data: readsToCreate,
    });

    if (await validateUmidity(formattedSensors)) {
      return true;
    }
  } catch (e) {
    console.error("Erro ao salvar os dados:", e);
    return false;
  }
};
const validateUmidity = async (sensors) => {
  //TODO: valida a  necessidade de irrigação
  return true;
};
async function getReadInfos() {
  const sensor = await prisma.read.findMany({});
  return sensor;
}
export default { storeSensorInfos, getReadInfos };

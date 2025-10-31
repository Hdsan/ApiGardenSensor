import { v4 as uuidv4 } from "uuid";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const registerESP32 = async () => {
  try {
    const sensors = [
      { id: uuidv4(), order: 1, type: 'soil_moisture' },
      { id: uuidv4(), order: 2, type: 'soil_moisture' },
      { id: uuidv4(), order: 3, type: 'soil_moisture' },
      { id: uuidv4(), order: 4, type: 'soil_moisture' },
      { id: uuidv4(), order: 5, type: 'irrigation_salinity' },
      { id: uuidv4(), order: 6, type: 'airTemperature' },
      { id: uuidv4(), order: 7, type: 'airHumidity' }
    ];

    const esp32 = await prisma.plantingBed.create({
      data: {
        id: uuidv4(),
        sensors: {
          create: sensors,
        },
      },
    });
    return { esp32, sensors };
  } catch (error) {
    console.error("Error registering ESP32:", error);
    throw error;
  }
};
export default { registerESP32 };

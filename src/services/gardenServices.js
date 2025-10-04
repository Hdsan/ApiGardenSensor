import { v4 as uuidv4 } from "uuid";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const registerESP32 = async () => {
  try {
    const sensors = Array.from({ length: 4 }, (_, i) => ({
      id: uuidv4(),
      order: i + 1,
    }));
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

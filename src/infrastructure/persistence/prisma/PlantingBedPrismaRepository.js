import PlantingBedRepository from '../../../domain/repositories/PlantingBedRepository.js';
import prisma from './PrismaClientProvider.js';

export default class PlantingBedPrismaRepository extends PlantingBedRepository {
  async findById(id) {
    return prisma.plantingBed.findUnique({
      where: { id },
    });
  }

  async createWithSensorsAndSchedules({ plantingBedId, sensors, schedules }) {
    return prisma.$transaction(async (tx) => {
      const plantingBed = await tx.plantingBed.create({
        data: {
          id: plantingBedId,
          sensors: {
            create: sensors.map((sensor) => ({
              id: sensor.id,
              order: sensor.order,
              type: sensor.type,
            })),
          },
        },
        include: {
          sensors: true,
        },
      });

      if (schedules?.length) {
        await tx.schedule.createMany({
          data: schedules.map((schedule) => ({
            bedId: plantingBedId,
            startHour: schedule.startHour,
            endHour: schedule.endHour,
          })),
        });
      }

      return plantingBed;
    });
  }
}

import SensorRepository from '../../../domain/repositories/SensorRepository.js';
import prisma from './PrismaClientProvider.js';

export default class SensorPrismaRepository extends SensorRepository {
  async findOrderedByBedExcludingType(bedId, excludedType) {
    return prisma.sensor.findMany({
      where: {
        bedId,
        NOT: { type: excludedType },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findSalinitySensor(bedId) {
    return prisma.sensor.findFirst({
      where: {
        bedId,
        type: 'irrigation_salinity',
      },
    });
  }

  async findByBedWithLatestRead(bedId) {
    return prisma.sensor.findMany({
      where: { bedId },
      select: {
        order: true,
        type: true,
        reads: {
          select: {
            value: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}

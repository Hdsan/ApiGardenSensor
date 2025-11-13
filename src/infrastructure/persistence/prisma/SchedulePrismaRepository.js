import ScheduleRepository from '../../../domain/repositories/ScheduleRepository.js';
import prisma from './PrismaClientProvider.js';

export default class SchedulePrismaRepository extends ScheduleRepository {
  async findByBed(bedId) {
    return prisma.schedule.findMany({
      where: { bedId },
    });
  }
}

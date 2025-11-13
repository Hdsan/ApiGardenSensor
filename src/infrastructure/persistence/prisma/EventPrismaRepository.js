import EventRepository from '../../../domain/repositories/EventRepository.js';
import prisma from './PrismaClientProvider.js';

export default class EventPrismaRepository extends EventRepository {
  async create(event) {
    return prisma.event.create({
      data: event,
    });
  }
}

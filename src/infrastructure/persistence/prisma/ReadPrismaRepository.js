import ReadRepository from '../../../domain/repositories/ReadRepository.js';
import prisma from './PrismaClientProvider.js';

export default class ReadPrismaRepository extends ReadRepository {
  async createMany(reads) {
    if (!reads.length) {
      return { count: 0 };
    }

    return prisma.read.createMany({
      data: reads,
    });
  }

  async create(read) {
    return prisma.read.create({
      data: read,
    });
  }
}

import ApplicationError from '../../shared/errors/ApplicationError.js';

export default class GetLatestReadingsUseCase {
  constructor({ sensorRepository }) {
    this.sensorRepository = sensorRepository;
  }

  async execute({ bedId }) {
    if (!bedId) {
      throw new ApplicationError('O identificador do canteiro é obrigatório.');
    }

    return this.sensorRepository.findByBedWithLatestRead(bedId);
  }
}

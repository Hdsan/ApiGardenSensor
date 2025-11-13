import ApplicationError from '../../shared/errors/ApplicationError.js';

export default class StoreIrrigationSalinitySensorInfoUseCase {
  constructor({ sensorRepository, readRepository, dateProvider }) {
    this.sensorRepository = sensorRepository;
    this.readRepository = readRepository;
    this.dateProvider = dateProvider;
  }

  async execute({ plantingBedId, salinity }) {
    if (!plantingBedId) {
      throw new ApplicationError('O identificador do canteiro é obrigatório.');
    }

    if (salinity == null || salinity === '') {
      throw new ApplicationError('Valor de salinidade não informado.');
    }

    const numericSalinity = Number(salinity);

    if (!Number.isFinite(numericSalinity)) {
      throw new ApplicationError('Valor de salinidade inválido.');
    }

    const sensor = await this.sensorRepository.findSalinitySensor(plantingBedId);

    if (!sensor) {
      throw new ApplicationError('Sensor de salinidade não encontrado para o canteiro informado.', 404);
    }

    await this.readRepository.create({
      sensorId: sensor.id,
      value: numericSalinity,
      date: this.dateProvider.now(),
    });

    return numericSalinity;
  }
}

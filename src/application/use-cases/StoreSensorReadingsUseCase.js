import ApplicationError from '../../shared/errors/ApplicationError.js';

export default class StoreSensorReadingsUseCase {
  constructor({
    sensorRepository,
    readRepository,
    plantingBedRepository,
    eventRepository,
    scheduleRepository,
    dateProvider,
  }) {
    this.sensorRepository = sensorRepository;
    this.readRepository = readRepository;
    this.plantingBedRepository = plantingBedRepository;
    this.eventRepository = eventRepository;
    this.scheduleRepository = scheduleRepository;
    this.dateProvider = dateProvider;
  }

  parseNumericValue(value, errorMessage) {
    if (value == null || value === '') {
      return null;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      throw new ApplicationError(errorMessage);
    }

    return numericValue;
  }

  async execute(payload) {
    const {
      plantingBedId,
      sensor1,
      sensor2,
      sensor3,
      sensor4,
      airTemperature,
      airUmidity,
    } = payload;

    if (!plantingBedId) {
      throw new ApplicationError('O identificador do canteiro é obrigatório.');
    }

    const moistureInputs = [sensor1, sensor2, sensor3, sensor4];

    const moistureValues = moistureInputs
      .map((value, index) =>
        this.parseNumericValue(value, `Valor inválido recebido para o sensor de umidade ${index + 1}.`),
      )
      .filter((value) => value != null);

    if (!moistureValues.length) {
      throw new ApplicationError('Nenhum dado de sensor de umidade fornecido.');
    }

    const timestamp = this.dateProvider.now();

    const sensors = await this.sensorRepository.findOrderedByBedExcludingType(
      plantingBedId,
      'irrigation_salinity',
    );

    if (!sensors.length) {
      throw new ApplicationError('Nenhum sensor configurado para o canteiro.');
    }

    const numericValues = [...moistureInputs, airTemperature, airUmidity].map((value) =>
      this.parseNumericValue(value, 'Valor inválido recebido para um sensor.'),
    );

    const readsToCreate = sensors
      .map((sensor, index) => {
        const value = numericValues[index];
        if (value == null) {
          return null;
        }

        return {
          sensorId: sensor.id,
          value,
          date: timestamp,
        };
      })
      .filter(Boolean);

    if (!readsToCreate.length) {
      throw new ApplicationError('Nenhum valor válido recebido para gravação.');
    }

    await this.readRepository.createMany(readsToCreate);

    const sumSensors = moistureValues.reduce((accumulator, value) => accumulator + value, 0);
    const moistureAverage = sumSensors / moistureValues.length;

    const shouldTriggerIrrigation = await this.shouldTriggerIrrigation(
      plantingBedId,
      moistureAverage,
    );

    if (shouldTriggerIrrigation) {
      await this.eventRepository.create({
        bedId: plantingBedId,
        description: `Irrigação acionada por sensor de umidade, média de sensores: ${moistureAverage}`,
        type: 'irrigation',
        date: timestamp,
      });
    }

    return shouldTriggerIrrigation;
  }

  async shouldTriggerIrrigation(plantingBedId, averageMoisture) {
    const plantingBed = await this.plantingBedRepository.findById(plantingBedId);

    if (!plantingBed) {
      throw new ApplicationError('Canteiro não encontrado.', 404);
    }

    if (averageMoisture <= plantingBed.wateringLevel) {
      return false;
    }

    const allowed = await this.isIrrigationHourAllowed(plantingBedId);
    return allowed;
  }

  async isIrrigationHourAllowed(plantingBedId) {
    const schedules = await this.scheduleRepository.findByBed(plantingBedId);

    if (!schedules.length) {
      return false;
    }

    const currentHour = this.dateProvider.currentHour();

    return schedules.some(
      (schedule) => currentHour >= schedule.startHour && currentHour <= schedule.endHour,
    );
  }
}

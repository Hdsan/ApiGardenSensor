export default class RegisterDeviceUseCase {
  constructor({ plantingBedRepository, uuidProvider }) {
    this.plantingBedRepository = plantingBedRepository;
    this.uuidProvider = uuidProvider;
  }

  async execute() {
    const plantingBedId = this.uuidProvider.generate();

    const sensors = [
      { id: this.uuidProvider.generate(), order: 1, type: 'soil_moisture' },
      { id: this.uuidProvider.generate(), order: 2, type: 'soil_moisture' },
      { id: this.uuidProvider.generate(), order: 3, type: 'soil_moisture' },
      { id: this.uuidProvider.generate(), order: 4, type: 'soil_moisture' },
      { id: this.uuidProvider.generate(), order: 5, type: 'irrigation_salinity' },
      { id: this.uuidProvider.generate(), order: 6, type: 'airTemperature' },
      { id: this.uuidProvider.generate(), order: 7, type: 'airHumidity' },
    ];

    const schedules = [
      { startHour: 6, endHour: 9 },
      { startHour: 16, endHour: 18 },
    ];

    const plantingBed = await this.plantingBedRepository.createWithSensorsAndSchedules({
      plantingBedId,
      sensors,
      schedules,
    });

    return {
      esp32: plantingBed,
      sensors,
    };
  }
}

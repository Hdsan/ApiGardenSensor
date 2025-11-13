import SensorPrismaRepository from '../persistence/prisma/SensorPrismaRepository.js';
import ReadPrismaRepository from '../persistence/prisma/ReadPrismaRepository.js';
import PlantingBedPrismaRepository from '../persistence/prisma/PlantingBedPrismaRepository.js';
import EventPrismaRepository from '../persistence/prisma/EventPrismaRepository.js';
import SchedulePrismaRepository from '../persistence/prisma/SchedulePrismaRepository.js';
import DateProvider from '../../shared/providers/DateProvider.js';
import UuidProvider from '../../shared/providers/UuidProvider.js';
import StoreSensorReadingsUseCase from '../../application/use-cases/StoreSensorReadingsUseCase.js';
import StoreIrrigationSalinitySensorInfoUseCase from '../../application/use-cases/StoreIrrigationSalinitySensorInfoUseCase.js';
import GetLatestReadingsUseCase from '../../application/use-cases/GetLatestReadingsUseCase.js';
import RegisterDeviceUseCase from '../../application/use-cases/RegisterDeviceUseCase.js';
import ValidatePlantingBedAccessUseCase from '../../application/use-cases/ValidatePlantingBedAccessUseCase.js';

const sensorRepository = new SensorPrismaRepository();
const readRepository = new ReadPrismaRepository();
const plantingBedRepository = new PlantingBedPrismaRepository();
const eventRepository = new EventPrismaRepository();
const scheduleRepository = new SchedulePrismaRepository();
const dateProvider = new DateProvider();
const uuidProvider = new UuidProvider();

const storeSensorReadingsUseCase = new StoreSensorReadingsUseCase({
  sensorRepository,
  readRepository,
  plantingBedRepository,
  eventRepository,
  scheduleRepository,
  dateProvider,
});

const storeIrrigationSalinitySensorInfoUseCase = new StoreIrrigationSalinitySensorInfoUseCase({
  sensorRepository,
  readRepository,
  dateProvider,
});

const getLatestReadingsUseCase = new GetLatestReadingsUseCase({
  sensorRepository,
});

const registerDeviceUseCase = new RegisterDeviceUseCase({
  plantingBedRepository,
  uuidProvider,
});

const validatePlantingBedAccessUseCase = new ValidatePlantingBedAccessUseCase({
  plantingBedRepository,
});

export {
  storeSensorReadingsUseCase,
  storeIrrigationSalinitySensorInfoUseCase,
  getLatestReadingsUseCase,
  registerDeviceUseCase,
  validatePlantingBedAccessUseCase,
};

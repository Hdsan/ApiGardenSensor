import isUUID from '../../shared/utils/isUUID.js';

export default class ValidatePlantingBedAccessUseCase {
  constructor({ plantingBedRepository }) {
    this.plantingBedRepository = plantingBedRepository;
  }

  async execute(plantingBedId) {
    if (!isUUID(plantingBedId)) {
      return false;
    }

    const plantingBed = await this.plantingBedRepository.findById(plantingBedId);

    return Boolean(plantingBed);
  }
}

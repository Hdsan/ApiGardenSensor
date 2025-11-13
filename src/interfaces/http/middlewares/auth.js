import { validatePlantingBedAccessUseCase } from '../../../infrastructure/di/container.js';

export default async function auth(req, res, next) {
  try {
    let plantingBedId;

    if (req.method === 'POST') {
      plantingBedId = req.body.plantingBedId;
    } else if (req.method === 'GET') {
      plantingBedId = req.query.bedId;
    }

    const isAuthorized = await validatePlantingBedAccessUseCase.execute(plantingBedId);

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Acesso negado' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

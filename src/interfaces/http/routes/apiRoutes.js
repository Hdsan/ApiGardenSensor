import express from 'express';
import {
  storeSensorReadingsUseCase,
  storeIrrigationSalinitySensorInfoUseCase,
  registerDeviceUseCase,
  getLatestReadingsUseCase,
} from '../../../infrastructure/di/container.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const result = await storeSensorReadingsUseCase.execute(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/irrigation-salinity', auth, async (req, res, next) => {
  try {
    const result = await storeIrrigationSalinitySensorInfoUseCase.execute(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const device = await registerDeviceUseCase.execute();
    res.status(200).json(device);
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const response = await getLatestReadingsUseCase.execute({ bedId: req.query.bedId });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

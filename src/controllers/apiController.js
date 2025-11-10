import express from 'express';
const router = express.Router();
import readServices from "../services/readServices.js";
import gardenServices from "../services/gardenServices.js";
import auth from '../middleware/auth.js';

router.post("/", auth, async (req, res) => {
  const result = await readServices.storeSensorInfos(req.body);
  
  res.status(200).json(result);
});

router.post("/irrigation-salinity", auth, async (req, res) => {
  const result = await readServices.storeIrrigationSalinitySensorInfo(req.body);
  console.log("resultado salinidade:", result);
  res.status(200).json(result);
});

router.post("/register", async (req ,res) => {
  const device = await gardenServices.registerESP32();
  res.status(200).json(device);
});

router.get("/", auth, async (req, res) => {
  const { bedId } = req.query;
  const response = await readServices.getReadInfos(bedId);
  res.json(response);
});


export default router;

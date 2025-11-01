import express from 'express';
const router = express.Router();
import readServices from "../services/readServices.js";
import gardenServices from "../services/gardenServices.js";
import moment from "moment-timezone";

router.post("/", async (req, res) => {
  // const { sensors, plantingBedId } = req.body;
  const result = await readServices.storeSensorInfos(req.body);
  res.status(200).json(result);
});

router.get("/hour", async (req, res) => {  //REMOVER DEPOIS
  console.log(moment().tz("America/Sao_Paulo").format());
  res.status(200).json(moment().tz("America/Sao_Paulo").format());
});

router.post("/irrigation-salinity", async (req, res) => {
  const result = await readServices.storeIrrigationSalinitySensorInfo(req.body);
  res.status(200).json(result);
});

router.post("/register", async (req ,res) => {
  const device = await gardenServices.registerESP32();
  res.status(200).json(device);
});

router.get("/", async (req, res) => {
  const { bedId } = req.query;
  const response = await readServices.getReadInfos(bedId);
  res.json(response);
});


export default router;

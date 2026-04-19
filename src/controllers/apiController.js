import express from "express";
const router = express.Router();
import readServices from "../services/readServices.js";

router.post("/soil", async (req, res) => {
  const result = await readServices.storeSensorInfos(req.body);
  res.status(200).send(result);
});
router.post("/air", async (req, res) => {
  const result = await readServices.storeSensorInfos(req.body);
  res.status(200).json(result);
});
router.post("/sample", async (req, res) => {
  console.log("ESP32 online....")
  console.log(req.body);
  res.status(200).json(true);
});

router.get("/", async (req, res) => {
  const { bedId } = req.query;
  const response = await readServices.getReadInfos(bedId);
  res.json(response);
});

export default router;

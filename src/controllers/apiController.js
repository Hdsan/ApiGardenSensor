import express from "express";
const router = express.Router();
import readServices from "../services/readServices.js";
import evapotranspirationServices from "../services/evapotranspirationServices.js";

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

router.post("/teach", async (req, res) => {
const { bedId } = req.body;
const response = await readServices.teachIrrigationToIA(bedId);
res.json(response);
});
router.post("/schedule", async (req, res) => {
  const { hour, day, month } = req.body;
  await evapotranspirationServices.scheduleIrrigation(hour, day, month);
  return res.json({ status: true, message: "agendado para " + hour + ":00 " + day + "/" + month });
})
router.delete("/schedule", async (req, res) => {
  await evapotranspirationServices.deleteSchedules();
  return res.json({ status: true, message: "Schedules deletados." });
})
router.get("/schedule", async (req, res) => {
  const schedule = await evapotranspirationServices.getSchedule();
  return res.json(schedule);
});


export default router;

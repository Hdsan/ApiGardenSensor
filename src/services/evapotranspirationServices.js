import { v4 as uuidv4 } from "uuid";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const verifyEvapotranspiration = async (plantingBedId, reads) => {
  try {
    const avgSensor =
      reads.reduce((sum, read) => sum + read.value, 0) / reads.length;
    const plantingBed = await prisma.planting_bed.findUnique({
      where: { id: plantingBedId },
      include: { stage: true, plant: true },
    });
    const fc = plantingBed.field_capacity;
    const wp = plantingBed.wilting_point;
    const V = plantingBed.volume;
    const p = plantingBed.plant.depletion_fraction;

    const water_percent = avgSensor * 0.01;
    const TAW = fc - wp;
    const RAW = TAW * p;

    const water_level = parseFloat((water_percent * fc).toFixed(2)); //agua mm no solo

    const OWPayload = await openWeatherData();

    //corrige a antiga
    const lastEtcPrediction = await prisma.evapotranspiration.findFirst({
      where: { bed_id: plantingBedId },
      orderBy: { date: "desc" },
    });
    if (lastEtcPrediction != null) {
      let lastSensorReads;
      lastSensorReads = await prisma.reads.findMany({
        where: {
          bed_id: plantingBedId,
        },
        orderBy: { date: "desc" },
        skip: 4, //decartas as 4 primeiras, porque chegaram agora
        take: 4,
      });
      if (lastSensorReads.length == 0) {
        lastSensorReads = await prisma.reads.findMany({
          where: {
            bed_id: plantingBedId,
          },
          orderBy: { date: "desc" },
          take: 4, //não descarta, porque tem somente 4 registros
        });
      }

      const avgLastSensorValue =
        lastSensorReads.length > 0
          ? lastSensorReads.reduce((sum, read) => sum + read.value, 0) /
            lastSensorReads.length
          : 0;

      const lastWaterLevel = parseFloat(
        ((avgLastSensorValue / 100) * fc).toFixed(2),
      );

      const realEtc = (lastWaterLevel - water_level) / plantingBed.area;

      await prisma.evapotranspiration.update({
        where: { id: lastEtcPrediction.id },
        data: {
          real_etc: realEtc,
        },
      });
    }

    //faz outra previsão
    const predictedEtc = await predictEvapotranspiration(
      plantingBed,
      OWPayload.hourly.slice(0, 3), // predição de 3 horas
    ); // mm

    const newEtcRecord = await prisma.evapotranspiration.create({
      data: {
        id: uuidv4(),
        date: new Date(),
        bed: {
          connect: { id: plantingBedId },
        },
        expected_etc: predictedEtc,
        real_etc: null,
      },
    });
    console.log("Previsão de evapotranspiração (mm): ", newEtcRecord);

    return await verifyIrrigation(OWPayload, plantingBed, avgSensor);
  } catch (err) {
    console.log("Erro ao calcular ETc: ", err);
    throw err;
  }
};

const predictEvapotranspiration = async (plantingBed, OWPayload) => {
  try {
    const PeriodETo = OWPayload.reduce((sum, hour) => {
      const rs = uviToRs(hour.uvi, hour.clouds);
      return (
        sum +
        penmanMonteithHour({
          temp: hour.temp,
          humidity: hour.humidity,
          wind: hour.wind_speed,
          rs: rs,
        })
      );
    }, 0);

    const Kc = plantingBed.stage.kc;
    const ETc = PeriodETo * Kc;

    return ETc;
  } catch (err) {
    console.error("Error calculating evapotranspiration:", err);
    throw err;
  }
};

const verifyIrrigation = async (OWPayload, plantingBed, avgSensor) => {
  try {
    const now = new Date();
    let hour = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(now);

    let minute = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      minute: "numeric",
      hour12: false,
    }).format(now);

    //ajuste pra considerar os tempo de dessincronização do esp32
    if (hour === 8 && minute >= 55) {
      hour = 9;
      minute = 0;
    } else if (hour === 17 && minute >= 55) {
      hour = 18;
      minute = 0;
    }

    if (Number(hour) !== 9 && Number(hour) !== 18) {
      return 0;
    }
    const fc = plantingBed.field_capacity;
    const wp = plantingBed.wilting_point;
    const p = plantingBed.plant.depletion_fraction;

    const water_percent = avgSensor * 0.01;
    const TAW = fc - wp;
    const RAW = TAW * p;

    const water_level = parseFloat((water_percent * fc).toFixed(3)); //agua ml no solo
    const target_water_level = TAW - RAW + wp; //limite inferior da zona de agua disponível pra planta em questão
    const margin = 0.2 * RAW; //margem de segurança de 20% da água facilmente disponível
    let necessary_water = target_water_level + margin - water_level; //agua necessária pra chegar no limite inferior da zona de água disponível pra planta em questão + margem de segurança
    const nextPeriodHours = now.getHours() === 9 ? 9 : 15;

    const lastIrrigation = await prisma.irrigation.findFirst({
      where: { bed_id: plantingBed.id },
      orderBy: { date: "desc" },
    });
    if (lastIrrigation != null) {
      //atualiza o real gasto de etc
      const realEtc =
        (lastIrrigation.water_before - water_level) / plantingBed.area; //diff em mm
      const waterAfter = water_level;

      await prisma.irrigation.update({
        where: { id: lastIrrigation.id },
        data: {
          real_etc: realEtc,
          water_after: waterAfter,
        },
      });
    }
    // const pastPeriodHours = now.getHours() - (addHour === 9 ? 15 : 9);
    let necessary_seconds = 0;

    if (water_level < plantingBed.field_capacity) {
      const predictedEtc = await predictEvapotranspiration(
        plantingBed,
        OWPayload.hourly.slice(0, nextPeriodHours), // predição de x horas
      ); // mm
      necessary_water = necessary_water + predictedEtc * plantingBed.area; // agua necessária pra irrigar + previsão de evapotranspiração  //em Litros
      necessary_seconds =
        Math.ceil(necessary_water / plantingBed.flow_rate) + 1; // milissegundos necessários pra irrigar a quantidade de água necessária + 1 segundo de offset

      await prisma.irrigation.create({
        data: {
          id: uuidv4(),
          date: new Date(),
          bed: {
            connect: { id: plantingBed.id },
          },
          duration: necessary_seconds,
          water_added: parseFloat(necessary_water.toFixed(3)),
          expected_etc: predictedEtc,
          flow_rate: plantingBed.flow_rate,
          real_etc: null,
          water_before: water_level,
          water_after: null,
        },
      });
      console.log(
        "Água necessária para irrigação (L): ",
        necessary_water,
        "Duração necessária para irrigação (s): ",
        necessary_seconds,
      );
      const necessary_miliseconds = necessary_seconds * 1000;
      return necessary_miliseconds > 0 ? necessary_miliseconds : 0;
    }
    return 0;
  } catch (err) {
    console.error("Erro ao calcular irrigação:", err);
    throw err;
  }
};

const openWeatherData = async () => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${process.env.LATITUDE}&lon=${process.env.LONGITUDE}&exclude=current,minutely,alerts, daily&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching OpenWeather data:", err);
    throw err;
  }
};

function penmanMonteithHour({ temp, humidity, wind, rs }) {
  try {
    const gamma = 0.066; //constante psicrométrica, alteração por altitude é irrelevante
    const albedo = 0.23; //media de albedo, valor aceitável

    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    const ea = es * (humidity / 100);
    const delta = (4098 * es) / Math.pow(temp + 237.3, 2);

    const rn = (1 - albedo) * rs;
    const g = 0.1 * rn;

    const num =
      0.408 * delta * (rn - g) + gamma * (37 / (temp + 273)) * wind * (es - ea);

    const den = delta + gamma * (1 + 0.34 * wind);

    const mm = Math.max(0, num / den); // mm/h
    return mm;
  } catch (err) {
    console.error("Erro no calculo de Penman-Monteith:", err);
    return 0;
  }
}

function uviToRs(uvi, clouds) {
  try {
    let rs = uvi * 25; // W/m²
    rs = rs * (1 - clouds / 100);

    return rs * 0.0036; // MJ/m²/h
  } catch (err) {
    console.error("Erro no calculo de uvi para Rs:", err);
    return 0;
  }
}
export default { verifyEvapotranspiration };

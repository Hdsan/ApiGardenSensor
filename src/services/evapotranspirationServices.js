import { v4 as uuidv4 } from "uuid";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const verifyEvapotranspiration = async (plantingBedId, reads) => {
  try {
    const now = new Date();
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

    const water_level = water_percent * fc; //agua mm no solo

    const target_water_level = TAW - RAW + wp; //limite inferior da zona de agua disponível pra planta em questão

    if (water_level >= plantingBed.field_capacity) {
      return 0; //se o solo já estiver saturado, não é necessário irrigar
    }

    let necessary_water = target_water_level - water_level; //agua necessária pra chegar no limite inferior da zona de água disponível pra planta em questão
    //se for negativo OK, vai ser descontado na agua a ser irrigada

    if (now.getHours() == 9) {
      //agua necessaria pronta, agora é necessario previsao de agua a ser perdida
      // Manhã -> calcular a água necessária pra irrigar

      const nextPeriod = new Date(now);
      nextPeriod.setHours(now.getHours() + 9);
      const OWPayload = await openWeatherData();

      //calcula evapotranspiração real entre 18:00 e 9:00
      const predictedEtc = await predictEvapotranspiration(
        plantingBed,
        OWPayload.hourly.slice(0, 9),
      ); // ETc gasto no periodo passado 18:00 - 9:00 // em litros

      necessary_water = necessary_water + (predictedEtc * plantingBed.area); // agua necessária pra irrigar + previsão de evapotranspiração

      const necessary_miliseconds =
        Math.ceil(necessary_water * plantingBed.flow_rate) + 1; // milissegundos necessários pra irrigar a quantidade de água necessária + 1 segundo de offset

      await prisma.irrigation.create({
        data: {
          id: uuidv4(),
          date: new Date(),
          bed: {
            connect: { id: plantingBedId },
          },
          duration: necessary_miliseconds,
          water_added: Math.round(necessary_water),
          expected_etc: predictedEtc,
          flow_rate: plantingBed.flow_rate,
          real_etc: null,
          water_before: Math.round(water_level),
          water_after: null,
        },
      });

      return necessary_miliseconds > 0 ? necessary_miliseconds : 0;

      // const predictionETc = // OpenWeather //OK

      //A = calcula o necessário pra sair da zona de ppm, se estiver  //OK

      //B = calcula o necessário pra entrar em RAW //OK

      //C = calcula a estimativa que vai ser gasto até 18:00 //OK

      // Irriga A + B + C se não saturar //OK

      //Horario influencia?? <-TODO

      //Guarda no banco a estimativa de ETc que foi prevista //TODO
    } else if (now.getHours() == 18) {
      const lastPrediction = await prisma.irrigation.findFirst({
        where: { bed_id: plantingBedId },
        orderBy: { date: "desc" },
      });

      const realEtc =
        (water_level - lastPrediction.water_before) / plantingBed.area; //diff em mm
      const waterAfter = water_level;

      await prisma.irrigation.update({
        where: { id: lastPrediction.id },
        data: {
          real_etc: realEtc,
          water_after: Math.round(waterAfter),
        },
      });
      // 18:00 verifica a acurácia da estimativa
      const pastPeriodHours = now.getHours() - 9; //calcula evapotranspiração modelo pra irrigação

      // ETc gasto no periodo passado 9:00 -18:00

      // const predictionETc = // OpenWeather
    }
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

const openWeatherData = async () => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${process.env.LATITUDE}&lon=${process.env.LONGITUDE}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching OpenWeather data:", err);
    throw err;
  }
};

function penmanMonteithHour({ temp, humidity, wind, rs }) {
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
}

function uviToRs(uvi, clouds) {
  let rs = uvi * 25; // W/m²
  rs = rs * (1 - clouds / 100);

  return rs * 0.0036; // MJ/m²/h
}

export default { verifyEvapotranspiration };

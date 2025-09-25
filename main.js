const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

  let databasesensor1 = [];
  let databasesensor2 = [];
  let databasesensor3 = [];
  let databasesensor4 = [];
  let databaseAirUmidity = [];

app.post('/', (req, res) => {
const { sensor1, sensor2, sensor3, sensor4 } = req.body;

  console.log('Item recebido:', sensor1, sensor2, sensor3, sensor4);

  databasesensor1.push({umidity: sensor1, date: new Date()});
  databasesensor2.push({umidity: sensor2, date: new Date()});
  databasesensor3.push({umidity: sensor3, date: new Date()});
  databasesensor4.push({umidity: sensor4, date: new Date()});
  res.json({ mensagem: 'Item adicionado com sucesso' });
});

app.get('/', (req, res) => {
  res.json({ databasesensor1, databasesensor2, databasesensor3, databasesensor4 });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

  let databasesensor1 = [];
  let databasesensor2 = [];

app.post('/add', (req, res) => {
  const { sensor1, sensor2 } = req.body;

  console.log('Item recebido:', sensor1, sensor2);
  if (!sensor1 || !sensor2) return res.status(400).json({ erro: 'Sensor1 e Sensor2 são obrigatórios' });

  databasesensor1.push({umidity: sensor1, date: new Date()});
  databasesensor2.push({umidity: sensor2, date: new Date()});
  res.json({ mensagem: 'Item adicionado com sucesso' });
});

app.get('/listar', (req, res) => {
  res.json({ databasesensor1, databasesensor2 });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

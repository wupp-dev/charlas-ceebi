const express = require('express');
const app = express();
const port = 3123;
const csv = require('csv-parser');
const fs = require('fs');
require('console-stamp')(console, { 
  format: ':date(yyyy-mm-dd HH:MM:ss)' 
} );

app.use(express.json());

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!req.query.key) {
    console.log('No key provided!');
    return res.status(400).send('Se debe proporcionar una clave con el parámetro "key".');
  }
  const input = req.query.key.trim().toUpperCase();
  let found = false;
  fs.createReadStream('./private/data.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.id.trim().toUpperCase() === input) {
        console.log(`Found "${row.id}"!`);
        found = true;
        res.json({ output: row });
      }
    })
    .on('end', () => {
      if (!found) {
        console.log(`Not found "${input}"!`);
        res.status(404).send('No se ha encontrado ningún resultado.');
      }
    });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}/api`);
});
const express = require('express');
const app = express();
const port = 3123;
const csv = require('csv-parser');
const fs = require('fs');
const uuid = require('uuid');
require('console-stamp')(console, { 
  format: ':date(yyyy-mm-dd HH:MM:ss)' 
} );

app.use(express.json());

app.get('/api/ceebi-ii/consulta', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!req.query.id) {
    console.log('No id provided!');
    return res.status(400).json({ error: 'Request must include an id!' });
  }
  const input = req.query.id.trim().toUpperCase();
  let found = false;
  fs.createReadStream('./private/query-data.csv')
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
        res.status(404).json({ error: 'No results found!' });
      }
    });
});

app.get('/api/ceebi-ii/certificado/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const path = req.params[0].split('/');
  if(path.at(-1) === '') path.pop(); // Remove last element if empty i.e. path ends with '/'
  if(path.length !== 2) { // Check if path is valid
    console.log('Wrong path!');
    return res.status(400).json({ error: 'Wrong path!' });
  }

  const certType = path[0]; // The type of certificate 'asistencia', 'microcurso' or 'poster'
  const rawId = path[1].split('.'); // The id and the extension of the file

  let isIdValid = false; // Store if id is valid for later use
  if(rawId.length === 2 && rawId[1] === 'pdf' && uuid.validate(rawId[0])) {
    isIdValid = true;
  }

  if(certType === 'asistencia') {
    if(isIdValid) {
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${path[1]}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${path[1]}" not found!`);
          return res.status(500).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${path[1]}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${path[1]}"  not found!`);
        return res.status(500).json({ error: 'Could not find certificatefile' });
      }
    } else {
      console.log('Invalid id!');
      return res.status(400).json({ error: 'Wrong id or id extension in path!' });
    }
  } else if(certType === 'microcurso') {
    if(isIdValid) {
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${path[1]}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${path[1]}" not found!`);
          return res.status(500).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${path[1]}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${path[1]}"  not found!`);
        return res.status(500).json({ error: 'Could not find certificatefile' });
      }
    } else {
      console.log('Invalid id!');
      return res.status(400).json({ error: 'Wrong id or id extension in path!' });
    }
  } else if(certType === 'poster') {
    if(isIdValid) {
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${path[1]}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${path[1]}" not found!`);
          return res.status(500).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${path[1]}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${path[1]}"  not found!`);
        return res.status(500).json({ error: 'Could not find certificatefile' });
      }
    } else {
      console.log('Invalid id!');
      return res.status(400).json({ error: 'Wrong id or id extension in path!' });
    }
  } else {
    console.log('Wrong certificate type!');
    return res.status(400).json({ error: 'Wrong certificate type in path!' });
  }
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}/api`);
});
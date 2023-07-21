const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const uuid = require('uuid');
const supabs = require('@supabase/supabase-js');
require('console-stamp')(console, { 
  format: ':date(yyyy-mm-dd HH:MM:ss)' 
} );
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
console.log(`Connecting to ${supabaseUrl}...`);
const supabase = supabs.createClient(supabaseUrl, supabaseKey)
console.log('Connected!');

function findNifMailMatch(nif, mail) {
  let id = null;
  fs.createReadStream('./private/users-data.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.mail.trim().toLowerCase() === mail && row.nif.trim().toUpperCase() === nif) {
        id = row.id;
      }
    })
    .on('error', (err) => { console.error(err); });
  return id;
}

const app = express();
const port = 3123;
app.use(express.json());

app.get('/api/ceebi-ii/consulta/turnos', (req, res) => {
  console.log('GET /api/ceebi-ii/consulta/turnos');
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
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error!' });
    });
});

app.get('/api/ceebi-ii/consulta/certificado', (req, res) => {
  console.log('GET /api/ceebi-ii/consulta/certificado');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!req.query.nif || !req.query.mail) {
    console.log('No identity document or mail provided!');
    return res.status(400).json({ error: 'Request must include an identity document and a mail!' });
  }

  const nif = req.query.nif.trim().toUpperCase();
  const mail = req.query.mail.trim().toLowerCase();
  const id = findNifMailMatch(nif, mail);
  if(!id) {
    console.log('Identity document and mail pair not found!');
    return res.status(404).json({ error: 'Identity document and mail do not match or could not be found!' });
  }

  // Check attendance, microcourse and poster certificates
  return res.status(503).json({ error: 'API not yet available!' });
});

app.get('/api/ceebi-ii/certificado/*', (req, res) => {
  console.log('GET /api/ceebi-ii/certificado/*');
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
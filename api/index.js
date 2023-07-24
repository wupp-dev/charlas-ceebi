const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const uuid = require('uuid');
const supabs = require('@supabase/supabase-js');
require('console-stamp')(console, {
  format: ':date(yyyy-mm-dd HH:MM:ss)'
});
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
console.log(`Connecting to ${supabaseUrl}...`);
const supabase = supabs.createClient(supabaseUrl, supabaseKey)
console.log('Connected!');

const MICROCURSOS_DOS_DIAS = [
  'Investigación Traslacional y Terapias Avanzadas en Dermatología: de la investigación básica a la clínica',
  'Estudio de las enfermedades genéticas humanas: análisis molecular mediante el uso de herramientas online',
  'Uso de parámetros usados actualmente en la Antropología Física y Forense. Identificación de restos óseos, patologías y traumatismos',
  'Diseño digital e Impresión 3D para el desarrollo de dispositivos personalizados en biomedicina',
  'Técnicas de (Bio)Impresión 3D y desarrollo de biotintas para aplicación en biomedicina',
  'Difracción de rayos X. Identificación de fases sólidas en muestras mono y polifásicas. Informaciones complementarias que ofrece la técnica',
  'Bases moleculares de la nutrición personalizada: Nutrigenómica',
  'HANDS-ON! Aprende las diferencias técnicas para el análisis de la microbiota intestinal con ejemplos prácticos',
];
const microRegEx = /^Microcurso "([\w\sáóéíú:(),¿?.ñ¡!\-\/“”–]+)"$/m;


function findNifMailMatch(nif, email) {
  return new Promise((resolve, reject) => fs.createReadStream('./private/users-data.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.email.trim().toLowerCase() === email && row.nif.trim().toUpperCase() === nif) {
        resolve(row.id)
      }
    })
    .on('error', (err) => { console.error(err); reject(err) })
    .on('end', () => resolve(null)))
}

const app = express();
const port = 3123;
app.use(express.json());

async function checkAttendance(id) {

  const { data: fileURL } = await supabase.storage
    .from("config")
    .getPublicUrl("attendance.json");

  const res = await fetch(fileURL.publicUrl);
  const attendanceSchema = await res.json();

  const { data, error } = await supabase
    .from('attendance')
    .select('attendant_id,session,id')
    .eq('attendant_id', id)

  if (error) {
    console.error(`Something went wrong while trying to check attendance for id: ${id}`)
    return null;
  }

  if (data) {
    const asistencia = Math.round(Math.min(25,
      data.map((att) => ({
        hours: (attendanceSchema).find(
          (schema) => schema.name === att.session
        )?.hours,
      }))
        .reduce((acc, curr) => acc + curr.hours, 0)) / 25 * 100)
    return isNaN(asistencia) ? 0 : asistencia;
  }
  return null;
}

async function checkMicro(id) {
  const { data: fileURL } = await supabase.storage
    .from("config")
    .getPublicUrl("attendance.json");

  const res = await fetch(fileURL.publicUrl);
  const attendanceSchema = await res.json();

  const { data, error } = await supabase
    .from('attendance')
    .select('attendant_id,session,id,event')
    .eq('attendant_id', id)

  if (error) {
    console.error(`Something went wrong while trying to check attendance for id: ${id}`)
    return null;
  }

  if (data) {
    const microcursos = data?.map((att) => (att.event
      ? [att.event]
      : (attendanceSchema).find(
        (schema) => schema.name === att.session
      )?.events
    ))
      .flat()
      .filter((ev) => microRegEx.test(ev ?? ''))
      .map((ev) => (microRegEx.exec(ev))[1] ?? ev)
      .map(
        (ev, _, arr) =>
          [ev, arr.filter((thisCourse) => thisCourse === ev).length]
      )
      .filter(
        ([ev, times]) => !(MICROCURSOS_DOS_DIAS.includes(ev) && times !== 2)
      )
      .map(([ev]) => ev)
      .filter((ev, pos, self) => self.indexOf(ev) === pos)

      if(microcursos.length > 2) {
        console.error(`Found more than two microcourses for id "${id}": ${microcursos}`);
        return null;
      } else {
        return microcursos;
      }
  }
  return null;
}

async function checkPoster(email) {
  const res = await fetch(`https://biociencias.es/wp-json/wp/v2/users?search=${email}`)
  const json = await res.json()
  console.log(`Cecked poster for email "${email}"`)
  if (json.length === 0) {
    console.error('Email not found')
    return null
  }
  else if (json.length === 1) {
    return json[0].acf.has_poster
  } else {
    console.error('Answer length is greater than one')
    return null
  }
}

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

app.get('/api/ceebi-ii/consulta/certificado', async (req, res) => {
  console.log('GET /api/ceebi-ii/consulta/certificado');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!req.query.nif || !req.query.email) {
    console.log('No identity document or email provided!');
    return res.status(400).json({ error: 'Request must include an identity document and a email!' });
  }

  const nif = req.query.nif.trim().toUpperCase();
  const email = req.query.email.trim().toLowerCase();
  let id;
  try {
    id = await findNifMailMatch(nif, email);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'An error occurred when trying to match the identity document and email!' });
  }
  if (!id) {
    console.log('Identity document and email pair not found!');
    return res.status(404).json({ error: 'Identity document and email do not match or could not be found!' });
  }

  const asistencia = await checkAttendance(id);
  const microcursos = await checkMicro(id);
  const poster = await checkPoster(email);

  console.log(asistencia)
  console.log(microcursos)
  console.log(poster)

  if(asistencia != null && microcursos != null && poster != null) {
    return res.status(200).json({
      id: id,
      asistencia: asistencia,
      microcursos: {
        doble: microcursos.length === 2 ? true : microcursos.length === 1 ? !MICROCURSOS_DOS_DIAS.includes(microcursos[0]) : false,
        micro1: microcursos.length > 0 ? microcursos[0] : null,
        micro2: microcursos.length === 2 ? microcursos[1] : null, 
      },
      poster: poster,
    });
  } else {
    return res.status(500).json({ error: 'Something went wrong while trying to achieve user data' });
  }
});

app.get('/api/ceebi-ii/certificado/*', async (req, res) => {
  console.log('GET /api/ceebi-ii/certificado/*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const path = req.params[0].split('/');
  if (path.at(-1) === '') path.pop(); // Remove last element if empty i.e. path ends with '/'
  if (path.length !== 2 || (path.length === 3 && path[0] === 'microcurso' )) { // Check if path is valid
    console.log('Wrong path!');
    return res.status(400).json({ error: 'Wrong path!' });
  }


  const certType = path[0]; // The type of certificate 'asistencia', 'microcurso' or 'poster'
  const micro = path.length === 3 ? path[1] : null;
  const rawId = path.length === 3 ? path[2].split('.') : path[1].split('.'); // The id and the extension of the file

  let isIdValid = false; // Store if id is valid for later use
  if (rawId.length === 2 && rawId[1] === 'pdf' && uuid.validate(rawId[0])) {
    isIdValid = true;
  }

  if (certType === 'asistencia') {
    if (isIdValid) {
      const asistencia = await checkAttendance(rawId[0]);
      if(asistencia === null) {
        return res.status(500).json({ error: 'Something went wrong while trying to achieve attendance data' });
      } else if(asistencia < 80) {
        return res.status(403).json({ error: "User didn't reach minimun attendance" });
      }
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${rawId.join('.')}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${rawId.join('.')}" not found!`);
          return res.status(404).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${rawId.join('.')}"  not found!`);
        return res.status(404).json({ error: 'Could not find certificate file' });
      }
    } else {
      console.log('Invalid id!');
      return res.status(400).json({ error: 'Wrong id or id extension in path!' });
    }
  } else if (certType === 'microcurso') {
    if (isIdValid) {
      const microcursos = (await checkMicro(rawId[0])).map( (mic) => mic.replace(/[áóéíú:(),¿?.ñ¡!\-\/“”– ]/g, '_') );
      if(microcursos === null) {
        return res.status(500).json({ error: 'Something went wrong while trying to achieve microcourses data' });
      } else if(!microcursos.includes(micro)) {
        return res.status(403).json({ error: "User didn't attend to this microcourse" });
      }
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${micro}/${rawId.join('.')}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${micro}/${rawId.join('.')}" not found!`);
          return res.status(404).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${micro}/${rawId.join('.')}"  not found!`);
        return res.status(404).json({ error: 'Could not find certificate file' });
      }
    } else {
      console.log('Invalid id!');
      return res.status(400).json({ error: 'Wrong id or id extension in path!' });
    }
  } else if (certType === 'poster') {
    if (isIdValid) {
      try {
        const filestream = fs.createReadStream(`./private/certificado/${certType}/${rawId.join('.')}`);
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${rawId.join('.')}" not found!`);
          return res.status(404).json({ error: 'Could not find certificate file' });
        });
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`);
          res.setHeader('Content-type', 'application/pdf');
          filestream.pipe(res);
        });
      } catch (err) { // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${rawId.join('.')}"  not found!`);
        return res.status(404).json({ error: 'Could not find certificate file' });
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
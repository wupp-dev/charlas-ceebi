import express from 'express'
import dotenv from 'dotenv'
import { validate } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'
import consoleStamp from 'console-stamp'
import http from 'http'

consoleStamp(console, {
  format: ':date(yyyy-mm-dd HH:MM:ss)'
})
dotenv.config()

type QueryDataRow = {
  id: string
  t1: string
  t2: string
  t3: string
}

type UserDataRow = {
  modalidad: string
  nif: string
  id: string
  email: string
}

const supabaseUrl23 = process.env.SUPABASE_URL_2023 ?? ''
const supabaseKey23 = process.env.SUPABASE_KEY_2023 ?? ''
console.log(`Connecting to ${supabaseUrl23}...`)
const supabase23 = createClient(supabaseUrl23, supabaseKey23, { auth: { persistSession: false } })
console.log('Connected!')

const supabaseUrl24 = process.env.SUPABASE_URL_2024 ?? ''
const supabaseKey24 = process.env.SUPABASE_KEY_2024 ?? ''
console.log(`Connecting to ${supabaseUrl24}...`)
const supabase24 = createClient(supabaseUrl24, supabaseKey24, { auth: { persistSession: false } })
console.log('Connected!')

const EDITIONS = fs.readdirSync('./private').filter((file) => {
  return fs.statSync(path.join('./private', file)).isDirectory()
})

/**
 * Los nombres de los Microcursos que duran dos días
 */
const MICROCURSOS_DOS_DIAS_23 = [
  'Investigación Traslacional y Terapias Avanzadas en Dermatología: de la investigación básica a la clínica',
  'Estudio de las enfermedades genéticas humanas: análisis molecular mediante el uso de herramientas online',
  'Uso de parámetros usados actualmente en la Antropología Física y Forense. Identificación de restos óseos, patologías y traumatismos',
  'Diseño digital e Impresión 3D para el desarrollo de dispositivos personalizados en biomedicina',
  'Técnicas de (Bio)Impresión 3D y desarrollo de biotintas para aplicación en biomedicina',
  'Difracción de rayos X. Identificación de fases sólidas en muestras mono y polifásicas. Informaciones complementarias que ofrece la técnica',
  'Bases moleculares de la nutrición personalizada: Nutrigenómica',
  'HANDS-ON! Aprende las diferencias técnicas para el análisis de la microbiota intestinal con ejemplos prácticos'
]
const MICROCURSOS_DOS_DIAS_24 = [
  'Observación e identificación de organismos fotosintéticos acuáticos: microalgas y macroalgas',
  'Estudio de las enfermedades genéticas humanas: análisis molecular mediante el uso de herramientas online',
  'Técnicas de (Bio)Impresión 3D y desarrollo de biotintas para aplicación en biomedicina',
  'Diseño digital y técnicas de impresión 3D para el desarrollo de dispositivos biomédicos personalizados',
  'HANDS-ON! Aprende las diferentes técnicas para el análisis de la microbiota intestinal con ejemplos prácticos',
  'Análisis bioinformático de datos de secuenciación masiva para el análisis de microbioma',
  'Herramientas para el análisis en metabolómica y el estudio de la función cognitiva y la plasticidad cerebral en modelos animales',
  'Aplicación de la Biología Molecular a la Medicina de Precisión'
]

const microRegEx = /^Microcurso "([\w\sáóéíú:(),¿?.ñ¡!\-\/“”–]+)"$/m

function findNifMailMatch(
  edition: string,
  nif: string,
  email: string
): Promise<[string, boolean] | null> {
  return new Promise(async (resolve, reject) => {
    const filePath = `./private/${edition}/users-data.csv`

    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
    } catch (err) {
      console.error(`File "${filePath}" does not exist.`)
      return reject(new Error(`File "${filePath}" does not exist.`))
    }

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: UserDataRow) => {
        if (row.email.trim().toLowerCase() === email && row.nif.trim().toUpperCase() === nif) {
          resolve([row.id, row.modalidad.trim() === 'Online'])
        }
      })
      .on('error', (err) => {
        console.error(err)
        reject(err)
      })
      .on('end', () => resolve(null))
  })
}

function isIDOnline(edition: string, id: string): Promise<boolean | null> {
  return new Promise(async (resolve, reject) => {
    const filePath = `./private/${edition}/users-data.csv`

    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
    } catch (err) {
      console.error(`File "${filePath}" does not exist.`)
      return reject(new Error(`File "${filePath}" does not exist.`))
    }

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: UserDataRow) => {
        if (row.id.trim().toLowerCase() === id) {
          resolve(row.modalidad.trim() === 'Online')
        }
      })
      .on('error', (err) => {
        console.error(err)
        reject(err)
      })
      .on('end', () => resolve(null))
  })
}

const app = express()
const port = process.env.API_PORT ?? 3000
app.use(express.json())
app.use(express.static('dist'))
const server = http.createServer(app)

async function checkAttendance(edition: string, id: string): Promise<number | null> {
  const supabase = edition === 'ceebi-ii' ? supabase23 : edition === 'ceebi-iii' ? supabase24 : null
  if (!supabase) {
    console.error(`Edition "${edition}" not found!`)
    return null
  }
  const { data: fileURL } = await supabase.storage.from('config').getPublicUrl('attendance.json')

  const res = await fetch(fileURL.publicUrl)
  const attendanceSchema = await res.json()

  const { data, error } = await supabase
    .from('attendance')
    .select('attendant_id,session,id')
    .eq('attendant_id', id)

  if (error) {
    console.error(`Something went wrong while trying to check attendance for id: ${id}`)
    return null
  }

  if (data) {
    const asistencia = Math.round(
      (Math.min(
        25,
        data
          .map((att) => ({
            // @ts-ignore
            hours: attendanceSchema.find((schema) => schema.name === att.session)?.hours
          }))
          .reduce((acc, curr) => acc + curr.hours, 0)
      ) /
        25) *
        100
    )
    return isNaN(asistencia) ? 0 : asistencia
  }
  return null
}

async function checkMicro(edition: string, id: string): Promise<string[] | null> {
  const supabase = edition === 'ceebi-ii' ? supabase23 : edition === 'ceebi-iii' ? supabase24 : null
  if (!supabase) {
    console.error(`Edition "${edition}" not found!`)
    return null
  }

  const MICROCURSOS_DOS_DIAS =
    edition === 'ceebi-iii'
      ? MICROCURSOS_DOS_DIAS_24
      : edition === 'ceebi-ii'
        ? MICROCURSOS_DOS_DIAS_23
        : []

  const { data: fileURL } = await supabase.storage.from('config').getPublicUrl('attendance.json')

  const res = await fetch(fileURL.publicUrl)
  const attendanceSchema = await res.json()

  const { data, error } = await supabase
    .from('attendance')
    .select('attendant_id,session,id,event')
    .eq('attendant_id', id)

  if (error) {
    console.error(`Something went wrong while trying to check attendance for id: ${id}`)
    return null
  }

  if (data) {
    const microcursos = data
      ?.map((att) =>
        att.event
          ? [att.event]
          : // @ts-ignore
            attendanceSchema.find((schema) => schema.name === att.session)?.events
      )
      .flat()
      .filter((ev) => microRegEx.test(ev ?? ''))
      .map((ev) => microRegEx.exec(ev)![1] ?? ev)
      .map((ev, _, arr) => [ev, arr.filter((thisCourse) => thisCourse === ev).length])
      .filter(([ev, times]) => !(MICROCURSOS_DOS_DIAS.includes(ev as string) && times !== 2))
      .map(([ev]) => ev)
      .filter((ev, pos, self) => self.indexOf(ev) === pos)

    if (microcursos.length > 2) {
      console.error(`Found more than two microcourses for id "${id}": ${microcursos}`)
      return null
    } else {
      return microcursos as string[]
    }
  }
  return null
}

function checkPoster(edition: string, id: string): boolean {
  const poster_path = `./private/${edition}/certificado/poster/${id}.zip`
  return fs.existsSync(poster_path) && fs.lstatSync(poster_path).isFile()
  // return new Promise((resolve, reject) =>
  //   fs
  //     .createReadStream(`./private/certificado/poster/${id}.pdf`)
  //     .on('data', (row) => {
  //       resolve(true)
  //     })
  //     .on('error', (err) => {
  //       resolve(false)
  //     })
  // )
  /* 
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
  */
}

app.get('/api/:edition/consulta/turnos', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const edition = req.params.edition.trim().toLowerCase()
  console.log(`GET /api/${edition}/consulta/turnos`)
  if (!EDITIONS.includes(edition)) {
    console.log(`Edition "${edition}" not found!`)
    return res.status(400).json({ error: `Edition "${edition}" not found!` })
  }

  if (!req.query.id || typeof req.query.id !== 'string') {
    console.log('No id provided!')
    return res.status(400).json({ error: 'Request must include an id!' })
  }

  const input = req.query.id.trim().toUpperCase()
  let found = false

  fs.createReadStream(`./private/${edition}/query-data.csv`)
    .pipe(csvParser())
    .on('data', (row: QueryDataRow) => {
      if (row.id.trim().toUpperCase() === input) {
        console.log(`Found "${row.id}"!`)
        found = true
        res.json({ output: row })
      }
    })
    .on('end', () => {
      if (!found) {
        console.log(`Not found "${input}"!`)
        res.status(404).json({ error: 'No results found!' })
      }
    })
    .on('error', (err) => {
      console.error(err)
      res.status(500).json({ error: 'Internal server error!' })
    })
})

app.get('/api/:edition/consulta/certificado', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const edition = req.params.edition.trim().toLowerCase()
  console.log(`GET /api/${edition}/consulta/certificado`)
  if (!EDITIONS.includes(edition)) {
    console.log(`Edition "${edition}" not found!`)
    return res.status(400).json({ error: `Edition "${edition}" not found!` })
  }

  if (
    !req.query.nif ||
    !req.query.email ||
    typeof req.query.nif !== 'string' ||
    typeof req.query.email !== 'string'
  ) {
    console.log('No identity document or email provided!')
    return res.status(400).json({ error: 'Request must include an identity document and a email!' })
  }

  const nif = req.query.nif.trim().toUpperCase()
  const email = req.query.email.trim().toLowerCase()
  let id: string, isOnline: boolean
  try {
    const match = await findNifMailMatch(edition, nif, email)
    if (!match) {
      console.log('Identity document and email pair not found!')
      return res
        .status(404)
        .json({ error: 'Identity document and email do not match or could not be found!' })
    }
    id = match[0]
    isOnline = match[1]
  } catch (e) {
    console.log(e)
    return res
      .status(500)
      .json({ error: 'An error occurred when trying to match the identity document and email!' })
  }

  const asistencia = isOnline ? 100 : await checkAttendance(edition, id)
  const microcursos = await checkMicro(edition, id)
  const poster = checkPoster(edition, id)

  if (asistencia != null && microcursos != null && poster != null) {
    const MICROCURSOS_DOS_DIAS =
      edition === 'ceebi-iii'
        ? MICROCURSOS_DOS_DIAS_24
        : edition === 'ceebi-ii'
          ? MICROCURSOS_DOS_DIAS_23
          : []
    return res.status(200).json({
      id: id,
      asistencia: asistencia,
      microcursos: {
        doble:
          microcursos.length === 2
            ? true
            : microcursos.length === 1
              ? !MICROCURSOS_DOS_DIAS.includes(microcursos[0])
              : false,
        micro1: microcursos.length > 0 ? microcursos[0] : null,
        micro2: microcursos.length === 2 ? microcursos[1] : null
      },
      poster: poster
    })
  } else {
    return res.status(500).json({ error: 'Something went wrong while trying to achieve user data' })
  }
})

app.get('/api/:edition/certificado/*', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const edition = req.params.edition.trim().toLowerCase()
  console.log(`GET /api/${edition}/certificado`)
  if (!EDITIONS.includes(edition)) {
    console.log(`Edition "${edition}" not found!`)
    return res.status(400).json({ error: `Edition "${edition}" not found!` })
  }

  const path = (req.baseUrl + req.path).split('/')
  if (path.at(-1) === '') path.pop() // Remove last element if empty i.e. path ends with '/'
  if (path.length !== 2 && !(path.length === 3 && path[0] === 'microcurso')) {
    // Check if path is valid
    console.log('Wrong path!')
    return res.status(400).json({ error: 'Wrong path!' })
  }

  const certType = path[0] // The type of certificate 'asistencia', 'microcurso' or 'poster'
  const micro = path.length === 3 ? path[1] : null
  const rawId = path.length === 3 ? path[2].split('.') : path[1].split('.') // The id and the extension of the file

  let isIdValid = false // Store if id is valid for later use
  if (rawId.length === 2 && (rawId[1] === 'pdf' || rawId[1] === 'zip') && validate(rawId[0])) {
    isIdValid = true
  }

  if (certType === 'asistencia') {
    if (isIdValid) {
      const asistencia = (await isIDOnline(edition, rawId[0]))
        ? 100
        : await checkAttendance(edition, rawId[0])
      if (asistencia === null) {
        return res
          .status(500)
          .json({ error: 'Something went wrong while trying to achieve attendance data' })
      } else if (asistencia < 80) {
        return res.status(403).json({ error: "User didn't reach minimun attendance" })
      }
      try {
        const filestream = fs.createReadStream(
          `./private/${edition}/certificado/${certType}/${rawId.join('.')}`
        )
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${rawId.join('.')}" not found!`)
          return res.status(404).json({ error: 'Could not find certificate file' })
        })
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`)
          res.setHeader('Content-type', 'application/pdf')
          filestream.pipe(res)
        })
      } catch (err) {
        // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${rawId.join('.')}"  not found!`)
        return res.status(404).json({ error: 'Could not find certificate file' })
      }
    } else {
      console.log('Invalid id!')
      return res.status(400).json({ error: 'Wrong id or id extension in path!' })
    }
  } else if (certType === 'microcurso') {
    if (isIdValid) {
      var microcursos = await checkMicro(edition, rawId[0])
      if (microcursos === null) {
        return res
          .status(500)
          .json({ error: 'Something went wrong while trying to achieve microcourses data' })
      }
      microcursos = microcursos.map((mic) => mic.replace(/[áóéíú:(),¿?.ñ¡!\-\/“”– ]/g, '_'))
      if (micro && !microcursos.includes(micro)) {
        return res.status(403).json({ error: "User didn't attend to this microcourse" })
      }
      try {
        const filestream = fs.createReadStream(
          `./private/${edition}/certificado/${certType}/${micro}/${rawId.join('.')}`
        )
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${micro}/${rawId.join('.')}" not found!`)
          return res.status(404).json({ error: 'Could not find certificate file' })
        })
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`)
          res.setHeader('Content-type', 'application/pdf')
          filestream.pipe(res)
        })
      } catch (err) {
        // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${micro}/${rawId.join('.')}"  not found!`)
        return res.status(404).json({ error: 'Could not find certificate file' })
      }
    } else {
      console.log('Invalid id!')
      return res.status(400).json({ error: 'Wrong id or id extension in path!' })
    }
  } else if (certType === 'poster') {
    if (isIdValid) {
      try {
        const filestream = fs.createReadStream(
          `./private/${edition}/certificado/${certType}/${rawId.join('.')}`
        )
        filestream.on('error', (err) => {
          console.error(`Certificate "${certType}/${rawId.join('.')}" not found!`)
          return res.status(404).json({ error: 'Could not find certificate file' })
        })
        filestream.on('open', () => {
          res.setHeader('Content-disposition', `attachment; filename=${rawId.join('.')}`)
          res.setHeader('Content-type', 'application/zip')
          filestream.pipe(res)
        })
      } catch (err) {
        // Return an internal server error if file is not found
        console.error(`Certificate "${certType}/${rawId.join('.')}"  not found!`)
        return res.status(404).json({ error: 'Could not find certificate file' })
      }
    } else {
      console.log('Invalid id!')
      return res.status(400).json({ error: 'Wrong id or id extension in path!' })
    }
  } else {
    console.log('Wrong certificate type!')
    return res.status(400).json({ error: 'Wrong certificate type in path!' })
  }
})

server.listen(port, () => {
  console.log(`API listening at http://localhost:${port}/api`)
})

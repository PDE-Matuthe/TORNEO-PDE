import express from 'express'
import router from './routes/rutas.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import session from 'express-session'
import dotenv from 'dotenv'
import pool from './config/db.js'

// Cargar variables de entorno
dotenv.config()

// Create express app
const app = express()
const __dirname = dirname(fileURLToPath(import.meta.url))

// Set the template engine
app.set('view engine', 'ejs')
app.set('views', join(__dirname, 'views'))

// Set the public folder
app.use(express.static(join(__dirname, 'public')))

// Set the middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false
    }
  }))

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!(req.session && req.session.usuarioId)
  next()
})

// Set the routes
app.use(router)

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
  console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`)
})

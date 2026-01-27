import express from 'express'
import router from './routes/rutas.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import session from 'express-session'

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
    secret: 'mi_clave_secreta',
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
app.listen(3000, () => console.log('Server is running on http://localhost:3000'))

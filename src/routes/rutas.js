import { Router } from 'express'
import { renderLoginPage, handleLogin, handleLogout } from '../controllers/authController.js'
// Importamos el nuevo controlador de equipos
import { renderEquiposPage, renderCrearEquipo, registerEquipo, deleteEquipoById, updateEquipoById, renderEditarEquipo, renderEquiposPagePublic, renderRosterPagePublic } from '../controllers/equiposController.js'
// Importamos el controlador de jugadores
import { renderRosterPage, addJugadorToEquipo, removeJugador } from '../controllers/jugadoresController.js'
// Importamos el controlador de partidas
import { renderCalendario, renderAdminPartidas, createMatch, updateWinner, deleteMatch } from '../controllers/partidasController.js'
// Importamos el controlador de estadísticas
import { renderMVPPage, renderCargarStats, saveMatchStats } from '../controllers/statsController.js'

const router = Router()

// Middleware para pasar isAuthenticated a todas las vistas
router.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.usuarioId
  res.locals.isAdmin = !!req.session.isAdmin
  next()
})

// --- Middleware de Seguridad ---
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.usuarioId && req.session.isAdmin) {
    next()
  } else {
    req.session.redirectTo = req.originalUrl
    res.redirect('/login')
  }
}

// --- Rutas de Autenticación ---
router.get('/login', renderLoginPage)
router.post('/login', handleLogin)
router.get('/logout', handleLogout)

// --- Rutas PÚBLICAS (Visitantes sin autenticación) ---
router.get('/', (req, res) => res.render('home', { title: 'Torneo LoL - Inicio' }))
router.get('/equipos', renderEquiposPagePublic)                    // Ver lista de equipos (pública)
router.get('/equipos/:id/jugadores', renderRosterPagePublic)      // Ver roster de un equipo (pública)
router.get('/calendario', renderCalendario)                         // Ver calendario (pública)
router.get('/mvp', renderMVPPage)                                   // Ver MVP (pública)

// --- Dashboard Admin ---
router.get('/admin', isAuthenticated, (req, res) => res.render('admin-dashboard', { title: 'Panel de Administración' }))

// --- Rutas de Gestión de Equipos (Protegidas - Solo Admin) ---
router.get('/admin/equipos', isAuthenticated, renderEquiposPage) // Panel admin de equipos

router.get('/admin/equipos/crear', isAuthenticated, renderCrearEquipo) // Formulario crear
router.post('/admin/equipos/crear', isAuthenticated, registerEquipo)   // Guardar nuevo

router.get('/admin/equipos/editar/:id', isAuthenticated, renderEditarEquipo) // Formulario editar
router.post('/admin/equipos/editar/:id', isAuthenticated, updateEquipoById)  // Guardar cambios

router.get('/admin/equipos/delete/:id', isAuthenticated, deleteEquipoById)   // Borrar

// --- Rutas de Jugadores (Admin) ---
router.get('/admin/equipos/:id/jugadores', isAuthenticated, renderRosterPage)       // Ver/Editar lista
router.post('/admin/equipos/:id/jugadores', isAuthenticated, addJugadorToEquipo)    // Agregar jugador
router.get('/admin/equipos/:id/jugadores/delete/:jugadorId', isAuthenticated, removeJugador) // Borrar

// --- Rutas de ADMINISTRACIÓN DE PARTIDAS (Protegidas) ---
router.get('/admin/partidas', isAuthenticated, renderAdminPartidas) // Panel Admin
router.post('/admin/partidas/crear', isAuthenticated, createMatch)  // Crear Partida
router.post('/admin/partidas/ganador', isAuthenticated, updateWinner) // Definir Ganador
router.get('/admin/partidas/delete/:id', isAuthenticated, deleteMatch) // Borrar

// --- Rutas de ESTADÍSTICAS (Cargar stats - Solo Admin) ---
router.get('/admin/partidas/:partidaId/stats', isAuthenticated, renderCargarStats)
router.post('/admin/partidas/:partidaId/stats', isAuthenticated, saveMatchStats)

// Ruta 404 (Siempre al final)
router.use((req, res) => res.status(404).send('Página no encontrada'))

export default router
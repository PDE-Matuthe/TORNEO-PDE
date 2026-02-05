// ==========================================
// RUTAS: Torneo PDE
// ==========================================
import { Router } from 'express'

// Controllers
import * as authController from '../controllers/authController.js'
import * as publicController from '../controllers/publicController.js'
import * as torneosController from '../controllers/torneosController.js'
import * as equiposController from '../controllers/equiposController.js'
import * as jugadoresController from '../controllers/jugadoresController.js'
import * as partidasController from '../controllers/partidasController.js'
import * as statsController from '../controllers/statsController.js'

// Middleware
import { isAuthenticated, isAdmin, userLocals } from '../middleware/auth.js'

const router = Router()

// Middleware global
router.use(userLocals)

// ==========================================
// RUTAS PÚBLICAS
// ==========================================
router.get('/', publicController.getHome)
router.get('/calendario', publicController.getCalendario)
router.get('/bracket', publicController.getBracket)
router.get('/equipos', publicController.getEquiposPublic)
router.get('/mvp', statsController.getMVPPublic)
router.get('/jugador/:id', publicController.getPerfilJugador)
router.get('/partida/:id', publicController.getPartidaDetalle)
router.get('/equipos/:id', publicController.getDetallesEquipo)
router.get('/torneos-anteriores', publicController.getTorneosAnteriores)

// Torneo Específico
router.get('/torneo/:id/calendario', publicController.getCalendarioTorneo)
router.get('/torneo/:id/bracket', publicController.getBracketTorneo)
router.get('/torneo/:id/equipos', publicController.getEquiposTorneo)
router.get('/torneo/:id/mvp', publicController.getMVPTorneo)

// ==========================================
// AUTENTICACIÓN
// ==========================================
router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)
router.get('/logout', authController.getLogout)

// ==========================================
// RUTAS ADMIN
// ==========================================
router.get('/admin', isAuthenticated, isAdmin, publicController.getAdminDashboard)

// API INTERNA
router.get('/api/torneos/:id/equipos', isAuthenticated, isAdmin, equiposController.getEquiposTorneoJSON)
router.get('/admin/test-riot', isAuthenticated, isAdmin, partidasController.getTestRiot)

// ------- TORNEOS -------
router.get('/admin/torneos', isAuthenticated, isAdmin, torneosController.getTorneos)
router.get('/admin/torneos/crear', isAuthenticated, isAdmin, torneosController.getCreateTorneo)
router.get('/admin/torneos/:id/editar', isAuthenticated, isAdmin, torneosController.getEditTorneo)
router.post('/admin/torneos', isAuthenticated, isAdmin, torneosController.postCreateTorneo)
router.post('/admin/torneos/:id/update', isAuthenticated, isAdmin, torneosController.postUpdateTorneo)
router.post('/admin/torneos/:id/activate', isAuthenticated, isAdmin, torneosController.postActivateTorneo)
router.post('/admin/torneos/:id/delete', isAuthenticated, isAdmin, torneosController.postDeleteTorneo)
router.post('/admin/torneos/:id/add-equipo', isAuthenticated, isAdmin, torneosController.postAddEquipoToTorneo)
router.post('/admin/torneos/:id/remove-equipo', isAuthenticated, isAdmin, torneosController.postRemoveEquipoFromTorneo)

// ------- EQUIPOS -------
router.get('/admin/equipos', isAuthenticated, isAdmin, equiposController.getEquipos)
router.get('/admin/equipos/crear', isAuthenticated, isAdmin, equiposController.getCreateEquipo)
router.get('/admin/equipos/:id/editar', isAuthenticated, isAdmin, equiposController.getEditEquipo)
router.post('/admin/equipos', isAuthenticated, isAdmin, equiposController.postCreateEquipo)
router.post('/admin/equipos/:id/update', isAuthenticated, isAdmin, equiposController.postUpdateEquipo)
router.post('/admin/equipos/:id/delete', isAuthenticated, isAdmin, equiposController.postDeleteEquipo)
// Gestión Roster
router.post('/admin/equipos/:id/add-player', isAuthenticated, isAdmin, equiposController.postAddPlayerToTeam)
router.post('/admin/equipos/:id/remove-player', isAuthenticated, isAdmin, equiposController.postRemovePlayerFromTeam)

// ------- JUGADORES -------
router.get('/admin/jugadores', isAuthenticated, isAdmin, jugadoresController.getJugadores)
router.get('/admin/jugadores/crear', isAuthenticated, isAdmin, jugadoresController.getCreateJugador)
router.get('/admin/jugadores/:id/editar', isAuthenticated, isAdmin, jugadoresController.getEditJugador)
router.post('/admin/jugadores', isAuthenticated, isAdmin, jugadoresController.postCreateJugador)
router.post('/admin/jugadores/:id/update', isAuthenticated, isAdmin, jugadoresController.postUpdateJugador)
router.post('/admin/jugadores/:id/delete', isAuthenticated, isAdmin, jugadoresController.postDeleteJugador)

// ------- PARTIDAS -------
// 1. Listado y Creación
router.get('/admin/partidas', isAuthenticated, isAdmin, partidasController.getPartidas)
router.get('/admin/partidas/crear', isAuthenticated, isAdmin, partidasController.getCreatePartida)
router.post('/admin/partidas', isAuthenticated, isAdmin, partidasController.postCreatePartida)

// 2. Edición (Configuración)
router.get('/admin/partidas/:id/editar', isAuthenticated, isAdmin, partidasController.getEditPartida)
router.post('/admin/partidas/:id/update', isAuthenticated, isAdmin, partidasController.postUpdatePartida)

// 3. Carga Manual y Detalles (EL ORDEN IMPORTA)
router.get('/admin/partidas/:id/cargar', isAuthenticated, isAdmin, partidasController.getPartidaDetalle)
router.post('/admin/partidas/:id/guardar-manual', isAuthenticated, isAdmin, partidasController.postCargarStatsManual)

// 4. Importación Riot (Opcional)
router.post('/admin/partidas/:id/import-riot', isAuthenticated, isAdmin, partidasController.postImportRiotStats)

// 5. Borrar
router.post('/admin/partidas/:id/delete', isAuthenticated, isAdmin, partidasController.postDeletePartida)


// ------- ESTADÍSTICAS -------
router.get('/admin/stats', isAuthenticated, isAdmin, partidasController.getStats)
router.get('/admin/stats-torneo/:torneoId', isAuthenticated, isAdmin, statsController.getStatsTorneo)

// ==========================================
// ERROR 404
// ==========================================
router.use((req, res) => {
  res.status(404).render('error', {
    codigo: 404,
    mensaje: 'Página no encontrada'
  })
})

export default router
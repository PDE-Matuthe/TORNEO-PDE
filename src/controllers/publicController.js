// ==========================================
// CONTROLADOR: Vistas Públicas
// ==========================================
import * as torneosModel from '../models/torneos.js'
import * as equiposModel from '../models/equipos.js'
import * as partidasModel from '../models/partidas.js'
import * as jugadoresModel from '../models/jugadores.js'

/**
 * GET / - Home (Vista Pública)
 */
export async function getHome (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()

    if (!torneoActivo) {
      return res.render('home', {
        error: 'No hay torneo activo en este momento',
        torneo: null
      })
    }

    const equipos = await equiposModel.getEquiposByTorneo(torneoActivo.id)
    const partidas = await partidasModel.getPartidasByTorneo(torneoActivo.id)

    res.render('home', {
      torneo: torneoActivo,
      equipos,
      partidas
    })
  } catch (error) {
    console.error('Error en getHome:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar la página de inicio'
    })
  }
}

/**
 * GET /calendario - Calendario de partidas (Vista Pública)
 */
export async function getCalendario (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()

    if (!torneoActivo) {
      return res.render('calendario', {
        error: 'No hay torneo activo en este momento',
        partidas: []
      })
    }

    const partidas = await partidasModel.getPartidasByTorneo(torneoActivo.id)

    res.render('calendario', {
      torneo: torneoActivo,
      partidas
    })
  } catch (error) {
    console.error('Error en getCalendario:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar el calendario'
    })
  }
}

/**
 * GET /equipos - Equipos (Vista Pública)
 */
export async function getEquiposPublic (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()

    if (!torneoActivo) {
      return res.render('equipos-public', {
        error: 'No hay torneo activo en este momento',
        equipos: []
      })
    }

    const equipos = await equiposModel.getEquiposByTorneo(torneoActivo.id)

    res.render('equipos-public', {
      torneo: torneoActivo,
      equipos
    })
  } catch (error) {
    console.error('Error en getEquiposPublic:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar equipos'
    })
  }
}

/**
 * GET /equipo/:id - Roster de un equipo (Vista Pública)
 */
export async function getEquipoRoster (req, res) {
  try {
    const { id } = req.params

    const equipo = await equiposModel.getEquipoById(id)
    if (!equipo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Equipo no encontrado'
      })
    }

    const jugadores = await jugadoresModel.getJugadoresByEquipo(id)

    res.render('roster-public', {
      equipo,
      jugadores
    })
  } catch (error) {
    console.error('Error en getEquipoRoster:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar roster'
    })
  }
}

/**
 * GET /bracket - Bracket/Llaves (Vista Pública)
 */
export async function getBracket (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()

    if (!torneoActivo) {
      return res.render('bracket', {
        error: 'No hay torneo activo en este momento'
      })
    }

    // Obtener partidas ordenadas por fase
    const partidas = await partidasModel.getPartidasByTorneo(torneoActivo.id)

    // Agrupar por fase
    const fases = {}
    for (const partida of partidas) {
      if (!fases[partida.fase_torneo]) {
        fases[partida.fase_torneo] = []
      }
      fases[partida.fase_torneo].push(partida)
    }

    res.render('bracket', {
      torneo: torneoActivo,
      fases
    })
  } catch (error) {
    console.error('Error en getBracket:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar bracket'
    })
  }
}

/**
 * GET /admin - Dashboard admin
 */
export async function getAdminDashboard (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()
    const equipos = await equiposModel.getAllEquipos()
    const partidas = await partidasModel.getAllPartidas()

    res.render('admin-dashboard', {
      torneoActivo,
      equipos_count: equipos.length,
      partidas_count: partidas.length
    })
  } catch (error) {
    console.error('Error en getAdminDashboard:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar dashboard'
    })
  }
}

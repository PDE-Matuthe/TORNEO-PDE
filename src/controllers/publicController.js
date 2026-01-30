// ==========================================
// CONTROLADOR: Vistas Públicas
// ==========================================
import * as torneosModel from '../models/torneos.js'
import * as equiposModel from '../models/equipos.js'
import * as partidasModel from '../models/partidas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as estadisticasModel from '../models/estadisticas.js'

/**
 * GET / - Home (Vista Pública Renovada)
 */
export async function getHome (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()
    
    // 1. Obtener datos globales para el Contador
    const allTorneos = await torneosModel.getAllTorneos();
    const allEquipos = await equiposModel.getAllEquipos();
    const allJugadores = await jugadoresModel.getAllJugadores();
    const allPartidas = await partidasModel.getAllPartidas();

    // 2. Si no hay torneo activo, mandamos null pero con estadísticas
    if (!torneoActivo) {
      return res.render('home', {
        error: 'No hay torneo activo en este momento',
        torneo: null,
        stats: {
          torneos: allTorneos.length,
          equipos: allEquipos.length,
          jugadores: allJugadores.length,
          partidas: allPartidas.length
        },
        partidasHoy: []
      })
    }

    // 3. Obtener partidas de HOY para el mini-calendario
    const partidasTorneo = await partidasModel.getPartidasByTorneo(torneoActivo.id)
    
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0]; // "2026-01-30"

    const partidasHoy = partidasTorneo.filter(p => {
      const fechaP = new Date(p.fecha_partida).toISOString().split('T')[0];
      return fechaP === hoyString;
    });

    res.render('home', {
      torneo: torneoActivo,
      stats: {
        torneos: allTorneos.length,
        equipos: allEquipos.length,
        jugadores: allJugadores.length,
        partidas: allPartidas.length
      },
      partidasHoy
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
 * GET /torneos-anteriores - Listar torneos anteriores (no activos)
 */
export async function getTorneosAnteriores (req, res) {
  try {
    const allTorneos = await torneosModel.getAllTorneos()
    const torneoActivo = await torneosModel.getTorneoActivo()

    // Filtrar torneos que no son el activo
    const torneosAnteriores = allTorneos.filter(t => !torneoActivo || t.id !== torneoActivo.id)

    res.render('torneos-anteriores', {
      torneos: torneosAnteriores,
      torneoActivo
    })
  } catch (error) {
    console.error('Error en getTorneosAnteriores:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar torneos anteriores'
    })
  }
}

/**
 * GET /torneo/:id/calendario - Calendario de un torneo específico
 */
export async function getCalendarioTorneo (req, res) {
  try {
    const { id } = req.params
    
    const torneo = await torneosModel.getTorneoById(id)
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }

    const partidas = await partidasModel.getPartidasByTorneo(id)

    res.render('calendario', {
      torneo,
      partidas,
      isTorneoEspecifico: true
    })
  } catch (error) {
    console.error('Error en getCalendarioTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar el calendario'
    })
  }
}

/**
 * GET /torneo/:id/bracket - Bracket de un torneo específico
 */
export async function getBracketTorneo (req, res) {
  try {
    const { id } = req.params
    
    const torneo = await torneosModel.getTorneoById(id)
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }

    const partidas = await partidasModel.getPartidasByTorneo(id)

    // Agrupar por fase
    const fases = {}
    for (const partida of partidas) {
      if (!fases[partida.fase_torneo]) {
        fases[partida.fase_torneo] = []
      }
      fases[partida.fase_torneo].push(partida)
    }

    res.render('bracket', {
      torneo,
      fases,
      isTorneoEspecifico: true
    })
  } catch (error) {
    console.error('Error en getBracketTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar bracket'
    })
  }
}

/**
 * GET /torneo/:id/equipos - Equipos de un torneo específico
 */
export async function getEquiposTorneo (req, res) {
  try {
    const { id } = req.params
    
    const torneo = await torneosModel.getTorneoById(id)
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }

    const equipos = await equiposModel.getEquiposByTorneo(id)

    res.render('equipos-public', {
      torneo,
      equipos,
      isTorneoEspecifico: true
    })
  } catch (error) {
    console.error('Error en getEquiposTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar equipos'
    })
  }
}

/**
 * GET /torneo/:id/mvp - Ranking MVP de un torneo específico
 */
export async function getMVPTorneo (req, res) {
  try {
    const { id } = req.params
    
    const torneo = await torneosModel.getTorneoById(id)
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }

    const ranking = await estadisticasModel.getMVPRanking(id)

    res.render('mvp', {
      torneo,
      ranking,
      isTorneoEspecifico: true
    })
  } catch (error) {
    console.error('Error en getMVPTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar ranking MVP'
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

/**
 * GET /partida/:id - Detalles de partida (Vista Pública)
 */
export async function getPartidaDetalle (req, res) {
  try {
    const { id } = req.params

    const partida = await partidasModel.getPartidaById(id)
    if (!partida) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Partida no encontrada'
      })
    }

    const stats = await estadisticasModel.getEstadisticasByPartida(id)

    res.render('partida-detalle', {
      partida,
      stats
    })
  } catch (error) {
    console.error('Error en getPartidaDetalle:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar detalle de partida'
    })
  }
}

/**
 * GET /jugador/:id - Perfil del jugador (Vista Pública)
 */
export async function getPerfilJugador (req, res) {
  try {
    const { id } = req.params

    const jugador = await jugadoresModel.getJugadorById(id)
    if (!jugador) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Jugador no encontrado'
      })
    }

    const estadisticas = await estadisticasModel.getEstadisticasByJugador(id)
    const resumen = await estadisticasModel.getResumenJugador(id)

    res.render('perfil-jugador', {
      jugador,
      estadisticas,
      resumen
    })
  } catch (error) {
    console.error('Error en getPerfilJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar perfil del jugador'
    })
  }
}

/**
 * GET /equipo/:id - Detalles de equipo (Vista Pública)
 */
export async function getDetallesEquipo (req, res) {
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
    const partidas = await partidasModel.getPartidasByEquipo(id)

    res.render('equipo-detalle', {
      equipo,
      jugadores,
      partidas
    })
  } catch (error) {
    console.error('Error en getDetallesEquipo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar detalles del equipo'
    })
  }
}

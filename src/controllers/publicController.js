// ==========================================
// CONTROLADOR: Vistas Públicas (src/controllers/publicController.js)
// ==========================================
import * as torneosModel from '../models/torneos.js'
import * as equiposModel from '../models/equipos.js'
import * as partidasModel from '../models/partidas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as estadisticasModel from '../models/estadisticas.js' 
import { getPartidasBracket } from '../models/partidas.js';
import { getTorneoActivo } from '../models/torneos.js'; 


/**
 * GET / - Home
 */
export async function getHome (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()
    const allTorneos = await torneosModel.getAllTorneos();
    const allEquipos = await equiposModel.getAllEquipos();
    const allJugadores = await jugadoresModel.getAllJugadores();
    const allPartidas = await partidasModel.getAllPartidas();

    if (!torneoActivo) {
      return res.render('home', {
        error: 'No hay torneo activo',
        torneo: null,
        stats: { torneos: allTorneos.length, equipos: allEquipos.length, jugadores: allJugadores.length, partidas: allPartidas.length },
        partidasHoy: []
      })
    }

    const partidasTorneo = await partidasModel.getPartidasByTorneo(torneoActivo.id)
    const hoyString = new Date().toISOString().split('T')[0];
    const partidasHoy = partidasTorneo.filter(p => new Date(p.fecha_partida).toISOString().split('T')[0] === hoyString);

    res.render('home', {
      torneo: torneoActivo,
      stats: { torneos: allTorneos.length, equipos: allEquipos.length, jugadores: allJugadores.length, partidas: allPartidas.length },
      partidasHoy
    })
  } catch (error) {
    console.error('Error en getHome:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar inicio' })
  }
}

export async function getCalendario (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()
    const partidas = torneoActivo ? await partidasModel.getPartidasByTorneo(torneoActivo.id) : []
    res.render('calendario', { torneo: torneoActivo, partidas })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar calendario' })
  }
}

export async function getEquiposPublic (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()
    const equipos = torneoActivo ? await equiposModel.getEquiposByTorneo(torneoActivo.id) : []
    res.render('equipos-public', { torneo: torneoActivo, equipos })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar equipos' })
  }
}

export async function getEquipoRoster (req, res) {
  try {
    const { id } = req.params
    const equipo = await equiposModel.getEquipoById(id)
    if (!equipo) return res.status(404).render('error', { codigo: 404, mensaje: 'Equipo no encontrado' })
    
    const jugadores = await jugadoresModel.getJugadoresByEquipo(id)
    res.render('roster-public', { equipo, jugadores })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar roster' })
  }
}

export const getBracket = async (req, res) => {
  try {
    const torneo = await getTorneoActivo();
    
    if (!torneo) {
        return res.render('bracket', { partidas: [], torneo: null });
    }

    const partidas = await getPartidasBracket(torneo.id);

    res.render('bracket', { 
        partidas, 
        torneo 
    });

  } catch (error) {
    console.error('Error en getBracket:', error);
    res.status(500).render('error', { message: 'Error al cargar el bracket' });
  }
};

export async function getTorneosAnteriores (req, res) {
  try {
    const allTorneos = await torneosModel.getAllTorneos()
    const torneoActivo = await torneosModel.getTorneoActivo()
    const torneosAnteriores = allTorneos.filter(t => !torneoActivo || t.id !== torneoActivo.id)
    res.render('torneos-anteriores', { torneos: torneosAnteriores, torneoActivo })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar torneos' })
  }
}

/**
 * GET /ranking - Ranking MVP (Vista 'mvp.ejs')
 */
export const getRanking = async (req, res) => {
  try {
    const torneo = await getTorneoActivo();
    
    // Si no hay torneo, renderizamos la vista 'mvp' vacía
    if (!torneo) {
        return res.render('mvp', { ranking: [] }); 
    }

    // Usamos el modelo corregido
    const ranking = await estadisticasModel.getMVPRanking(torneo.id);

    res.render('mvp', { 
        ranking: ranking 
    });

  } catch (error) {
    console.error('Error en getRanking:', error);
    res.status(500).render('mvp', { ranking: [] });
  }
};

// --- PERFIL DE JUGADOR ---
export async function getPerfilJugador (req, res) {
  try {
    const { id } = req.params
    const jugador = await jugadoresModel.getJugadorById(id)
    if (!jugador) return res.status(404).render('error', { codigo: 404, mensaje: 'Jugador no encontrado' })

    const resumen = await estadisticasModel.getResumenJugador(id)
    const topChampions = await estadisticasModel.getTopChampionsJugador(id)
    const estadisticas = await estadisticasModel.getEstadisticasByJugador(id)

    res.render('perfil-jugador', { 
      jugador,
      resumen: resumen || {},
      topChampions: topChampions || [],
      estadisticas: estadisticas || []
    })
  } catch (error) {
    console.error('Error en getPerfilJugador:', error)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar perfil' })
  }
}

export async function getPartidaDetalle (req, res) {
  try {
    const { id } = req.params
    const partida = await partidasModel.getPartidaById(id)
    if (!partida) return res.status(404).render('error', { codigo: 404, mensaje: 'Partida no encontrada' })

    const stats = await estadisticasModel.getEstadisticasByPartida(id)
    res.render('partida-detalle', { partida, stats })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar detalle' })
  }
}

export async function getDetallesEquipo (req, res) {
  try {
    const { id } = req.params
    const equipo = await equiposModel.getEquipoById(id)
    if (!equipo) return res.status(404).render('error', { codigo: 404, mensaje: 'Equipo no encontrado' })
    const jugadores = await jugadoresModel.getJugadoresByEquipo(id)
    res.render('equipo-detalle', { equipo, jugadores })
  } catch (error) {
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar equipo' })
  }
}

// ======================================
// Funciones Auxiliares / Stubs
// ======================================

export async function getCalendarioTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    if (!torneo) return res.status(404).render('error', { codigo: 404, mensaje: 'Torneo no encontrado' })

    const partidas = await partidasModel.getPartidasByTorneo(id)

    res.render('calendario', { 
      torneo, 
      partidas,
      isTorneoEspecifico: true 
    })
  } catch (error) {
    console.error('Error en getCalendarioTorneo:', error)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar calendario' })
  }
}

export async function getBracketTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    if (!torneo) return res.status(404).render('error', { codigo: 404, mensaje: 'Torneo no encontrado' })

    const partidas = await partidasModel.getPartidasByTorneo(id)

    // Agrupar por fase
    const fases = {}
    partidas.forEach(p => {
      if (!fases[p.fase_torneo]) fases[p.fase_torneo] = []
      fases[p.fase_torneo].push(p)
    })

    res.render('bracket', { 
      torneo, 
      fases,
      isTorneoEspecifico: true 
    })
  } catch (error) {
    console.error('Error en getBracketTorneo:', error)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar bracket' })
  }
}

export async function getEquiposTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    if (!torneo) return res.status(404).render('error', { codigo: 404, mensaje: 'Torneo no encontrado' })

    const equipos = await equiposModel.getEquiposByTorneo(id)

    res.render('equipos-public', { 
      torneo, 
      equipos,
      isTorneoEspecifico: true 
    })
  } catch (error) {
    console.error('Error en getEquiposTorneo:', error)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar equipos' })
  }
}

export async function getMVPTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    if (!torneo) return res.status(404).render('error', { codigo: 404, mensaje: 'Torneo no encontrado' })

    const ranking = await estadisticasModel.getMVPRanking(id)

    // Renderizamos 'mvp' también aquí para consistencia
    res.render('mvp', { 
      torneo, 
      ranking,
      isTorneoEspecifico: true 
    })
  } catch (error) {
    console.error('Error en getMVPTorneo:', error)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar MVP' })
  }
}

export async function getAdminDashboard (req, res) {
  try {
    const [equipos, jugadores, partidas, torneoActivo] = await Promise.all([
      equiposModel.getAllEquipos(),
      jugadoresModel.getAllJugadores(),
      partidasModel.getAllPartidas(),
      torneosModel.getTorneoActivo()
    ])

    const stats = {
      totalEquipos: equipos.length,
      totalJugadores: jugadores.length,
      totalPartidas: partidas.length,
      partidasPendientes: partidas.filter(p => !p.ganador_id).length,
      torneoActual: torneoActivo ? torneoActivo.nombre : 'Ninguno activo'
    }

    res.render('admin-dashboard', {
      user: req.user, 
      stats          
    })

  } catch (error) {
    console.error('Error en getAdminDashboard:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar el panel' })
  }
}
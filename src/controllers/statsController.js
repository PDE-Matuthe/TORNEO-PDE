// ==========================================
// CONTROLADOR: Estadísticas (Públicas + Admin)
// ==========================================
import * as estadisticasModel from '../models/estadisticas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as torneosModel from '../models/torneos.js'

/**
 * GET /mvp - MVP Ranking (Vista Pública)
 */
export async function getMVPPublic (req, res) {
  try {
    const torneoActivo = await torneosModel.getTorneoActivo()

    if (!torneoActivo) {
      return res.render('mvp', {
        error: 'No hay torneo activo en este momento',
        ranking: []
      })
    }

    const ranking = await estadisticasModel.getMVPRanking(torneoActivo.id)

    res.render('mvp', {
      torneo: torneoActivo,
      ranking
    })
  } catch (error) {
    console.error('Error en getMVPPublic:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar ranking MVP'
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
 * GET /admin/stats-torneo/:torneoId - Estadísticas de un torneo (Admin)
 */
export async function getStatsTorneo (req, res) {
  try {
    const { torneoId } = req.params

    const torneo = await torneosModel.getTorneoById(torneoId)
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }

    const ranking = await estadisticasModel.getMVPRanking(torneoId)

    res.render('admin-stats-torneo', {
      torneo,
      ranking
    })
  } catch (error) {
    console.error('Error en getStatsTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar estadísticas del torneo'
    })
  }
}
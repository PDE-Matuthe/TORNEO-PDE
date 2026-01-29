// ==========================================
// CONTROLADOR: Partidas & Estadísticas (Admin)
// ==========================================
import * as partidasModel from '../models/partidas.js'
import * as estadisticasModel from '../models/estadisticas.js'
import * as jugadoresModel from '../models/jugadores.js'
import * as torneosModel from '../models/torneos.js'
import * as equiposModel from '../models/equipos.js'
import * as riotService from '../services/riotService.js'

/**
 * GET /admin/partidas - Listar todas las partidas
 */
export async function getPartidas (req, res) {
  try {
    const partidas = await partidasModel.getAllPartidas()
    const torneos = await torneosModel.getAllTorneos()

    res.render('admin-partidas', {
      partidas,
      torneos
    })
  } catch (error) {
    console.error('Error en getPartidas:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar partidas'
    })
  }
}

/**
 * GET /admin/partidas/:id - Detalle de partida (para editar y cargar Riot stats)
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
    const torneos = await torneosModel.getAllTorneos()

    res.render('admin-partida-detalle', {
      partida,
      stats,
      torneos,
      riotConfigured: riotService.isApiKeyConfigured()
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
 * POST /admin/partidas - Crear nueva partida
 */
export async function postCreatePartida (req, res) {
  try {
    const { torneo_id, equipo_azul_id, equipo_rojo_id, fecha_partida, fase_torneo } = req.body

    if (!torneo_id || !equipo_azul_id || !equipo_rojo_id || !fecha_partida) {
      return res.status(400).render('admin-partidas', {
        error: 'Todos los campos son requeridos'
      })
    }

    const newPartida = await partidasModel.createPartida(
      torneo_id,
      equipo_azul_id,
      equipo_rojo_id,
      fecha_partida,
      fase_torneo
    )

    console.log(`✅ Partida creada: ${newPartida.id}`)
    res.redirect(`/admin/partidas/${newPartida.id}`)
  } catch (error) {
    console.error('Error en postCreatePartida:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al crear partida'
    })
  }
}

/**
 * POST /admin/partidas/:id/import-riot - Importar estadísticas desde Riot API
 * CRÍTICO: Esta es la función más importante para la funcionalidad del torneo
 */
export async function postImportRiotStats (req, res) {
  try {
    const { id: partidaId } = req.params
    const { riot_match_id } = req.body

    if (!riot_match_id) {
      return res.status(400).json({
        error: 'Riot Match ID es requerido'
      })
    }

    // Verificar que Riot API esté configurada
    if (!riotService.isApiKeyConfigured()) {
      return res.status(400).json({
        error: 'Riot API no está configurada. Agrega tu API key en .env'
      })
    }

    // Obtener detalles de la partida
    const partida = await partidasModel.getPartidaById(partidaId)
    if (!partida) {
      return res.status(404).json({
        error: 'Partida no encontrada'
      })
    }

    // Importar datos de Riot
    const riotData = await riotService.importMatchStats(riot_match_id)
    if (!riotData) {
      return res.status(404).json({
        error: 'No se encontró la partida en Riot API'
      })
    }

    // Eliminar stats existentes (si las hay)
    await estadisticasModel.deleteEstadisticasByPartida(partidaId)

    // Procesar stats de cada jugador
    let statsCreados = 0
    for (const stat of riotData.stats) {
      // Buscar al jugador en la BD por nombre invocador
      const jugador = await jugadoresModel.getJugadorByNombreInvocador(stat.summoner_name)

      if (!jugador) {
        console.warn(`⚠️ Jugador no encontrado: ${stat.summoner_name}`)
        continue
      }

      // Determinar equipo correcto basado en el color en Riot
      let equipoId
      if (stat.team === 'azul') {
        equipoId = partida.equipo_azul_id
      } else {
        equipoId = partida.equipo_rojo_id
      }

      // Crear estadística
      await estadisticasModel.createEstadistica(
        partidaId,
        jugador.id,
        equipoId,
        {
          kills: stat.kills,
          deaths: stat.deaths,
          assists: stat.assists,
          cs_min: Math.round(stat.cs_min * 100) / 100,
          dmg_min: Math.round(stat.dmg_min * 100) / 100,
          champion_name: stat.champion_name,
          win: stat.win
        }
      )

      statsCreados++
    }

    // Actualizar partida con datos de Riot
    await partidasModel.updatePartida(partidaId, {
      riot_match_id: riot_match_id,
      duracion_segundos: riotData.duration_segundos,
      ganador_id: riotData.stats[0].win ? partida.equipo_azul_id : partida.equipo_rojo_id
    })

    console.log(`✅ Estadísticas importadas: ${statsCreados} jugadores`)
    res.json({
      success: true,
      message: `Se importaron estadísticas de ${statsCreados} jugadores`,
      stats_count: statsCreados
    })
  } catch (error) {
    console.error('Error en postImportRiotStats:', error.message)
    res.status(500).json({
      error: error.message || 'Error al importar estadísticas'
    })
  }
}

/**
 * POST /admin/partidas/:id/delete - Eliminar partida
 */
export async function postDeletePartida (req, res) {
  try {
    const { id } = req.params

    // Eliminar estadísticas primero (por FK)
    await estadisticasModel.deleteEstadisticasByPartida(id)

    // Eliminar partida
    await partidasModel.deletePartida(id)

    console.log(`✅ Partida eliminada: ${id}`)
    res.redirect('/admin/partidas?success=Partida eliminada exitosamente')
  } catch (error) {
    console.error('Error en postDeletePartida:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al eliminar partida'
    })
  }
}

/**
 * GET /admin/stats - Ver todas las estadísticas
 */
export async function getStats (req, res) {
  try {
    const torneos = await torneosModel.getAllTorneos()
    const torneoActivo = await torneosModel.getTorneoActivo()

    res.render('admin-stats', {
      torneos,
      torneoActivo
    })
  } catch (error) {
    console.error('Error en getStats:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar estadísticas'
    })
  }
}
// ==========================================
// MODELO: Estadísticas
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener estadísticas de una partida
 */
export async function getEstadisticasByPartida (partidaId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(e.id) as id, BIN_TO_UUID(e.partida_id) as partida_id,
              BIN_TO_UUID(e.jugador_id) as jugador_id, j.nombre_invocador,
              BIN_TO_UUID(e.equipo_id) as equipo_id, eq.nombre as equipo_nombre,
              e.kills, e.deaths, e.assists, e.cs_min, e.dmg_min,
              e.champion_name, e.win
       FROM estadisticas e
       INNER JOIN jugadores j ON e.jugador_id = j.id
       INNER JOIN equipos eq ON e.equipo_id = eq.id
       WHERE e.partida_id = UUID_TO_BIN(?)
       ORDER BY eq.id, e.champion_name`,
      [partidaId]
    )
    return rows
  } catch (error) {
    console.error('Error en getEstadisticasByPartida:', error.message)
    throw error
  }
}

/**
 * Obtener estadísticas de un jugador
 */
export async function getEstadisticasByJugador (jugadorId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(e.id) as id, BIN_TO_UUID(e.partida_id) as partida_id, p.fecha_partida,
              e.kills, e.deaths, e.assists, e.cs_min, e.dmg_min,
              e.champion_name, e.win, BIN_TO_UUID(e.equipo_id) as equipo_id, eq.nombre as equipo_nombre
       FROM estadisticas e
       INNER JOIN partidas p ON e.partida_id = p.id
       INNER JOIN equipos eq ON e.equipo_id = eq.id
       WHERE e.jugador_id = UUID_TO_BIN(?)
       ORDER BY p.fecha_partida DESC`,
      [jugadorId]
    )
    return rows
  } catch (error) {
    console.error('Error en getEstadisticasByJugador:', error.message)
    throw error
  }
}

/**
 * Obtener MVP ranking de un torneo
 */
export async function getMVPRanking (torneoId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(e.jugador_id) as jugador_id, j.nombre_invocador, j.rol_juego,
              BIN_TO_UUID(e.equipo_id) as equipo_id, eq.nombre as equipo_nombre, eq.logo_url as equipo_logo,
              SUM(e.kills) as total_kills, SUM(e.deaths) as total_deaths, SUM(e.assists) as total_assists,
              ROUND((SUM(e.kills) + SUM(e.assists)) / NULLIF(SUM(e.deaths), 0), 2) as kda,
              ROUND(AVG(e.cs_min), 1) as avg_cs, ROUND(AVG(e.dmg_min), 0) as avg_dmg,
              COUNT(e.partida_id) as partidas_jugadas, SUM(CASE WHEN e.win THEN 1 ELSE 0 END) as partidas_ganadas
       FROM estadisticas e
       INNER JOIN jugadores j ON e.jugador_id = j.id
       INNER JOIN equipos eq ON e.equipo_id = eq.id
       INNER JOIN partidas p ON e.partida_id = p.id
       WHERE p.torneo_id = UUID_TO_BIN(?)
       GROUP BY e.jugador_id, j.nombre_invocador, j.rol_juego, e.equipo_id, eq.nombre, eq.logo_url
       ORDER BY kda DESC, total_kills DESC, partidas_ganadas DESC
       LIMIT 20`,
      [torneoId]
    )
    return rows
  } catch (error) {
    console.error('Error en getMVPRanking:', error.message)
    throw error
  }
}

/**
 * Crear estadística
 */
export async function createEstadistica (partidaId, jugadorId, equipoId, stats) {
  try {
    const [result] = await pool.query(
      `INSERT INTO estadisticas 
       (id, partida_id, jugador_id, equipo_id, kills, deaths, assists, cs_min, dmg_min, champion_name, win)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?)`,
      [
        partidaId, jugadorId, equipoId,
        stats.kills || 0,
        stats.deaths || 0,
        stats.assists || 0,
        stats.cs_min || 0,
        stats.dmg_min || 0,
        stats.champion_name || 'Unknown',
        stats.win ? 1 : 0
      ]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en createEstadistica:', error.message)
    throw error
  }
}

/**
 * Actualizar estadística
 */
export async function updateEstadistica (estadisticaId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.kills !== undefined) {
      fields.push('kills = ?')
      values.push(updates.kills)
    }
    if (updates.deaths !== undefined) {
      fields.push('deaths = ?')
      values.push(updates.deaths)
    }
    if (updates.assists !== undefined) {
      fields.push('assists = ?')
      values.push(updates.assists)
    }
    if (updates.cs_min !== undefined) {
      fields.push('cs_min = ?')
      values.push(updates.cs_min)
    }
    if (updates.dmg_min !== undefined) {
      fields.push('dmg_min = ?')
      values.push(updates.dmg_min)
    }
    if (updates.champion_name) {
      fields.push('champion_name = ?')
      values.push(updates.champion_name)
    }
    if (updates.win !== undefined) {
      fields.push('win = ?')
      values.push(updates.win ? 1 : 0)
    }

    if (fields.length === 0) return null

    values.push(estadisticaId)

    const [result] = await pool.query(
      `UPDATE estadisticas SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updateEstadistica:', error.message)
    throw error
  }
}

/**
 * Obtener resumen de jugador (para perfil)
 */
export async function getResumenJugador (jugadorId) {
  try {
    const [stats] = await pool.query(
      `SELECT SUM(e.kills) as kills_total, SUM(e.deaths) as deaths_total, SUM(e.assists) as assists_total,
              COUNT(DISTINCT e.partida_id) as partidas_jugadas, SUM(CASE WHEN e.win THEN 1 ELSE 0 END) as partidas_ganadas,
              GROUP_CONCAT(DISTINCT e.champion_name) as campeones
       FROM estadisticas e
       WHERE e.jugador_id = UUID_TO_BIN(?)`,
      [jugadorId]
    )
    return stats.length > 0 ? stats[0] : null
  } catch (error) {
    console.error('Error en getResumenJugador:', error.message)
    throw error
  }
}

/**
 * Eliminar estadísticas de una partida
 */
export async function deleteEstadisticasByPartida (partidaId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM estadisticas WHERE partida_id = UUID_TO_BIN(?)',
      [partidaId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteEstadisticasByPartida:', error.message)
    throw error
  }
}

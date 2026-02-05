// ==========================================
// MODELO: Estadísticas
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener estadísticas de una partida
 * Se usa para mostrar la tabla de resultados en el admin y en la vista pública.
 */
export async function getEstadisticasByPartida (partidaId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.*,
        BIN_TO_UUID(e.id) as id,
        BIN_TO_UUID(e.partida_id) as partida_id,
        BIN_TO_UUID(e.jugador_id) as jugador_id,
        BIN_TO_UUID(e.equipo_id) as equipo_id,
        j.nombre_invocador,
        eq.nombre as nombre_equipo, eq.logo_url as logo_equipo
      FROM estadisticas e
      JOIN jugadores j ON e.jugador_id = j.id
      JOIN equipos eq ON e.equipo_id = eq.id
      WHERE e.partida_id = UUID_TO_BIN(?)
      ORDER BY e.equipo_id, e.rol, e.kills DESC
    `, [partidaId])
    return rows
  } catch (error) {
    console.error('Error en getEstadisticasByPartida:', error.message)
    throw error
  }
}

/**
 * Crear una nueva estadística
 * NOTA: El campo 'rol' se inserta como texto plano (sin UUID_TO_BIN)
 */
export async function createEstadistica (partidaId, jugadorId, equipoId, stats) {
  try {
    await pool.query(`
      INSERT INTO estadisticas 
      (id, partida_id, jugador_id, equipo_id, rol, kills, deaths, assists, cs_min, dmg_min, champion_name, win)
      VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      partidaId, 
      jugadorId, 
      equipoId, 
      stats.rol || 'UNKNOWN', // <--- CORRECCIÓN: Esto es texto, va directo al ?
      stats.kills, 
      stats.deaths, 
      stats.assists, 
      stats.cs_min, 
      stats.dmg_min, 
      stats.champion_name, 
      stats.win
    ])
  } catch (error) {
    console.error('Error en createEstadistica:', error.message)
    throw error
  }
}

/**
 * Eliminar estadísticas de una partida
 * Se usa para limpiar datos antes de una re-importación o carga manual.
 */
export async function deleteEstadisticasByPartida (partidaId) {
  try {
    await pool.query('DELETE FROM estadisticas WHERE partida_id = UUID_TO_BIN(?)', [partidaId])
  } catch (error) {
    console.error('Error en deleteEstadisticasByPartida:', error.message)
    throw error
  }
}
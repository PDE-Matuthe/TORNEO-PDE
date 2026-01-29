// ==========================================
// MODELO: Jugadores
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener todos los jugadores
 */
export async function getAllJugadores () {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, 
              BIN_TO_UUID(j.equipo_id) as equipo_id, e.nombre as equipo_nombre
       FROM jugadores j
       LEFT JOIN equipos e ON j.equipo_id = e.id
       ORDER BY e.nombre, j.nombre_invocador`
    )
    return rows
  } catch (error) {
    console.error('Error en getAllJugadores:', error.message)
    throw error
  }
}

/**
 * Obtener jugador por ID
 */
export async function getJugadorById (jugadorId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, 
              BIN_TO_UUID(j.equipo_id) as equipo_id, e.nombre as equipo_nombre
       FROM jugadores j
       LEFT JOIN equipos e ON j.equipo_id = e.id
       WHERE j.id = UUID_TO_BIN(?)`,
      [jugadorId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getJugadorById:', error.message)
    throw error
  }
}

/**
 * Obtener jugadores por equipo
 */
export async function getJugadoresByEquipo (equipoId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego
       FROM jugadores j
       WHERE j.equipo_id = UUID_TO_BIN(?)
       ORDER BY j.rol_juego, j.nombre_invocador`,
      [equipoId]
    )
    return rows
  } catch (error) {
    console.error('Error en getJugadoresByEquipo:', error.message)
    throw error
  }
}

/**
 * Buscar jugador por nombre invocador (para Riot API)
 */
export async function getJugadorByNombreInvocador (nombreInvocador) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, 
              BIN_TO_UUID(j.equipo_id) as equipo_id
       FROM jugadores j
       WHERE LOWER(j.nombre_invocador) = LOWER(?)`,
      [nombreInvocador]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getJugadorByNombreInvocador:', error.message)
    throw error
  }
}

/**
 * Crear nuevo jugador
 */
export async function createJugador (nombreInvocador, rol, equipoId) {
  try {
    const [result] = await pool.query(
      'INSERT INTO jugadores (id, nombre_invocador, rol_juego, equipo_id) VALUES (UUID_TO_BIN(UUID()), ?, ?, UUID_TO_BIN(?))',
      [nombreInvocador, rol, equipoId]
    )
    return {
      id: result.insertId,
      nombre_invocador: nombreInvocador,
      rol_juego: rol,
      equipo_id: equipoId
    }
  } catch (error) {
    console.error('Error en createJugador:', error.message)
    throw error
  }
}

/**
 * Actualizar jugador
 */
export async function updateJugador (jugadorId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.nombre_invocador) {
      fields.push('nombre_invocador = ?')
      values.push(updates.nombre_invocador)
    }
    if (updates.rol_juego) {
      fields.push('rol_juego = ?')
      values.push(updates.rol_juego)
    }
    if (updates.equipo_id) {
      fields.push('equipo_id = UUID_TO_BIN(?)')
      values.push(updates.equipo_id)
    }

    if (fields.length === 0) return null

    values.push(jugadorId)

    const [result] = await pool.query(
      `UPDATE jugadores SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updateJugador:', error.message)
    throw error
  }
}

/**
 * Eliminar jugador
 */
export async function deleteJugador (jugadorId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM jugadores WHERE id = UUID_TO_BIN(?)',
      [jugadorId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteJugador:', error.message)
    throw error
  }
}
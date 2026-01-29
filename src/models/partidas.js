// ==========================================
// MODELO: Partidas
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener todas las partidas
 */
export async function getAllPartidas () {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(p.id) as id, BIN_TO_UUID(p.torneo_id) as torneo_id, t.nombre as torneo_nombre,
              BIN_TO_UUID(p.equipo_azul_id) as equipo_azul_id, ea.nombre as equipo_azul,
              BIN_TO_UUID(p.equipo_rojo_id) as equipo_rojo_id, er.nombre as equipo_rojo,
              p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id,
              p.riot_match_id, p.duracion_segundos
       FROM partidas p
       INNER JOIN torneos t ON p.torneo_id = t.id
       INNER JOIN equipos ea ON p.equipo_azul_id = ea.id
       INNER JOIN equipos er ON p.equipo_rojo_id = er.id
       ORDER BY p.fecha_partida DESC`
    )
    return rows
  } catch (error) {
    console.error('Error en getAllPartidas:', error.message)
    throw error
  }
}

/**
 * Obtener partida por ID
 */
export async function getPartidaById (partidaId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(p.id) as id, BIN_TO_UUID(p.torneo_id) as torneo_id, t.nombre as torneo_nombre,
              BIN_TO_UUID(p.equipo_azul_id) as equipo_azul_id, ea.nombre as equipo_azul,
              BIN_TO_UUID(p.equipo_rojo_id) as equipo_rojo_id, er.nombre as equipo_rojo,
              p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id,
              p.riot_match_id, p.duracion_segundos
       FROM partidas p
       INNER JOIN torneos t ON p.torneo_id = t.id
       INNER JOIN equipos ea ON p.equipo_azul_id = ea.id
       INNER JOIN equipos er ON p.equipo_rojo_id = er.id
       WHERE p.id = UUID_TO_BIN(?)`,
      [partidaId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getPartidaById:', error.message)
    throw error
  }
}

/**
 * Obtener partidas de un torneo
 */
export async function getPartidasByTorneo (torneoId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(p.id) as id, BIN_TO_UUID(p.torneo_id) as torneo_id,
              BIN_TO_UUID(p.equipo_azul_id) as equipo_azul_id, ea.nombre as equipo_azul, ea.logo_url as logo_azul,
              BIN_TO_UUID(p.equipo_rojo_id) as equipo_rojo_id, er.nombre as equipo_rojo, er.logo_url as logo_rojo,
              p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id,
              CASE WHEN p.ganador_id = ea.id THEN 'Azul' WHEN p.ganador_id = er.id THEN 'Rojo' ELSE NULL END as ganador_color,
              p.riot_match_id, p.duracion_segundos
       FROM partidas p
       INNER JOIN equipos ea ON p.equipo_azul_id = ea.id
       INNER JOIN equipos er ON p.equipo_rojo_id = er.id
       WHERE p.torneo_id = UUID_TO_BIN(?)
       ORDER BY p.fecha_partida ASC`,
      [torneoId]
    )
    return rows
  } catch (error) {
    console.error('Error en getPartidasByTorneo:', error.message)
    throw error
  }
}

/**
 * Crear nueva partida
 */
export async function createPartida (torneoId, equipoAzulId, equipoRojoId, fechaPartida, faseTorneo = 'Fase de Grupos') {
  try {
    const [result] = await pool.query(
      `INSERT INTO partidas (id, torneo_id, equipo_azul_id, equipo_rojo_id, fecha_partida, fase_torneo)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)`,
      [torneoId, equipoAzulId, equipoRojoId, fechaPartida, faseTorneo]
    )
    return {
      id: result.insertId,
      torneo_id: torneoId,
      equipo_azul_id: equipoAzulId,
      equipo_rojo_id: equipoRojoId,
      fecha_partida: fechaPartida,
      fase_torneo: faseTorneo
    }
  } catch (error) {
    console.error('Error en createPartida:', error.message)
    throw error
  }
}

/**
 * Actualizar partida
 */
export async function updatePartida (partidaId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.fecha_partida) {
      fields.push('fecha_partida = ?')
      values.push(updates.fecha_partida)
    }
    if (updates.fase_torneo) {
      fields.push('fase_torneo = ?')
      values.push(updates.fase_torneo)
    }
    if (updates.ganador_id) {
      fields.push('ganador_id = UUID_TO_BIN(?)')
      values.push(updates.ganador_id)
    }
    if (updates.riot_match_id) {
      fields.push('riot_match_id = ?')
      values.push(updates.riot_match_id)
    }
    if (updates.duracion_segundos !== undefined) {
      fields.push('duracion_segundos = ?')
      values.push(updates.duracion_segundos)
    }

    if (fields.length === 0) return null

    values.push(partidaId)

    const [result] = await pool.query(
      `UPDATE partidas SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updatePartida:', error.message)
    throw error
  }
}

/**
 * Obtener partida por Riot Match ID
 */
export async function getPartidaByRiotMatchId (riotMatchId) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id FROM partidas WHERE riot_match_id = ?',
      [riotMatchId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getPartidaByRiotMatchId:', error.message)
    throw error
  }
}

/**
 * Eliminar partida
 */
export async function deletePartida (partidaId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM partidas WHERE id = UUID_TO_BIN(?)',
      [partidaId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deletePartida:', error.message)
    throw error
  }
}
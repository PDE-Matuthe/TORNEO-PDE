// ==========================================
// MODELO: Partidas
// ==========================================
import pool from '../config/db.js'

/**
 * Función auxiliar: Apagar el estado 'EN_VIVO' de cualquier otra partida
 */
export async function resetOtrasPartidasEnVivo (partidaExcluidaId) {
  try {
    await pool.query(
      `UPDATE partidas SET estado = 'ACTIVO' WHERE estado = 'EN_VIVO' AND id != UUID_TO_BIN(?)`,
      [partidaExcluidaId]
    )
  } catch (error) {
    console.error('Error en resetOtrasPartidasEnVivo:', error.message)
    throw error
  }
}

/**
 * Obtener todas las partidas (Para el Admin)
 * Incluye el nombre del torneo para la agrupación.
 */
export async function getAllPartidas () {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(p.id) as id,
        p.fecha_partida,
        p.fase_torneo,
        p.estado,
        t.nombre as torneo_nombre,
        BIN_TO_UUID(p.torneo_id) as torneo_id,
        BIN_TO_UUID(p.ganador_id) as ganador_id,
        p.riot_match_id, p.duracion_segundos,
        BIN_TO_UUID(p.equipo_azul_id) as azul_id,
        ea.nombre as azul_nombre, ea.logo_url as azul_logo, ea.siglas as azul_siglas,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_azul_id THEN e.kills ELSE 0 END), 0) as azul_kills,
        BIN_TO_UUID(p.equipo_rojo_id) as rojo_id,
        er.nombre as rojo_nombre, er.logo_url as rojo_logo, er.siglas as rojo_siglas,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_rojo_id THEN e.kills ELSE 0 END), 0) as rojo_kills
      FROM partidas p
      LEFT JOIN torneos t ON p.torneo_id = t.id
      JOIN equipos ea ON p.equipo_azul_id = ea.id
      JOIN equipos er ON p.equipo_rojo_id = er.id
      LEFT JOIN estadisticas e ON p.id = e.partida_id
      GROUP BY p.id, ea.id, er.id, t.id
      ORDER BY t.fecha_inicio DESC, p.fecha_partida DESC
    `)
    return rows
  } catch (error) {
    console.error('Error en getAllPartidas:', error.message)
    throw error
  }
}

/**
 * Obtener partidas de un torneo (Para el Home/Calendario)
 */
export async function getPartidasByTorneo (torneoId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(p.id) as id,
        BIN_TO_UUID(p.equipo_azul_id) as azul_id, ea.nombre as azul_nombre, ea.logo_url as azul_logo,
        BIN_TO_UUID(p.equipo_rojo_id) as rojo_id, er.nombre as rojo_nombre, er.logo_url as rojo_logo,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_azul_id THEN e.kills ELSE 0 END), 0) as azul_kills,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_rojo_id THEN e.kills ELSE 0 END), 0) as rojo_kills,
        p.fecha_partida, p.fase_torneo, p.estado, BIN_TO_UUID(p.ganador_id) as ganador_id
      FROM partidas p
      JOIN equipos ea ON p.equipo_azul_id = ea.id
      JOIN equipos er ON p.equipo_rojo_id = er.id
      LEFT JOIN estadisticas e ON p.id = e.partida_id
      WHERE p.torneo_id = UUID_TO_BIN(?)
      GROUP BY p.id, ea.id, er.id
      ORDER BY p.fecha_partida ASC
    `, [torneoId])
    return rows
  } catch (error) {
    console.error('Error en getPartidasByTorneo:', error.message)
    throw error
  }
}

/**
 * Obtener una partida específica con detalles
 */
export async function getPartidaById (partidaId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(p.id) as id,
        p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id,
        p.estado, p.stream_url,
        p.riot_match_id, p.duracion_segundos,
        BIN_TO_UUID(p.torneo_id) as torneo_id,
        BIN_TO_UUID(p.equipo_azul_id) as azul_id, ea.nombre as azul_nombre, ea.logo_url as azul_logo, ea.siglas as azul_siglas,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_azul_id THEN e.kills ELSE 0 END), 0) as azul_kills,
        BIN_TO_UUID(p.equipo_rojo_id) as rojo_id, er.nombre as rojo_nombre, er.logo_url as rojo_logo, er.siglas as rojo_siglas,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_rojo_id THEN e.kills ELSE 0 END), 0) as rojo_kills
      FROM partidas p
      JOIN equipos ea ON p.equipo_azul_id = ea.id
      JOIN equipos er ON p.equipo_rojo_id = er.id
      LEFT JOIN estadisticas e ON p.id = e.partida_id
      WHERE p.id = UUID_TO_BIN(?)
      GROUP BY p.id
    `, [partidaId])
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getPartidaById:', error.message)
    throw error
  }
}

/**
 * Crear nueva partida
 */
export async function createPartida (equipoAzulId, equipoRojoId, fechaPartida, faseTorneo, torneoId = null) {
  try {
    let query = `INSERT INTO partidas (id, equipo_azul_id, equipo_rojo_id, fecha_partida, fase_torneo`
    let values = [equipoAzulId, equipoRojoId, fechaPartida, faseTorneo]
    let placeholders = `VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?`

    if (torneoId) {
        query += `, torneo_id`
        placeholders += `, UUID_TO_BIN(?)`
        values.push(torneoId)
    }
    
    query += `) ${placeholders})`

    await pool.query(query, values)
  } catch (error) {
    console.error('Error en createPartida:', error.message)
    throw error
  }
}

/**
 * Actualizar partida (Soporta todos los campos nuevos)
 */
export async function updatePartida (partidaId, updates) {
  try {
    const fields = []
    const values = []

    const simpleFields = [
      'fecha_partida', 'fase_torneo', 'estado', 'stream_url', 
      'riot_match_id', 'duracion_segundos'
    ];

    simpleFields.forEach(field => {
        if (updates[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    });

    if (updates.ganador_id !== undefined) {
      fields.push('ganador_id = UUID_TO_BIN(?)')
      values.push(updates.ganador_id)
    }
    if (updates.equipo_azul_id) {
      fields.push('equipo_azul_id = UUID_TO_BIN(?)')
      values.push(updates.equipo_azul_id)
    }
    if (updates.equipo_rojo_id) {
      fields.push('equipo_rojo_id = UUID_TO_BIN(?)')
      values.push(updates.equipo_rojo_id)
    }
    if (updates.torneo_id) {
        fields.push('torneo_id = UUID_TO_BIN(?)')
        values.push(updates.torneo_id)
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
 * Obtener partidas de un equipo
 */
export async function getPartidasByEquipo (equipoId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(p.id) as id,
        p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id, p.estado,
        ea.nombre as azul_nombre, ea.logo_url as azul_logo,
        er.nombre as rojo_nombre, er.logo_url as rojo_logo,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_azul_id THEN e.kills ELSE 0 END), 0) as azul_kills,
        COALESCE(SUM(CASE WHEN e.equipo_id = p.equipo_rojo_id THEN e.kills ELSE 0 END), 0) as rojo_kills
      FROM partidas p
      JOIN equipos ea ON p.equipo_azul_id = ea.id
      JOIN equipos er ON p.equipo_rojo_id = er.id
      LEFT JOIN estadisticas e ON p.id = e.partida_id
      WHERE p.equipo_azul_id = UUID_TO_BIN(?) OR p.equipo_rojo_id = UUID_TO_BIN(?)
      GROUP BY p.id, ea.id, er.id
      ORDER BY p.fecha_partida DESC
      LIMIT 10
    `, [equipoId, equipoId])
    return rows
  } catch (error) {
    console.error('Error en getPartidasByEquipo:', error.message)
    throw error
  }
}

/**
 * Buscar partida por Riot Match ID
 */
export async function getPartidaByRiotMatchId (riotMatchId) {
  try {
    const [rows] = await pool.query('SELECT BIN_TO_UUID(id) as id FROM partidas WHERE riot_match_id = ?', [riotMatchId])
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
    const [result] = await pool.query('DELETE FROM partidas WHERE id = UUID_TO_BIN(?)', [partidaId])
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deletePartida:', error.message)
    throw error
  }
}
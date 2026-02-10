// ==========================================
// MODELO: Partidas
// ==========================================
import pool from '../config/db.js'
import * as uuid from 'uuid';

/**
 * Función auxiliar: Apagar el estado 'EN_VIVO' de cualquier otra partida
 * (Para asegurar que solo haya un directo a la vez)
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
 */
// En src/models/partidas.js

export const getAllPartidas = async (filtros = {}) => {
    let query = `
      SELECT 
        p.id, p.fecha_partida, p.fase_torneo, p.estado, p.posicion_bracket,
        t.nombre as torneo_nombre,
        ea.nombre as azul_nombre, ea.logo_url as azul_logo,
        er.nombre as rojo_nombre, er.logo_url as rojo_logo,
        BIN_TO_UUID(p.ganador_id) as ganador_id,
        BIN_TO_UUID(p.equipo_azul_id) as equipo_azul_id,
        BIN_TO_UUID(p.equipo_rojo_id) as equipo_rojo_id
      FROM partidas p
      JOIN torneos t ON p.torneo_id = t.id
      LEFT JOIN equipos ea ON p.equipo_azul_id = ea.id
      LEFT JOIN equipos er ON p.equipo_rojo_id = er.id
      WHERE 1=1
    `;

    const params = [];

    // --- FILTROS DINÁMICOS ---
    if (filtros.torneoId && filtros.torneoId !== 'todos') {
        query += ' AND p.torneo_id = UUID_TO_BIN(?)';
        params.push(filtros.torneoId);
    }

    if (filtros.fase && filtros.fase !== 'todas') {
        query += ' AND p.fase_torneo = ?';
        params.push(filtros.fase);
    }
    // -------------------------

    query += ' ORDER BY p.fecha_partida DESC';

    const [rows] = await pool.execute(query, params);
    
    return rows.map(row => ({
        ...row,
        id: Buffer.isBuffer(row.id) ? uuid.stringify(row.id) : row.id
    }));
};

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
        p.fecha_partida, p.fase_torneo, p.estado, BIN_TO_UUID(p.ganador_id) as ganador_id,
        p.vod_url
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
 * (AQUÍ ESTABA EL ERROR: Eliminamos p.stream_url)
 */
export async function getPartidaById (partidaId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(p.id) as id,
        p.fecha_partida, p.fase_torneo, BIN_TO_UUID(p.ganador_id) as ganador_id,
        p.estado, 
        p.vod_url,  -- Agregamos vod_url en lugar de stream_url
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
 * Actualizar partida
 * (Eliminamos stream_url y agregamos vod_url a la lista permitida)
 */
export async function updatePartida (partidaId, updates) {
  try {
    const fields = []
    const values = []

    const simpleFields = [
      'fecha_partida', 'fase_torneo', 'estado', 
      'riot_match_id', 'duracion_segundos', 
      'vod_url' // <--- NUEVO CAMPO
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

// ... (getPartidaByRiotMatchId y deletePartida se mantienen igual)
// Si las necesitas completas avísame, pero suelen estar al final del archivo sin cambios.
export async function deletePartida (partidaId) {
  try {
    const [result] = await pool.query('DELETE FROM partidas WHERE id = UUID_TO_BIN(?)', [partidaId])
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deletePartida:', error.message)
    throw error
  }
}

export async function getPartidasBracket (torneoId) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, p.fecha_partida, p.fase_torneo, p.estado, p.posicion_bracket,
        -- Traemos el ID del ganador
        BIN_TO_UUID(p.ganador_id) as ganador_id,
        
        -- IDs de los equipos (usando tus nombres: azul/rojo)
        BIN_TO_UUID(p.equipo_azul_id) as azul_id,
        BIN_TO_UUID(p.equipo_rojo_id) as rojo_id,
        
        -- Datos de los equipos (Join)
        ea.nombre as azul_nombre, ea.logo_url as azul_logo,
        er.nombre as rojo_nombre, er.logo_url as rojo_logo
      FROM partidas p
      LEFT JOIN equipos ea ON p.equipo_azul_id = ea.id
      LEFT JOIN equipos er ON p.equipo_rojo_id = er.id
      WHERE p.torneo_id = UUID_TO_BIN(?)
      -- ORDEN CLAVE: Primero por Fase (en orden de torneo) y luego por su lugar en el bracket
      ORDER BY FIELD(p.fase_torneo, 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'), 
               p.posicion_bracket ASC
    `, [torneoId])

    return rows.map(r => ({
        ...r,
        // Mantengo tu mapeo de ID original
        id: Buffer.isBuffer(r.id) ? uuid.stringify(r.id) : r.id
    }));

  } catch (error) {
    console.error('Error getPartidasBracket:', error.message)
    throw error
  }
}


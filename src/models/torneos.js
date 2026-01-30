// src/models/torneos.js
import pool from '../config/db.js'

/**
 * Obtener todos los torneos (CON CONTEO DE EQUIPOS)
 */
export async function getAllTorneos () {
  try {
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(t.id) as id, 
        t.nombre, 
        t.descripcion, 
        t.fecha_inicio, 
        t.fecha_fin, 
        t.estado, 
        t.activo,
        (SELECT COUNT(*) FROM torneo_equipos te WHERE te.torneo_id = t.id) as equipo_count
      FROM torneos t 
      ORDER BY t.fecha_inicio DESC
    `)
    return rows
  } catch (error) {
    console.error('Error en getAllTorneos:', error.message)
    throw error
  }
}

// ... (El resto de funciones getTorneoById, getTorneoActivo, createTorneo, etc. se mantienen igual) ...
// Copia el resto del archivo original aquí abajo o mantenlo si no lo borraste.
// Solo necesitabas cambiar getAllTorneos.

export async function getTorneoById (torneoId) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre, descripcion, fecha_inicio, fecha_fin, estado, activo FROM torneos WHERE id = UUID_TO_BIN(?)',
      [torneoId]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getTorneoById:', error.message)
    throw error
  }
}

export async function getTorneoActivo () {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre, descripcion, fecha_inicio, fecha_fin, estado, activo FROM torneos WHERE activo = 1 LIMIT 1'
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getTorneoActivo:', error.message)
    throw error
  }
}

export async function createTorneo (nombre, descripcion, fechaInicio, fechaFin, estado = 'Proximo') {
  try {
    const [result] = await pool.query(
      'INSERT INTO torneos (id, nombre, descripcion, fecha_inicio, fecha_fin, estado, activo) VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, ?, ?, 0)',
      [nombre, descripcion, fechaInicio, fechaFin, estado]
    )
    return {
      id: result.insertId,
      nombre,
      descripcion,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado,
      activo: 0
    }
  } catch (error) {
    console.error('Error en createTorneo:', error.message)
    throw error
  }
}

export async function updateTorneo (torneoId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.nombre) {
      fields.push('nombre = ?')
      values.push(updates.nombre)
    }
    if (updates.descripcion) {
      fields.push('descripcion = ?')
      values.push(updates.descripcion)
    }
    if (updates.fecha_inicio) {
      fields.push('fecha_inicio = ?')
      values.push(updates.fecha_inicio)
    }
    if (updates.fecha_fin) {
      fields.push('fecha_fin = ?')
      values.push(updates.fecha_fin)
    }
    if (updates.estado) {
      fields.push('estado = ?')
      values.push(updates.estado)
    }

    if (fields.length === 0) return null

    values.push(torneoId)

    const [result] = await pool.query(
      `UPDATE torneos SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`,
      values
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en updateTorneo:', error.message)
    throw error
  }
}

export async function activarTorneo (torneoId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.query('UPDATE torneos SET activo = 0')
    const [result] = await connection.query(
      'UPDATE torneos SET activo = 1 WHERE id = UUID_TO_BIN(?)',
      [torneoId]
    )
    await connection.commit()
    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    console.error('Error en activarTorneo:', error.message)
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteTorneo (torneoId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM torneos WHERE id = UUID_TO_BIN(?)',
      [torneoId]
    )
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteTorneo:', error.message)
    throw error
  }
}
// ==========================================
// MODELO: Torneos
// ==========================================
import pool from '../config/db.js'

/**
 * Obtener todos los torneos
 */
export async function getAllTorneos () {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre, descripcion, fecha_inicio, fecha_fin, estado, activo FROM torneos ORDER BY fecha_inicio DESC'
    )
    return rows
  } catch (error) {
    console.error('Error en getAllTorneos:', error.message)
    throw error
  }
}

/**
 * Obtener torneo por ID
 */
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

/**
 * Obtener torneo activo
 */
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

/**
 * Crear nuevo torneo
 */
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

/**
 * Actualizar torneo
 */
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

/**
 * Activar torneo (desactiva los demás)
 */
export async function activarTorneo (torneoId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Desactivar todos los torneos
    await connection.query('UPDATE torneos SET activo = 0')

    // Activar el seleccionado
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

/**
 * Eliminar torneo
 */
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

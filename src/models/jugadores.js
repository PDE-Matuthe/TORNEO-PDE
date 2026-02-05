// ==========================================
// MODELO: Jugadores
// ==========================================
import pool from '../config/db.js'

// --- CONSULTAS DE LECTURA ---

export async function getAllJugadores () {
  try {
    const [rows] = await pool.query(`
      SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, j.tipo_rol,
             BIN_TO_UUID(j.equipo_id) as equipo_id, e.nombre as equipo_nombre
      FROM jugadores j
      LEFT JOIN equipos e ON j.equipo_id = e.id
      ORDER BY e.nombre, FIELD(j.tipo_rol, 'COACH', 'STAFF', 'TITULAR', 'SUPLENTE'), j.rol_juego
    `)
    return rows
  } catch (error) {
    console.error('Error en getAllJugadores:', error.message)
    throw error
  }
}

export async function getJugadorById (jugadorId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, j.tipo_rol,
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

// --- ESTA ES LA FUNCIÓN QUE FALTABA PARA QUE FUNCIONE EL CONTROLADOR ---
export async function getJugadorByNombreInvocador (nombre) {
  try {
    const [rows] = await pool.query(
      'SELECT BIN_TO_UUID(id) as id, nombre_invocador FROM jugadores WHERE nombre_invocador = ?',
      [nombre]
    )
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    console.error('Error en getJugadorByNombreInvocador:', error.message)
    throw error
  }
}

// --- GESTIÓN DE ROSTER ---

export async function getJugadoresByEquipo (equipoId) {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(j.id) as id, j.nombre_invocador, j.rol_juego, j.tipo_rol
       FROM jugadores j
       WHERE j.equipo_id = UUID_TO_BIN(?)
       ORDER BY FIELD(j.tipo_rol, 'COACH', 'STAFF', 'TITULAR', 'SUPLENTE'), j.rol_juego`,
      [equipoId]
    )
    return rows
  } catch (error) {
    console.error('Error en getJugadoresByEquipo:', error.message)
    throw error
  }
}

export async function getFreeAgents () {
  try {
    const [rows] = await pool.query(
      `SELECT BIN_TO_UUID(id) as id, nombre_invocador, rol_juego, tipo_rol
       FROM jugadores 
       WHERE equipo_id IS NULL 
       ORDER BY nombre_invocador`
    )
    return rows
  } catch (error) {
    console.error('Error en getFreeAgents:', error.message)
    throw error
  }
}

export async function asignarEquipo (jugadorId, equipoId) {
  try {
    await pool.query(
      'UPDATE jugadores SET equipo_id = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)', 
      [equipoId, jugadorId]
    )
  } catch (error) {
    console.error('Error en asignarEquipo:', error.message)
    throw error
  }
}

export async function liberarJugador (jugadorId) {
  try {
    await pool.query(
      'UPDATE jugadores SET equipo_id = NULL WHERE id = UUID_TO_BIN(?)', 
      [jugadorId]
    )
  } catch (error) {
    console.error('Error en liberarJugador:', error.message)
    throw error
  }
}

// --- CREACIÓN, EDICIÓN Y BORRADO ---

/**
 * CREAR JUGADOR (CORREGIDO)
 * Ahora acepta un OBJETO 'datos' para ser compatible con la creación automática.
 * Esto soluciona el error de "Incorrect string value for uuid_to_bin"
 */
export async function createJugador (datos) {
  try {
    // Si recibimos argumentos sueltos (código viejo), los convertimos a objeto
    // Esto mantiene compatibilidad si alguna otra parte de tu código usa la forma vieja
    if (arguments.length > 1) {
        datos = {
            nombre_invocador: arguments[0],
            rol_juego: arguments[1],
            tipo_rol: arguments[2],
            equipo_id: arguments[3]
        };
    }

    const { nombre_invocador, rol_principal, rol_juego, rango, equipo_id, tipo_rol } = datos;

    // A veces llega como rol_principal, a veces como rol_juego. Normalizamos:
    const rolFinal = rol_principal || rol_juego || 'FILL';

    // Insertamos
    await pool.query(`
      INSERT INTO jugadores (id, nombre_invocador, rol_juego, tipo_rol, equipo_id)
      VALUES (UUID_TO_BIN(UUID()), ?, ?, ?, UUID_TO_BIN(?))
    `, [
      nombre_invocador, 
      rolFinal, // Texto plano (ej: 'JUNGLE') -> Correcto
      tipo_rol || 'SUPLENTE', 
      equipo_id // UUID Binary -> Correcto
    ])

    // Devolvemos el ID recién creado
    const [rows] = await pool.query('SELECT BIN_TO_UUID(id) as id FROM jugadores WHERE nombre_invocador = ?', [nombre_invocador])
    return rows[0]

  } catch (error) {
    console.error('Error en createJugador:', error.message)
    throw error
  }
}

export async function updateJugador (jugadorId, updates) {
  try {
    const fields = []
    const values = []

    if (updates.nombre_invocador !== undefined) {
      fields.push('nombre_invocador = ?')
      values.push(updates.nombre_invocador)
    }

    if (updates.rol_juego !== undefined) {
      fields.push('rol_juego = ?')
      values.push(updates.rol_juego)
    }
    
    if (updates.tipo_rol !== undefined) {
      fields.push('tipo_rol = ?')
      values.push(updates.tipo_rol)
    }

    if (updates.equipo_id !== undefined) {
      const eqId = updates.equipo_id ? updates.equipo_id : null;
      fields.push('equipo_id = UUID_TO_BIN(?)')
      values.push(eqId)
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

export async function deleteJugador (jugadorId) {
  try {
    const [result] = await pool.query('DELETE FROM jugadores WHERE id = UUID_TO_BIN(?)', [jugadorId])
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error en deleteJugador:', error.message)
    throw error
  }
}
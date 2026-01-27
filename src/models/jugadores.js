import pool from './db.js'

// Obtener todos los jugadores de un equipo específico
export const getJugadoresByEquipoId = async (equipoId) => {
  const [rows] = await pool.query(
    `SELECT BIN_TO_UUID(id) as id, nombre_invocador, rol_juego, tipo_rol, rango 
     FROM jugadores 
     WHERE equipo_id = UUID_TO_BIN(?) 
     ORDER BY tipo_rol, field(rol_juego, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')`,
    [equipoId]
  )
  return rows
}

// Agregar un jugador nuevo
export const createJugador = async ({ nombre, rolJuego, tipoRol, rango, equipoId }) => {
  // rolJuego puede ser null si es un Coach
  const rolJuegoVal = rolJuego === '' ? null : rolJuego;
  
  await pool.query(
    `INSERT INTO jugadores (nombre_invocador, rol_juego, tipo_rol, rango, equipo_id) 
     VALUES (?, ?, ?, ?, UUID_TO_BIN(?))`,
    [nombre, rolJuegoVal, tipoRol, rango, equipoId]
  )
}

// Eliminar un jugador
export const deleteJugador = async (jugadorId) => {
  await pool.query('DELETE FROM jugadores WHERE BIN_TO_UUID(id) = ?', [jugadorId])
}
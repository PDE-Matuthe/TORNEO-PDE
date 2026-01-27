import { getJugadoresByEquipoId, createJugador, deleteJugador } from '../models/jugadores.js'
import { getEquipoById } from '../models/equipos.js'

// Mostrar la pantalla de gestión de jugadores de un equipo
export const renderRosterPage = async (req, res) => {
  const { id } = req.params // ID del equipo
  
  // Necesitamos datos del equipo (nombre, logo) y su lista de jugadores
  const equipo = await getEquipoById(id)
  const jugadores = await getJugadoresByEquipoId(id)

  res.render('roster', { 
    title: `Roster de ${equipo.nombre}`, 
    equipo, 
    jugadores 
  })
}

// Procesar el formulario para agregar un jugador
export const addJugadorToEquipo = async (req, res) => {
  const { id } = req.params // ID del equipo
  const { nombre_invocador, rol_juego, tipo_rol, rango } = req.body

  try {
    await createJugador({
      nombre: nombre_invocador,
      rolJuego: rol_juego,
      tipoRol: tipo_rol,
      rango: rango,
      equipoId: id
    })
    res.redirect(`/admin/equipos/${id}/jugadores`) // Recargamos la misma página
  } catch (error) {
    console.error('Error al agregar jugador:', error)
    res.status(500).send('Error al agregar jugador')
  }
}

// Eliminar jugador
export const removeJugador = async (req, res) => {
  const { id, jugadorId } = req.params // ID equipo y ID jugador

  try {
    await deleteJugador(jugadorId)
    res.redirect(`/admin/equipos/${id}/jugadores`)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error eliminando jugador')
  }
}
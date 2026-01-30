// ==========================================
// CONTROLADOR: Jugadores (Admin)
// ==========================================
import * as jugadoresModel from '../models/jugadores.js'
import * as equiposModel from '../models/equipos.js'

/**
 * GET /admin/jugadores - Listar todos los jugadores
 */
export async function getJugadores (req, res) {
  try {
    const jugadores = await jugadoresModel.getAllJugadores()
    const equipos = await equiposModel.getAllEquipos()

    res.render('admin-jugadores', {
      jugadores,
      equipos
    })
  } catch (error) {
    console.error('Error en getJugadores:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar jugadores'
    })
  }
}

/**
 * GET /admin/jugadores/crear - Mostrar formulario para crear jugador
 */
export async function getCreateJugador (req, res) {
  try {
    const equipos = await equiposModel.getAllEquipos()
    
    res.render('admin-jugadores-crear', {
      equipos
    })
  } catch (error) {
    console.error('Error en getCreateJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar formulario de jugadores'
    })
  }
}

/**
 * GET /admin/jugadores/:id/editar - Mostrar formulario para editar jugador
 */
export async function getEditJugador (req, res) {
  try {
    const { id } = req.params
    const jugador = await jugadoresModel.getJugadorById(id)
    
    if (!jugador) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Jugador no encontrado'
      })
    }
    
    const equipos = await equiposModel.getAllEquipos()
    
    res.render('admin-jugadores-editar', {
      jugador,
      equipos
    })
  } catch (error) {
    console.error('Error en getEditJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar formulario de edición'
    })
  }
}

/**
 * POST /admin/jugadores - Crear nuevo jugador
 */
export async function postCreateJugador (req, res) {
  try {
    const { nombre_invocador, rol_juego, equipo_id } = req.body

    if (!nombre_invocador || !rol_juego || !equipo_id) {
      return res.status(400).render('admin-jugadores', {
        error: 'Todos los campos son requeridos'
      })
    }

    await jugadoresModel.createJugador(nombre_invocador, rol_juego, equipo_id)

    console.log(`✅ Jugador creado: ${nombre_invocador}`)
    res.redirect('/admin/jugadores?success=Jugador creado exitosamente')
  } catch (error) {
    console.error('Error en postCreateJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al crear jugador'
    })
  }
}

/**
 * POST /admin/jugadores/:id/update - Actualizar jugador
 */
export async function postUpdateJugador (req, res) {
  try {
    const { id } = req.params
    const { nombre_invocador, rol_juego, equipo_id } = req.body

    const updates = {}
    if (nombre_invocador) updates.nombre_invocador = nombre_invocador
    if (rol_juego) updates.rol_juego = rol_juego
    if (equipo_id) updates.equipo_id = equipo_id

    await jugadoresModel.updateJugador(id, updates)

    console.log(`✅ Jugador actualizado: ${id}`)
    res.redirect('/admin/jugadores?success=Jugador actualizado exitosamente')
  } catch (error) {
    console.error('Error en postUpdateJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al actualizar jugador'
    })
  }
}

/**
 * POST /admin/jugadores/:id/delete - Eliminar jugador
 */
export async function postDeleteJugador (req, res) {
  try {
    const { id } = req.params

    await jugadoresModel.deleteJugador(id)

    console.log(`✅ Jugador eliminado: ${id}`)
    res.redirect('/admin/jugadores?success=Jugador eliminado exitosamente')
  } catch (error) {
    console.error('Error en postDeleteJugador:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al eliminar jugador'
    })
  }
}
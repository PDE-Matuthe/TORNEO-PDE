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
    let { nombre_invocador, rol_juego, tipo_rol, equipo_id } = req.body

    // LÓGICA COACH: Si es Coach o Staff, el rol de juego (posición) es NULL
    if (tipo_rol === 'COACH' || tipo_rol === 'STAFF') {
        rol_juego = null;
    }

    // VALIDACIÓN:
    // 1. Nombre y Tipo siempre obligatorios.
    // 2. Rol de juego (posición) obligatorio SOLO si es TITULAR o SUPLENTE.
    const necesitaPosicion = (tipo_rol === 'TITULAR' || tipo_rol === 'SUPLENTE');
    
    if (!nombre_invocador || !tipo_rol || (necesitaPosicion && !rol_juego)) {
        const equipos = await equiposModel.getAllEquipos()
        return res.status(400).render('admin-jugadores-crear', {
            error: 'Faltan datos obligatorios (Nombre, Estado o Posición).',
            equipos
        })
    }

    await jugadoresModel.createJugador(nombre_invocador, rol_juego, tipo_rol, equipo_id)

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
    let { nombre_invocador, rol_juego, tipo_rol, equipo_id } = req.body

    // LÓGICA COACH: Forzar null si es staff
    if (tipo_rol === 'COACH' || tipo_rol === 'STAFF') {
        rol_juego = null;
    }

    const updates = {}
    if (nombre_invocador) updates.nombre_invocador = nombre_invocador
    
    // Si rol_juego es null (porque es coach), lo mandamos como null explícitamente
    // Si tiene valor, lo mandamos.
    if (rol_juego !== undefined) updates.rol_juego = rol_juego
    
    if (tipo_rol) updates.tipo_rol = tipo_rol
    if (equipo_id !== undefined) updates.equipo_id = equipo_id

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
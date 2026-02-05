// ==========================================
// CONTROLADOR: Equipos (Admin)
// ==========================================
import * as equiposModel from '../models/equipos.js'
import * as jugadoresModel from '../models/jugadores.js'

/**
 * GET /admin/equipos - Listar todos los equipos
 */
export async function getEquipos (req, res) {
  try {
    const equipos = await equiposModel.getAllEquipos()

    res.render('admin-equipos', {
      equipos
    })
  } catch (error) {
    console.error('Error en getEquipos:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar equipos'
    })
  }
}

/**
 * GET /admin/equipos/crear - Mostrar formulario para crear equipo
 */
export async function getCreateEquipo (req, res) {
  try {
    res.render('admin-equipos-crear')
  } catch (error) {
    console.error('Error en getCreateEquipo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar formulario de equipos'
    })
  }
}

/**
 * POST /admin/equipos - Crear nuevo equipo
 */
export async function postCreateEquipo (req, res) {
  try {
    const { nombre, siglas, logo_url } = req.body

    if (!nombre || !siglas) {
      return res.status(400).render('admin-equipos', {
        error: 'Nombre y siglas son requeridos'
      })
    }

    await equiposModel.createEquipo(nombre, siglas, logo_url || null)

    console.log(`✅ Equipo creado: ${nombre}`)
    res.redirect('/admin/equipos?success=Equipo creado exitosamente')
  } catch (error) {
    console.error('Error en postCreateEquipo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al crear equipo'
    })
  }
}

/**
 * POST /admin/equipos/:id/update - Actualizar equipo
 */
export async function postUpdateEquipo (req, res) {
  try {
    const { id } = req.params
    const { nombre, siglas, logo_url } = req.body

    const updates = {}
    if (nombre) updates.nombre = nombre
    if (siglas) updates.siglas = siglas
    if (logo_url) updates.logo_url = logo_url

    await equiposModel.updateEquipo(id, updates)

    console.log(`✅ Equipo actualizado: ${id}`)
    res.redirect('/admin/equipos?success=Equipo actualizado exitosamente')
  } catch (error) {
    console.error('Error en postUpdateEquipo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al actualizar equipo'
    })
  }
}

/**
 * POST /admin/equipos/:id/delete - Eliminar equipo
 */
export async function postDeleteEquipo (req, res) {
  try {
    const { id } = req.params

    await equiposModel.deleteEquipo(id)

    console.log(`✅ Equipo eliminado: ${id}`)
    res.redirect('/admin/equipos?success=Equipo eliminado exitosamente')
  } catch (error) {
    console.error('Error en postDeleteEquipo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al eliminar equipo'
    })
  }
}

// GET EDITAR (Actualizado con Roster)
export async function getEditEquipo (req, res) {
  try {
    const { id } = req.params
    // Capturamos mensajes de la URL (ej: ?success=Jugador liberado)
    const { success, error } = req.query 

    const equipo = await equiposModel.getEquipoById(id)
    
    if (!equipo) {
      return res.status(404).render('error', { codigo: 404, mensaje: 'Equipo no encontrado' })
    }

    const roster = await jugadoresModel.getJugadoresByEquipo(id)
    const freeAgents = await jugadoresModel.getFreeAgents()
    
    res.render('admin-equipos-editar', {
      equipo,
      roster,
      freeAgents,
      messages: { success, error } // <--- ¡ESTO FALTABA!
    })
  } catch (err) {
    console.error('Error en getEditEquipo:', err.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar edición' })
  }
}
// POST: AGREGAR JUGADOR AL ROSTER
export async function postAddPlayerToTeam (req, res) {
  try {
    const { id } = req.params // ID del Equipo
    const { jugadorId } = req.body

    await jugadoresModel.asignarEquipo(jugadorId, id)
    
    res.redirect(`/admin/equipos/${id}/editar?success=Jugador fichado`)
  } catch (error) {
    console.error('Error:', error)
    res.redirect(`/admin/equipos/${req.params.id}/editar?error=Error al fichar`)
  }
}

// POST: QUITAR JUGADOR (Liberar)
export async function postRemovePlayerFromTeam (req, res) {
  try {
    const { id } = req.params 
    const { jugadorId } = req.body

    // --- AGREGA ESTAS 2 LÍNEAS ---
    console.log('🔵 INTENTO DE LIBERAR JUGADOR');
    console.log('👉 ID Recibido:', jugadorId);
    // -----------------------------

    await jugadoresModel.liberarJugador(jugadorId)
    
    res.redirect(`/admin/equipos/${id}/editar?success=Jugador liberado`)
  } catch (error) {
    console.error('Error:', error)
    res.redirect(`/admin/equipos/${req.params.id}/editar?error=Error al liberar`)
  }
}

// API: Obtener equipos por torneo (Devuelve JSON)
export async function getEquiposTorneoJSON (req, res) {
  try {
    const { id } = req.params
    const equipos = await equiposModel.getEquiposByTorneo(id)
    res.json(equipos)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos' })
  }
}
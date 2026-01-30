// ==========================================
// CONTROLADOR: Torneos (Admin)
// ==========================================
import * as torneosModel from '../models/torneos.js'
import * as equiposModel from '../models/equipos.js'

/**
 * GET /admin/torneos - Listar todos los torneos
 */
export async function getTorneos (req, res) {
  try {
    const torneos = await torneosModel.getAllTorneos()
    const equiposDisponibles = await equiposModel.getAllEquipos()
    
    res.render('admin-torneos', {
      torneos,
      equiposDisponibles
    })
  } catch (error) {
    console.error('Error en getTorneos:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar torneos'
    })
  }
}

/**
 * GET /admin/torneos/crear - Mostrar formulario para crear torneo
 */
export async function getCreateTorneo (req, res) {
  try {
    const equipos = await equiposModel.getAllEquipos()
    
    res.render('admin-torneos-crear', {
      equipos
    })
  } catch (error) {
    console.error('Error en getCreateTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar formulario de torneos'
    })
  }
}

/**
 * GET /admin/torneos/:id/editar - Mostrar formulario para editar torneo
 */
export async function getEditTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    if (!torneo) {
      return res.status(404).render('error', {
        codigo: 404,
        mensaje: 'Torneo no encontrado'
      })
    }
    
    const equipos = await equiposModel.getAllEquipos()
    
    res.render('admin-torneos-editar', {
      torneo,
      equipos
    })
  } catch (error) {
    console.error('Error en getEditTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al cargar formulario de edición'
    })
  }
}

/**
 * POST /admin/torneos - Crear nuevo torneo
 */
export async function postCreateTorneo (req, res) {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, equipos_ids } = req.body

    // Validaciones
    if (!nombre) {
      return res.status(400).render('admin-torneos', {
        error: 'El nombre del torneo es requerido'
      })
    }

    // Crear torneo
    const newTorneo = await torneosModel.createTorneo(
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado
    )

    // Agregar equipos al torneo si se proporcionaron
    if (equipos_ids && Array.isArray(equipos_ids)) {
      for (const equipoId of equipos_ids) {
        await equiposModel.addEquipoToTorneo(newTorneo.id, equipoId)
      }
    }

    console.log(`✅ Torneo creado: ${nombre}`)
    res.redirect('/admin/torneos?success=Torneo creado exitosamente')
  } catch (error) {
    console.error('Error en postCreateTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al crear torneo'
    })
  }
}

/**
 * POST /admin/torneos/:id/update - Actualizar torneo
 */
export async function postUpdateTorneo (req, res) {
  try {
    const { id } = req.params
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body

    const updates = {}
    if (nombre) updates.nombre = nombre
    if (descripcion) updates.descripcion = descripcion
    if (fecha_inicio) updates.fecha_inicio = fecha_inicio
    if (fecha_fin) updates.fecha_fin = fecha_fin
    if (estado) updates.estado = estado

    await torneosModel.updateTorneo(id, updates)

    console.log(`✅ Torneo actualizado: ${id}`)
    res.redirect('/admin/torneos?success=Torneo actualizado exitosamente')
  } catch (error) {
    console.error('Error en postUpdateTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al actualizar torneo'
    })
  }
}

/**
 * POST /admin/torneos/:id/activate - Activar torneo
 */
export async function postActivateTorneo (req, res) {
  try {
    const { id } = req.params

    await torneosModel.activarTorneo(id)

    console.log(`✅ Torneo activado: ${id}`)
    res.redirect('/admin/torneos?success=Torneo activado exitosamente')
  } catch (error) {
    console.error('Error en postActivateTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al activar torneo'
    })
  }
}

/**
 * POST /admin/torneos/:id/delete - Eliminar torneo
 */
export async function postDeleteTorneo (req, res) {
  try {
    const { id } = req.params

    await torneosModel.deleteTorneo(id)

    console.log(`✅ Torneo eliminado: ${id}`)
    res.redirect('/admin/torneos?success=Torneo eliminado exitosamente')
  } catch (error) {
    console.error('Error en postDeleteTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al eliminar torneo'
    })
  }
}

/**
 * POST /admin/torneos/:id/add-equipo - Agregar equipo a torneo
 */
export async function postAddEquipoToTorneo (req, res) {
  try {
    const { torneoId, equipoId } = req.body

    await equiposModel.addEquipoToTorneo(torneoId, equipoId)

    console.log(`✅ Equipo agregado al torneo: ${equipoId}`)
    res.redirect(`/admin/torneos/${torneoId}?success=Equipo agregado exitosamente`)
  } catch (error) {
    console.error('Error en postAddEquipoToTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al agregar equipo'
    })
  }
}

/**
 * POST /admin/torneos/:id/remove-equipo - Remover equipo de torneo
 */
export async function postRemoveEquipoFromTorneo (req, res) {
  try {
    const { torneoId, equipoId } = req.body

    await equiposModel.removeEquipoFromTorneo(torneoId, equipoId)

    console.log(`✅ Equipo removido del torneo: ${equipoId}`)
    res.redirect(`/admin/torneos/${torneoId}?success=Equipo removido exitosamente`)
  } catch (error) {
    console.error('Error en postRemoveEquipoFromTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al remover equipo'
    })
  }
}

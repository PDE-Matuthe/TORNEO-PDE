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
    
    // Ya no cargamos equipos aquí, solo torneos. ¡Más rápido!
    res.render('admin-torneos', {
      torneos
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
    // Ya no pedimos equipos aquí para limpiar el formulario
    res.render('admin-torneos-crear')
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
 * CAMBIO IMPORTANTE: Ahora carga inscritos VS disponibles para el panel dual.
 */
export async function getEditTorneo (req, res) {
  try {
    const { id } = req.params
    const torneo = await torneosModel.getTorneoById(id)
    
    // 1. Obtener todos los equipos del sistema
    const allEquipos = await equiposModel.getAllEquipos()
    
    // 2. Obtener los que ya están en este torneo
    const equiposInscritos = await equiposModel.getEquiposByTorneo(id)

    // 3. Filtrar: Disponibles = Todos - Inscritos
    // Usamos un Set de IDs para filtrar rápido
    const inscritosIds = new Set(equiposInscritos.map(e => e.id))
    const equiposDisponibles = allEquipos.filter(e => !inscritosIds.has(e.id))

    res.render('admin-torneos-editar', {
      torneo,
      equiposInscritos,
      equiposDisponibles
    })
  } catch (error) {
    console.error('Error en getEditTorneo:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar edición' })
  }
}

/**
 * POST /admin/torneos - Crear nuevo torneo
 */
export async function postCreateTorneo (req, res) {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body

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

    console.log(`✅ Torneo creado: ${nombre}`)
    // Redirigimos a EDITAR para que ahí agreguen los equipos tranquilamente
    res.redirect(`/admin/torneos/${newTorneo.id}/editar?success=Torneo creado, ahora agrega equipos`)
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
    res.redirect(`/admin/torneos/${id}/editar?success=Guardado correctamente`)
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
 * CAMBIO IMPORTANTE: Redirige a /editar y soporta varios equipos a la vez.
 */
export async function postAddEquipoToTorneo (req, res) {
  try {
    const { id } = req.params; 
    // Puede venir 'equipoId' (un input hidden simple) o 'equiposIds' (varios checkboxes)
    // Usamos coalescencia para atrapar cualquiera de los dos.
    let equiposParaAgregar = req.body.equiposIds || req.body.equipoId;

    if (!equiposParaAgregar) {
      return res.redirect(`/admin/torneos/${id}/editar?error=Debes seleccionar un equipo`);
    }

    // Convertir a array si es un solo string
    if (!Array.isArray(equiposParaAgregar)) {
      equiposParaAgregar = [equiposParaAgregar];
    }

    // Insertar uno por uno
    for (const eqId of equiposParaAgregar) {
      try {
        await equiposModel.addEquipoToTorneo(id, eqId);
      } catch (err) {
        console.log(`Equipo ${eqId} ya estaba en torneo ${id}, saltando.`);
      }
    }

    console.log(`✅ ${equiposParaAgregar.length} equipos agregados al torneo: ${id}`);
    
    // REDIRECCIÓN CORRECTA: Vuelve a la página de edición
    res.redirect(`/admin/torneos/${id}/editar?success=Equipos inscritos correctamente`);
    
  } catch (error) {
    console.error('Error en postAddEquipoToTorneo:', error.message);
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al inscribir equipos' });
  }
}

/**
 * POST /admin/torneos/:id/remove-equipo - Remover equipo de torneo
 * CAMBIO IMPORTANTE: Redirige a /editar en lugar de una página inexistente.
 */
export async function postRemoveEquipoFromTorneo (req, res) {
  try {
    // Tomamos el ID del torneo de la URL (:id)
    const { id } = req.params; 
    const { equipoId } = req.body;

    await equiposModel.removeEquipoFromTorneo(id, equipoId)

    console.log(`✅ Equipo ${equipoId} removido del torneo ${id}`)
    
    // REDIRECCIÓN CORRECTA: Vuelve a la página de edición
    res.redirect(`/admin/torneos/${id}/editar?success=Equipo removido exitosamente`)
    
  } catch (error) {
    console.error('Error en postRemoveEquipoFromTorneo:', error.message)
    res.status(500).render('error', {
      codigo: 500,
      mensaje: 'Error al remover equipo'
    })
  }
}
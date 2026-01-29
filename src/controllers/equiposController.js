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
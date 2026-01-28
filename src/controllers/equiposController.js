import { getEquiposByUsuarioId, createEquipo, deleteEquipo, getEquipoById, updateEquipo } from '../models/equipos.js'
import { getJugadoresByEquipoId } from '../models/jugadores.js'
import pool from '../models/db.js'

// Mostrar la lista de equipos (Panel de control del Admin)
export const renderEquiposPage = async (req, res) => {
  const usuarioId = req.session.usuarioId
  // Obtenemos los equipos de este administrador
  const equipos = await getEquiposByUsuarioId(usuarioId)
  
  // Renderizamos la vista 'equipos.ejs' (que crearemos en el siguiente paso)
  res.render('equipos', { title: 'Gestión de Equipos', equipos })
}

// Mostrar el formulario para crear un nuevo equipo
export const renderCrearEquipo = (req, res) => {
  res.render('crear', { title: 'Registrar Nuevo Equipo' })
}

// Procesar el formulario de creación
export const registerEquipo = async (req, res) => {
  const usuarioId = req.session.usuarioId
  const { nombre, region, logoUrl } = req.body

  try {
    // Guardamos el nuevo equipo en la BD
    await createEquipo(usuarioId, nombre, region, logoUrl)
    res.redirect('/admin/equipos')
  } catch (error) {
    console.error('Error al registrar equipo:', error.message)
    res.status(500).send('Error interno del servidor.')
  }
}

// Eliminar un equipo
export const deleteEquipoById = async (req, res) => {
  const { id } = req.params

  try {
    await deleteEquipo(id)
    res.redirect('/admin/equipos')
  } catch (error) {
    console.error('Error al eliminar equipo:', error.message)
    res.status(500).send('Error eliminando el equipo.')
  }
}

// Mostrar formulario de edición
export const renderEditarEquipo = async (req, res) => {
  const { id } = req.params
  const equipo = await getEquipoById(id)
  res.render('editar', { title: 'Editar Equipo', equipo })
}

// Procesar la edición
export const updateEquipoById = async (req, res) => {
  const { id } = req.params
  const { nombre, region, logoUrl } = req.body

  try {
    await updateEquipo(id, nombre, region, logoUrl)
    res.redirect('/admin/equipos')
  } catch (error) {
    console.error('Error al actualizar equipo:', error.message)
    res.status(500).send('Error actualizando el equipo.')
  }
}

// --- FUNCIONES PÚBLICAS (Sin autenticación) ---

// Mostrar la lista de equipos (Página pública)
export const renderEquiposPagePublic = async (req, res) => {
  try {
    // Obtenemos TODOS los equipos (no filtrados por usuario)
    const [equipos] = await pool.query('SELECT BIN_TO_UUID(id) as id, nombre, region, logo_url, verificado FROM equipos')
    res.render('equipos-public', { title: 'Equipos', equipos, isPublic: true })
  } catch (error) {
    console.error('Error al obtener equipos:', error.message)
    res.status(500).send('Error al cargar los equipos.')
  }
}

// Mostrar el roster de un equipo (Página pública)
export const renderRosterPagePublic = async (req, res) => {
  const { id } = req.params
  
  try {
    const equipo = await getEquipoById(id)
    const jugadores = await getJugadoresByEquipoId(id)

    res.render('roster-public', { 
      title: `Roster de ${equipo.nombre}`, 
      equipo, 
      jugadores,
      isPublic: true 
    })
  } catch (error) {
    console.error('Error al obtener roster:', error.message)
    res.status(500).send('Error al cargar el roster.')
  }
}
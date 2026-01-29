// ==========================================
// CONTROLADOR: Autenticación
// ==========================================
import bcrypt from 'bcrypt'
import * as usersModel from '../models/users.js'

/**
 * GET /login - Mostrar formulario de login
 */
export async function getLogin (req, res) {
  try {
    if (req.session.usuarioId) {
      return res.redirect(req.session.isAdmin ? '/admin' : '/home')
    }
    res.render('login')
  } catch (error) {
    console.error('Error en getLogin:', error.message)
    res.status(500).render('error', { codigo: 500, mensaje: 'Error al cargar la página de login' })
  }
}

/**
 * POST /login - Procesar login
 */
export async function postLogin (req, res) {
  try {
    const { email, password } = req.body

    // Validar campos
    if (!email || !password) {
      return res.status(400).render('login', {
        error: 'Email y contraseña requeridos'
      })
    }

    // Buscar usuario
    const user = await usersModel.findByEmail(email)
    if (!user) {
      return res.status(401).render('login', {
        error: 'Email o contraseña incorrectos'
      })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.contrasena)
    if (!passwordMatch) {
      return res.status(401).render('login', {
        error: 'Email o contraseña incorrectos'
      })
    }

    // Verificar si es admin
    if (!user.isAdmin) {
      return res.status(403).render('login', {
        error: 'Solo administradores pueden acceder'
      })
    }

    // Crear sesión
    req.session.usuarioId = user.id
    req.session.mail = user.mail
    req.session.nombre = user.nombre_completo
    req.session.isAdmin = user.isAdmin === 1

    console.log(`✅ Usuario ${user.mail} ha iniciado sesión`)
    res.redirect('/admin')
  } catch (error) {
    console.error('Error en postLogin:', error.message)
    res.status(500).render('login', {
      error: 'Error al procesar el login'
    })
  }
}

/**
 * GET /logout - Cerrar sesión
 */
export async function getLogout (req, res) {
  try {
    const email = req.session.mail
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err.message)
        return res.status(500).send('Error al cerrar sesión')
      }
      console.log(`✅ Usuario ${email} ha cerrado sesión`)
      res.redirect('/')
    })
  } catch (error) {
    console.error('Error en getLogout:', error.message)
    res.status(500).send('Error al cerrar sesión')
  }
}

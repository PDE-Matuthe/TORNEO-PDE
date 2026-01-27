import bcrypt from 'bcrypt'
import { findUserByEmail, isUserAdmin } from '../models/users.js'

export const renderLoginPage = (req, res) => {
  const error = req.session.error || null
  req.session.error = null
  res.render('login', { title: 'Login', error })
}

export const handleLogin = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await findUserByEmail(email)
    if (!user) {
      req.session.error = 'Credenciales inválidas.'
      return res.redirect('/login')
    }

    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      req.session.error = 'Acceso denegado. Solo administradores pueden iniciar sesión.'
      return res.redirect('/login')
    }

    const match = await bcrypt.compare(password, user.contrasena)
    if (!match) {
      req.session.error = 'Credenciales inválidas.'
      return res.redirect('/login')
    }

    req.session.usuarioId = user.id
    req.session.isAdmin = true
    const redirectTo = req.session.redirectTo || '/admin'
    delete req.session.redirectTo
    res.redirect(redirectTo)
  } catch (error) {
    console.error('Error durante el inicio de sesión:', error.message)
    req.session.error = 'Error interno del servidor.'
    res.redirect('/login')
  }
}

export const handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error cerrando la sesión:', err.message)
      return res.status(500).send('Error cerrando la sesión.')
    }
    res.redirect('/')
  })
}

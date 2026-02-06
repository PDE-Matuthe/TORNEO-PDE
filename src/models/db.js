import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Crear pool de conexiones
// NOTA: Usamos las variables MYSQL... que son las que Railway usa por defecto
const pool = mysql.createPool({
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'torneodb',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  waitForConnections: true,
  enableKeepAlive: true
  // Se eliminó keepAliveInitialDelayMs porque causaba advertencias en tu versión
})

// Probar la conexión al inicio
;(async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conexión exitosa a la base de datos MySQL')
    // Mostramos el host para verificar que no esté usando localhost en producción
    console.log(`📡 Conectado a: ${process.env.MYSQLHOST || process.env.DB_HOST || 'localhost'}`)
    console.log(`📊 Database: ${process.env.MYSQLDATABASE || process.env.DB_NAME}`)
    connection.release()
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message)
    // No matamos el proceso (process.exit) para que Railway intente reconectar si fue un fallo momentáneo
  }
})()

export default pool
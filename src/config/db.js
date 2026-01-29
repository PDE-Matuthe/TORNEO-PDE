import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Crear pool de conexiones con variables de entorno
const pool = mysql.createPool({
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  port: parseInt(process.env.DB_PORT || '3306'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'torneodb',
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
})

// Probar la conexión al inicio
;(async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conexión exitosa a la base de datos MySQL')
    console.log(`📊 Database: ${process.env.DB_NAME}`)
    connection.release()
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message)
    process.exit(1)
  }
})()

export default pool

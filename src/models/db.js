import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// Crear pool de conexiones
// NOTA: Usamos las variables MYSQL... que son las que Railway usa por defecto
const pool = mysql.createPool({
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD | '',
  host: process.env.MYSQLHOST || 'localhost',
  database: process.env.MYSQLDATABASE || 'torneodb',
  port: parseInt(process.env.MYSQLPORT|| '3306')
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
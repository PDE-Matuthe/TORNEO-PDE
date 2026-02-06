import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar las variables del archivo .env (solo funcionará en local)
dotenv.config()

// Configurar pool de conexiones dinámico
const pool = mysql.createPool({
  connectionLimit: 10,
  // La lógica es: ¿Existe la variable en Railway? Úsala. ¿No? Usa la local.
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'torneodb',
  port: process.env.MYSQLPORT || 3306
});

// Probar la conexión (Esto ayuda a ver qué está pasando en la consola)
(async () => {
  try {
    const connection = await pool.getConnection()
    console.log(`✅ Conectado exitosamente a la BD en: ${process.env.MYSQLHOST || 'localhost'}`)
    connection.release()
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message)
  }
})()

export default pool
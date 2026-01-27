import mysql from 'mysql2/promise'

// Configurar pool de conexiones
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'torneodb'
});

// Probar la conexión
(async () => {
  try {
    const connection = await pool.getConnection()
    console.log('Conexión exitosa a la base de datos MySQL')
    connection.release() // Libera la conexión
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err.message)
  }
})()

export default pool

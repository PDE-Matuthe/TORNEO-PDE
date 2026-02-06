import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  port: parseInt(process.env.DB_PORT || '3306'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'torneodb',
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
})

async function checkEstructura() {
  try {
    const connection = await pool.getConnection()
    
    console.log('\n========== 1. TRIGGERS EN TORNEODB ==========')
    try {
      const [triggers] = await connection.query('SHOW TRIGGERS FROM torneodb')
      console.log(JSON.stringify(triggers, null, 2))
    } catch (e) {
      console.log('Error consultando triggers:', e.message)
    }
    
    console.log('\n========== 2. DESCRIBE TABLA ESTADISTICAS ==========')
    try {
      const [describe] = await connection.query('DESCRIBE torneodb.estadisticas')
      console.log(describe.map(row => ({
        Field: row.Field,
        Type: row.Type,
        Null: row.Null,
        Key: row.Key,
        Default: row.Default,
        Extra: row.Extra
      })))
    } catch (e) {
      console.log('Error consultando estructura:', e.message)
    }
    
    console.log('\n========== 3. CREATE TABLE STATEMENT ==========')
    try {
      const [createTable] = await connection.query('SHOW CREATE TABLE torneodb.estadisticas')
      console.log(createTable[0]['Create Table'])
    } catch (e) {
      console.log('Error consultando CREATE TABLE:', e.message)
    }
    
    console.log('\n========== 4. CHECK CONSTRAINTS ==========')
    try {
      const [constraints] = await connection.query(`
        SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = 'torneodb' AND TABLE_NAME = 'estadisticas'
      `)
      console.log(JSON.stringify(constraints, null, 2))
    } catch (e) {
      console.log('Error consultando CHECK constraints:', e.message)
    }
    
    console.log('\n========== 5. TABLE CONSTRAINTS ==========')
    try {
      const [tableConstraints] = await connection.query(`
        SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = 'torneodb' AND TABLE_NAME = 'estadisticas'
      `)
      console.log(JSON.stringify(tableConstraints, null, 2))
    } catch (e) {
      console.log('Error consultando TABLE_CONSTRAINTS:', e.message)
    }
    
    connection.release()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkEstructura()

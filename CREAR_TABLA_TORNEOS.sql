-- Usar la base de datos que corresponda
-- USE tu_base_de_datos;

-- Tabla para almacenar la información de cada torneo
CREATE TABLE IF NOT EXISTS torneos (
    torneo_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    -- Posibles valores: 'Proximo', 'En Curso', 'Finalizado'
    estado VARCHAR(50) NOT NULL DEFAULT 'Proximo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Opcional) Insertar un torneo de ejemplo para empezar a probar
-- INSERT INTO torneos (nombre, descripcion, fecha_inicio, estado) VALUES 
-- ('Torneo de Apertura 2024', 'Primer torneo de la temporada, con 16 equipos.', '2024-03-01', 'Finalizado');

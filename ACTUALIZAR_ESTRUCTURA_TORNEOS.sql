-- Usar la base de datos que corresponda
-- USE tu_base_de_datos;

-- 1. Tabla de unión para registrar los equipos que participan en cada torneo (relación Muchos a Muchos)
CREATE TABLE IF NOT EXISTS torneo_equipos (
    torneo_id INT NOT NULL,
    equipo_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (torneo_id, equipo_id),
    
    -- Suponiendo que la tabla de equipos se llama 'equipos' y su clave primaria es 'equipo_id'
    FOREIGN KEY (torneo_id) REFERENCES torneos(torneo_id) ON DELETE CASCADE,
    FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. Modificar la tabla de partidas para asociarla a un torneo
-- Hacemos la columna NULL temporalmente para poder añadirla a tablas con datos existentes.
-- Lo ideal es que después se asigne un torneo a las partidas viejas y se ponga NOT NULL.
ALTER TABLE partidas
ADD COLUMN torneo_id INT NULL AFTER partida_id,
ADD CONSTRAINT fk_partida_torneo
FOREIGN KEY (torneo_id) REFERENCES torneos(torneo_id) ON DELETE SET NULL;

-- NOTA:
-- ON DELETE CASCADE en torneo_equipos significa que si borras un torneo, se borran los registros de equipos de ese torneo.
-- ON DELETE SET NULL en partidas significa que si borras un torneo, el 'torneo_id' de sus partidas se pondrá a NULL. 
-- Esto evita perder el historial de partidas si un torneo se elimina por error. Se puede ajustar a ON DELETE CASCADE si prefieres borrar todo en cadena.

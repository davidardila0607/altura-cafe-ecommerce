-- Crear tabla especialidades si no existe
CREATE TABLE IF NOT EXISTS especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL DEFAULT ''
);

-- Crear tabla cafes si no existe
CREATE TABLE IF NOT EXISTS cafes (
    id SERIAL PRIMARY KEY,
    especialidad_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    origen VARCHAR(120) NOT NULL DEFAULT '',
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    precio DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    CONSTRAINT fk_cafes_especialidades FOREIGN KEY (especialidad_id)
        REFERENCES especialidades(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Upsert para especialidades (ON CONFLICT DO UPDATE)
INSERT INTO especialidades (nombre, descripcion) VALUES
    ('Premium', 'Cafés de calidad superior'),
    ('Especial', 'Cafés de origen seleccionado'),
    ('Orgánico', 'Cafés cultivados de forma responsable')
ON CONFLICT (nombre) DO UPDATE
    SET descripcion = EXCLUDED.descripcion;

-- Inserciones en cafes (asegúrate de que las especialidades con id 1 y 2 existan)
INSERT INTO cafes (especialidad_id, nombre, origen, stock, precio) VALUES
    (1, 'Café Castillo', 'Colombia', 25, 10.07),
    (2, 'Café Pergamino', 'Colombia', 10, 20.08);
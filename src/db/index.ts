import Database from 'better-sqlite3';

export const db = new Database('centenario.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS colecciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      imagen TEXT,
      codigo_acceso TEXT,
      activa BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      imagen TEXT,
      coleccion_id INTEGER,
      FOREIGN KEY (coleccion_id) REFERENCES colecciones(id)
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      categoria_id INTEGER,
      imagen TEXT,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS disenos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      codigo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS precios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      descripcion TEXT,
      talla TEXT,
      precio REAL,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    CREATE TABLE IF NOT EXISTS producto_disenos (
      producto_id INTEGER,
      diseno_id INTEGER,
      imagen TEXT,
      PRIMARY KEY (producto_id, diseno_id),
      FOREIGN KEY (producto_id) REFERENCES productos(id),
      FOREIGN KEY (diseno_id) REFERENCES disenos(id)
    );
  `);
  
  try {
    db.exec('ALTER TABLE categorias ADD COLUMN coleccion_id INTEGER REFERENCES colecciones(id)');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec('ALTER TABLE producto_disenos ADD COLUMN imagen TEXT');
  } catch (e) {
    // Column might already exist
  }
}

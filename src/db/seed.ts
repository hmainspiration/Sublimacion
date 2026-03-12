import { db } from './index';

export function seedDb() {
  const count = db.prepare('SELECT COUNT(*) as count FROM categorias').get() as { count: number };
  if (count.count > 0) {
    // Ensure colecciones exist for existing data
    const colCount = db.prepare('SELECT COUNT(*) as count FROM colecciones').get() as { count: number };
    if (colCount.count === 0) {
      const insertColeccion = db.prepare('INSERT INTO colecciones (nombre, descripcion, imagen, codigo_acceso, activa) VALUES (?, ?, ?, ?, ?)');
      const colCentenario = insertColeccion.run('Colección Centenario', 'Productos exclusivos del centenario', 'https://picsum.photos/seed/centenario/800/400', null, 1).lastInsertRowid;
      db.prepare('UPDATE categorias SET coleccion_id = ?').run(colCentenario);
    }
    return; // Already seeded
  }

  console.log('Seeding database...');

  const insertColeccion = db.prepare('INSERT INTO colecciones (nombre, descripcion, imagen, codigo_acceso, activa) VALUES (?, ?, ?, ?, ?)');
  const colCentenario = insertColeccion.run('Colección Centenario', 'Productos exclusivos del centenario', 'https://picsum.photos/seed/centenario/800/400', null, 1).lastInsertRowid;

  const insertCategoria = db.prepare('INSERT INTO categorias (nombre, imagen, coleccion_id) VALUES (?, ?, ?)');
  const insertProducto = db.prepare('INSERT INTO productos (nombre, descripcion, categoria_id, imagen) VALUES (?, ?, ?, ?)');
  const insertDiseno = db.prepare('INSERT INTO disenos (nombre, codigo) VALUES (?, ?)');
  const insertPrecio = db.prepare('INSERT INTO precios (producto_id, descripcion, talla, precio) VALUES (?, ?, ?, ?)');
  const insertProductoDiseno = db.prepare('INSERT INTO producto_disenos (producto_id, diseno_id) VALUES (?, ?)');

  // Categorias
  const catCamisas = insertCategoria.run('Camisas sublimadas', 'https://picsum.photos/seed/camisas/400/300', colCentenario).lastInsertRowid;
  const catTazas = insertCategoria.run('Tazas sublimadas 11oz', 'https://picsum.photos/seed/tazas/400/300', colCentenario).lastInsertRowid;
  const catTermos500 = insertCategoria.run('Termos de acero 500ml', 'https://picsum.photos/seed/termos500/400/300', colCentenario).lastInsertRowid;
  const catTermos600 = insertCategoria.run('Termos de aluminio 600ml', 'https://picsum.photos/seed/termos600/400/300', colCentenario).lastInsertRowid;
  const catLlaveros = insertCategoria.run('Llaveros', 'https://picsum.photos/seed/llaveros/400/300', colCentenario).lastInsertRowid;
  const catGorras = insertCategoria.run('Gorras', 'https://picsum.photos/seed/gorras/400/300', colCentenario).lastInsertRowid;
  const catLaminas = insertCategoria.run('Láminas de aluminio 21x29', 'https://picsum.photos/seed/laminas/400/300', colCentenario).lastInsertRowid;
  const catPapel = insertCategoria.run('Papel fotográfico', 'https://picsum.photos/seed/papel/400/300', colCentenario).lastInsertRowid;

  // Diseños
  const disArbol = insertDiseno.run('Diseño Árbol', '1A').lastInsertRowid;
  const dis100 = insertDiseno.run('Diseño 100 Años', '1C').lastInsertRowid;
  const disNaciones = insertDiseno.run('Diseño Naciones', '1N').lastInsertRowid;
  const allDisenos = [disArbol, dis100, disNaciones];

  // Productos y Precios
  // Camisas
  const prodCamisa = insertProducto.run('Camisa Sublimada Centenario', 'Camisa de alta calidad con diseños exclusivos del centenario.', catCamisas, 'https://picsum.photos/seed/camisa1/600/600').lastInsertRowid;
  allDisenos.forEach(d => insertProductoDiseno.run(prodCamisa, d));
  
  // Precios Camisas Frente Simple
  insertPrecio.run(prodCamisa, 'Frente simple', 'Juvenil 0-8', 250);
  insertPrecio.run(prodCamisa, 'Frente simple', '10 a XL', 260);
  insertPrecio.run(prodCamisa, 'Frente simple', '2XL y 3XL', 300);
  // Precios Camisas Frente y Espalda
  insertPrecio.run(prodCamisa, 'Frente y espalda', 'Juvenil 0-8', 280);
  insertPrecio.run(prodCamisa, 'Frente y espalda', '10 a XL', 300);
  insertPrecio.run(prodCamisa, 'Frente y espalda', '2XL y 3XL', 340);

  // Tazas
  const prodTaza = insertProducto.run('Taza Sublimada 11oz', 'Taza de cerámica de 11oz con diseño del centenario.', catTazas, 'https://picsum.photos/seed/taza1/600/600').lastInsertRowid;
  allDisenos.forEach(d => insertProductoDiseno.run(prodTaza, d));
  insertPrecio.run(prodTaza, 'Estándar', 'Única', 150);

  // Termos 500ml
  const prodTermo500 = insertProducto.run('Termo de acero para café 500ml', 'Termo de acero inoxidable ideal para mantener tu café caliente.', catTermos500, 'https://picsum.photos/seed/termo500/600/600').lastInsertRowid;
  allDisenos.forEach(d => insertProductoDiseno.run(prodTermo500, d));
  insertPrecio.run(prodTermo500, 'Estándar', '500ml', 450);

  // Termos 600ml
  const prodTermo600 = insertProducto.run('Termo de aluminio 600ml', 'Termo ligero de aluminio para llevar a todas partes.', catTermos600, 'https://picsum.photos/seed/termo600/600/600').lastInsertRowid;
  allDisenos.forEach(d => insertProductoDiseno.run(prodTermo600, d));
  insertPrecio.run(prodTermo600, 'Estándar', '600ml', 240);

  // Llaveros
  const prodLlavero = insertProducto.run('Llavero Metálico Centenario', 'Llavero metálico conmemorativo.', catLlaveros, 'https://picsum.photos/seed/llavero1/600/600').lastInsertRowid;
  insertProductoDiseno.run(prodLlavero, dis100);
  insertProductoDiseno.run(prodLlavero, disArbol);
  insertPrecio.run(prodLlavero, 'Estándar', 'Única', 120);

  // Gorras
  const prodGorra = insertProducto.run('Gorra de Malla Sublimada', 'Gorra tipo trucker con diseño del centenario.', catGorras, 'https://picsum.photos/seed/gorra1/600/600').lastInsertRowid;
  insertProductoDiseno.run(prodGorra, dis100);
  insertProductoDiseno.run(prodGorra, disArbol);
  insertPrecio.run(prodGorra, 'Estándar', 'Única', 180);

  // Láminas
  const prodLamina = insertProducto.run('Lámina de Aluminio 21x29', 'Lámina de aluminio sublimada con retratos (NJG, SJF, AJG).', catLaminas, 'https://picsum.photos/seed/lamina1/600/600').lastInsertRowid;
  insertPrecio.run(prodLamina, 'Estándar', '21x29 cm', 300);

  // Papel fotográfico
  const prodPapel = insertProducto.run('Papel Fotográfico', 'Impresión en papel fotográfico de alta calidad.', catPapel, 'https://picsum.photos/seed/papel1/600/600').lastInsertRowid;
  insertPrecio.run(prodPapel, 'Estándar', 'Varios', 100);

  console.log('Database seeded successfully.');
}

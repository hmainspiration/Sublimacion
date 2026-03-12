import Database from 'better-sqlite3';

const db = new Database('centenario.db');

// 1. Rename existing product to "Camisa Sublimada Centenario - Frente simple"
db.prepare('UPDATE productos SET nombre = ? WHERE id = 1').run('Camisa Sublimada Centenario - Frente simple');

// 2. Update images for existing product (Frente simple)
const updateImage = db.prepare('UPDATE producto_disenos SET imagen = ? WHERE producto_id = ? AND diseno_id = ?');
updateImage.run('C1DA.jpg', 1, 1); // Diseño Árbol
updateImage.run('C1DC.jpg', 1, 2); // Diseño 100 Años
updateImage.run('C1DN.jpg', 1, 3); // Diseño Naciones

// 3. Update category image for "Camisas sublimadas"
db.prepare('UPDATE categorias SET imagen = ? WHERE id = 1').run('C1DA.jpg');

// 4. Create new product "Camisa Sublimada Centenario - Frente y espalda"
const insertProducto = db.prepare('INSERT INTO productos (nombre, descripcion, categoria_id, imagen) VALUES (?, ?, ?, ?)');
const newProdId = insertProducto.run(
  'Camisa Sublimada Centenario - Frente y espalda', 
  'Camisa de alta calidad con diseños exclusivos del centenario (Frente y espalda).', 
  1, 
  'C2DA.jpg'
).lastInsertRowid;

// 5. Move "Frente y espalda" prices to the new product
db.prepare('UPDATE precios SET producto_id = ? WHERE producto_id = 1 AND descripcion = ?').run(newProdId, 'Frente y espalda');

// 6. Add designs to the new product with new images
const insertProdDiseno = db.prepare('INSERT INTO producto_disenos (producto_id, diseno_id, imagen) VALUES (?, ?, ?)');
insertProdDiseno.run(newProdId, 1, 'C2DA.jpg'); // Diseño Árbol
insertProdDiseno.run(newProdId, 2, 'C2DC.jpg'); // Diseño 100 Años
insertProdDiseno.run(newProdId, 3, 'C2DN.jpg'); // Diseño Naciones

console.log('Database updated successfully.');

import Database from 'better-sqlite3';

const db = new Database('centenario.db');

// Update images to use .JPG instead of .jpg
const updateImage = db.prepare('UPDATE producto_disenos SET imagen = ? WHERE producto_id = ? AND diseno_id = ?');
updateImage.run('C1DA.JPG', 1, 1); // Diseño Árbol
updateImage.run('C1DC.JPG', 1, 2); // Diseño 100 Años
updateImage.run('C1DN.JPG', 1, 3); // Diseño Naciones

updateImage.run('C2DA.JPG', 9, 1); // Diseño Árbol
updateImage.run('C2DC.JPG', 9, 2); // Diseño 100 Años
updateImage.run('C2DN.JPG', 9, 3); // Diseño Naciones

// Update category image for "Camisas sublimadas"
db.prepare('UPDATE categorias SET imagen = ? WHERE id = 1').run('C1DA.JPG');

// Update product image
db.prepare('UPDATE productos SET imagen = ? WHERE id = 1').run('C1DA.JPG');
db.prepare('UPDATE productos SET imagen = ? WHERE id = 9').run('C2DA.JPG');

console.log('Database updated successfully with .JPG extensions.');

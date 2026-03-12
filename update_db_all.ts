import Database from 'better-sqlite3';

const db = new Database('centenario.db');

// Helper to get or create diseno
function getOrCreateDiseno(nombre: string, codigo: string) {
  const existing = db.prepare('SELECT id FROM disenos WHERE nombre = ?').get(nombre) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db.prepare('INSERT INTO disenos (nombre, codigo) VALUES (?, ?)').run(nombre, codigo);
  return info.lastInsertRowid as number;
}

const disenoArbol = 1; // Diseño Árbol
const diseno100 = 2;   // Diseño 100 Años
const disenoNaciones = 3; // Diseño Naciones

const disenoNJG = getOrCreateDiseno('Apóstol Naasón Joaquín', 'NJG');
const disenoSJF = getOrCreateDiseno('Apóstol Samuel Joaquín', 'SJF');
const disenoAJG = getOrCreateDiseno('Apóstol Aarón Joaquín', 'AJG');

const updates = [
  {
    prodId: 2,
    catId: 2,
    defaultImg: '1TDA.JPG',
    disenos: [
      { id: disenoArbol, img: '1TDA.JPG' },
      { id: diseno100, img: '1TDC.JPG' },
      { id: disenoNaciones, img: '1TDN.JPG' }
    ]
  },
  {
    prodId: 3,
    catId: 3,
    defaultImg: '2TCDA.JPG',
    disenos: [
      { id: disenoArbol, img: '2TCDA.JPG' },
      { id: diseno100, img: '2TCDC.JPG' },
      { id: disenoNaciones, img: '2TCDN.JPG' }
    ]
  },
  {
    prodId: 4,
    catId: 4,
    defaultImg: '3TADA.JPG',
    disenos: [
      { id: disenoArbol, img: '3TADA.JPG' },
      { id: diseno100, img: '3TADC.JPG' },
      { id: disenoNaciones, img: '3TADN.JPG' }
    ]
  },
  {
    prodId: 5,
    catId: 5,
    defaultImg: 'LL2DA.JPG',
    disenos: [
      { id: disenoArbol, img: 'LL2DA.JPG' },
      { id: diseno100, img: 'LL2DC.JPG' },
      { id: disenoNaciones, img: 'LL2DN.JPG' }
    ]
  },
  {
    prodId: 6,
    catId: 6,
    defaultImg: 'G1DA.JPG',
    disenos: [
      { id: disenoArbol, img: 'G1DA.JPG' },
      { id: diseno100, img: 'G1DC.JPG' },
      { id: disenoNaciones, img: 'G1DN.JPG' }
    ]
  },
  {
    prodId: 7,
    catId: 7,
    defaultImg: 'R1AJG.JPG',
    disenos: [
      { id: disenoNJG, img: 'R1NJG.JPG' },
      { id: disenoSJF, img: 'R1SJF.JPG' },
      { id: disenoAJG, img: 'R1AJG.JPG' }
    ]
  },
  {
    prodId: 8,
    catId: 8,
    defaultImg: 'F1AJG.JPG',
    disenos: [
      { id: disenoNJG, img: 'F1NJG.JPG' },
      { id: disenoSJF, img: 'F1SJF.JPG' },
      { id: disenoAJG, img: 'F1AJG.JPG' }
    ]
  }
];

const updateCat = db.prepare('UPDATE categorias SET imagen = ? WHERE id = ?');
const updateProd = db.prepare('UPDATE productos SET imagen = ? WHERE id = ?');
const deleteProdDisenos = db.prepare('DELETE FROM producto_disenos WHERE producto_id = ?');
const insertProdDiseno = db.prepare('INSERT INTO producto_disenos (producto_id, diseno_id, imagen) VALUES (?, ?, ?)');

db.transaction(() => {
  for (const u of updates) {
    updateCat.run(u.defaultImg, u.catId);
    updateProd.run(u.defaultImg, u.prodId);
    deleteProdDisenos.run(u.prodId);
    for (const d of u.disenos) {
      insertProdDiseno.run(u.prodId, d.id, d.img);
    }
  }
})();

console.log('All products updated successfully.');

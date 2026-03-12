import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

// Intentar importar la base de datos, pero no fallar si no está disponible
let db: any;
let initDb: any;
try {
  const dbModule = await import('./src/db/index');
  db = dbModule.db;
  initDb = dbModule.initDb;
  console.log('Database module loaded.');
} catch (err) {
  console.error('Failed to load database module:', err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Starting server...');

  if (initDb) {
    try {
      initDb();
      console.log('Database initialized.');
    } catch (err) {
      console.error('Database initialization failed:', err);
    }
  }

  app.use(express.json());

  // Configuración de Multer para subidas
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Rutas para la base de datos local (si está disponible)
  app.get('/api/local/stats', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    try {
      const stats = {
        productos: db.prepare('SELECT COUNT(*) as count FROM productos').get().count,
        categorias: db.prepare('SELECT COUNT(*) as count FROM categorias').get().count,
        colecciones: db.prepare('SELECT COUNT(*) as count FROM colecciones').get().count,
        pedidos: db.prepare('SELECT COUNT(*) as count FROM pedidos').get().count,
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Creating Vite server...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware integrated.');
    } catch (viteError) {
      console.error('Failed to create Vite server:', viteError);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical server failure:', err);
});

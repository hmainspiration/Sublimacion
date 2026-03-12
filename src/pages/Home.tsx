import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coleccion } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { Lock, X } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColeccion, setSelectedColeccion] = useState<Coleccion | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColecciones = async () => {
      try {
        const q = query(collection(db, 'colecciones'), where('activa', '==', true));
        const querySnapshot = await getDocs(q);
        const cols: Coleccion[] = [];
        querySnapshot.forEach((doc) => {
          cols.push({ id: doc.id, ...doc.data() } as Coleccion);
        });
        setColecciones(cols);
      } catch (err) {
        console.error('Error fetching colecciones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchColecciones();
  }, []);

  const handleCollectionClick = (coleccion: Coleccion, e: React.MouseEvent) => {
    e.preventDefault();
    if (coleccion.requiere_codigo || coleccion.codigo_acceso) {
      setSelectedColeccion(coleccion);
      setAccessCode('');
      setError('');
    } else {
      navigate(`/coleccion/${coleccion.id}`);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColeccion) return;

    if (accessCode === selectedColeccion.codigo_acceso) {
      sessionStorage.setItem(`access_${selectedColeccion.id}`, 'true');
      navigate(`/coleccion/${selectedColeccion.id}`);
    } else {
      setError('Código incorrecto');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-oxford-900 mb-6">
          Nuestras Colecciones
        </h1>
        <p className="text-lg text-oxford-800 max-w-2xl mx-auto font-light">
          Descubre nuestras líneas exclusivas de productos.
        </p>
        <div className="w-24 h-1 bg-gold-500 mx-auto mt-8 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {colecciones.map((coleccion, index) => (
          <motion.div
            key={coleccion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <a 
              href={`/coleccion/${coleccion.id}`}
              onClick={(e) => handleCollectionClick(coleccion, e)}
              className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100"
            >
              <div className="aspect-w-16 aspect-h-9 relative overflow-hidden bg-stone-50">
                <img 
                  src={getImageUrl(coleccion.imagen)} 
                  alt={coleccion.nombre}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-oxford-900/90 via-oxford-900/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-serif font-semibold text-white">
                      {coleccion.nombre}
                    </h3>
                    {coleccion.requiere_codigo && (
                      <Lock className="h-5 w-5 text-gold-400" />
                    )}
                  </div>
                  {coleccion.descripcion && (
                    <p className="text-stone-300 text-sm mb-4 line-clamp-2">
                      {coleccion.descripcion}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gold-400 font-medium uppercase tracking-wider">
                    Ver colección &rarr;
                  </div>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>

      {selectedColeccion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-stone-200"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
              <h3 className="text-lg font-serif font-bold text-oxford-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-gold-500" />
                Acceso Restringido
              </h3>
              <button onClick={() => setSelectedColeccion(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleVerifyCode} className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-stone-600 mb-6">
                  La colección <span className="font-semibold text-oxford-900">{selectedColeccion.nombre}</span> es privada. Por favor, ingresa el código de acceso para continuar.
                </p>
                <input 
                  type="password" 
                  required
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  placeholder="Código de acceso"
                  className="w-full px-4 py-3 text-center tracking-widest border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-lg"
                />
                {error && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                )}
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-oxford-900 hover:bg-oxford-800 text-white rounded-lg font-medium transition-colors uppercase tracking-wider text-sm"
              >
                Acceder
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

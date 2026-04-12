import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Coleccion } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { Lock, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColeccion, setSelectedColeccion] = useState<Coleccion | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % colecciones.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + colecciones.length) % colecciones.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (colecciones.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] text-center px-4">
        <h2 className="text-3xl font-serif text-navy-900 mb-4">No hay catálogos disponibles</h2>
        <p className="text-stone-500">Por favor, vuelve más tarde o contacta al administrador.</p>
      </div>
    );
  }

  const currentColeccion = colecciones[currentIndex];

  return (
    <div className="w-full relative h-[calc(100vh-80px)] min-h-[600px] overflow-hidden bg-navy-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={getImageUrl(currentColeccion.imagen)} 
            alt={currentColeccion.nombre} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-navy-900/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent opacity-90" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <motion.span 
          key={`subtitle-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gold-400 font-medium tracking-[0.2em] uppercase text-sm md:text-base mb-4 block"
        >
          Catálogo Oficial
        </motion.span>
        
        <motion.h1 
          key={`title-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-tight"
        >
          {currentColeccion.nombre}
        </motion.h1>
        
        {currentColeccion.descripcion && (
          <motion.p 
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl text-stone-200 mb-10 font-light max-w-2xl mx-auto"
          >
            {currentColeccion.descripcion}
          </motion.p>
        )}
        
        <motion.div
          key={`btn-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button 
            onClick={(e) => handleCollectionClick(currentColeccion, e)}
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105"
          >
            Ver Catálogo <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      {colecciones.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          {/* Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {colecciones.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-gold-500 w-8' : 'bg-white/50 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal for access code */}
      {selectedColeccion && (
        <div className="fixed inset-0 bg-navy-900/80 flex items-center justify-center z-50 px-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-stone-200"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
              <h3 className="text-lg font-serif font-bold text-navy-900 flex items-center gap-2">
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
                  La colección <span className="font-semibold text-navy-900">{selectedColeccion.nombre}</span> es privada. Por favor, ingresa el código de acceso para continuar.
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
                className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium transition-colors uppercase tracking-wider text-sm"
              >
                Acceder
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

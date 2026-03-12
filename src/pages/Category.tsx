import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Producto, Categoria } from '../types';
import { ArrowLeft } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Category() {
  const { id } = useParams<{ id: string }>();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriaAndProductos = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'categorias', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCategoria({ id: docSnap.id, ...docSnap.data() } as Categoria);
        }

        const q = query(collection(db, 'productos'), where('categoria_id', '==', id));
        const querySnapshot = await getDocs(q);
        const prods: Producto[] = [];
        querySnapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Producto);
        });
        setProductos(prods);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriaAndProductos();
  }, [id]);

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
      <div className="mb-12 text-center">
        <Link to={categoria?.coleccion_id ? `/coleccion/${categoria.coleccion_id}` : "/"} className="inline-flex items-center text-sm font-medium text-oxford-800 hover:text-gold-600 mb-6 transition-colors uppercase tracking-wider">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la colección
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-oxford-900">
          {categoria?.nombre}
        </h1>
        <div className="w-16 h-1 bg-gold-500 mx-auto mt-6 rounded-full"></div>
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-100 shadow-sm">
          <p className="text-oxford-800 text-lg font-light">No hay productos disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productos.map((producto, index) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link 
                to={`/producto/${producto.id}`}
                className="group block bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 h-full flex flex-col"
              >
                <div className="aspect-w-4 aspect-h-5 relative overflow-hidden bg-stone-50">
                  <img 
                    src={getImageUrl(producto.imagen)} 
                    alt={producto.nombre}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between text-center">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-oxford-900 group-hover:text-gold-600 transition-colors line-clamp-2">
                      {producto.nombre}
                    </h3>
                    <p className="mt-3 text-sm text-oxford-800 font-light line-clamp-2">
                      {producto.descripcion}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <span className="text-sm font-medium text-gold-600 border border-gold-200 bg-gold-50 px-6 py-2 uppercase tracking-wider hover:bg-gold-500 hover:text-white transition-colors">
                      Ver detalles
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

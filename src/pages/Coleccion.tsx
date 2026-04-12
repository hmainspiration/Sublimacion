import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Categoria, Coleccion as ColeccionType } from '../types';
import { getImageUrl } from '../utils/imageHelper';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search } from 'lucide-react';

export default function Coleccion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [coleccion, setColeccion] = useState<ColeccionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchColeccionAndCategorias = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'colecciones', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          navigate('/');
          return;
        }

        const currentCol = { id: docSnap.id, ...docSnap.data() } as ColeccionType;
        
        if (currentCol.requiere_codigo || currentCol.codigo_acceso) {
          const hasAccess = sessionStorage.getItem(`access_${id}`);
          if (!hasAccess) {
            navigate('/');
            return;
          }
        }

        setColeccion(currentCol);

        // Fetch categories for this collection
        const q = query(collection(db, 'categorias'), where('coleccion_id', '==', id));
        const querySnapshot = await getDocs(q);
        const cats: Categoria[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Categoria;
          if (data.activa !== false) {
            cats.push({ id: doc.id, ...data });
          }
        });
        setCategorias(cats);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColeccionAndCategorias();
  }, [id, navigate]);

  const filteredCategorias = categorias.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <Link to="/" className="text-gold-600 hover:text-gold-500 inline-block uppercase tracking-wider text-sm font-medium mb-4">
          &larr; Volver a Colecciones
        </Link>
      </div>

      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-navy-900 mb-6">
          {coleccion?.nombre}
        </h1>
        {coleccion?.descripcion && (
          <p className="text-lg text-stone-600 max-w-2xl mx-auto font-light">
            {coleccion.descripcion}
          </p>
        )}
        <div className="w-24 h-1 bg-gold-500 mx-auto mt-8 rounded-full mb-8"></div>

        <div className="max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      {filteredCategorias.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-100 shadow-sm rounded-2xl">
          <p className="text-navy-800 text-lg font-light">
            {searchTerm ? 'No se encontraron categorías que coincidan con tu búsqueda.' : 'No hay categorías disponibles en esta colección.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCategorias.map((categoria, index) => (
            <motion.div
              key={categoria.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link 
                to={`/categoria/${categoria.id}`}
                className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100"
              >
                <div className="aspect-w-4 aspect-h-5 relative overflow-hidden bg-stone-50">
                  <img 
                    src={getImageUrl(categoria.imagen)} 
                    alt={categoria.nombre}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oxford-900/80 via-oxford-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-xl font-serif font-semibold text-white mb-2">
                      {categoria.nombre}
                    </h3>
                    <div className="flex items-center text-sm text-gold-400 font-medium uppercase tracking-wider">
                      Ver productos &rarr;
                    </div>
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

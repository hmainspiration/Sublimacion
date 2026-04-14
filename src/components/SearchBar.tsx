import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Producto } from '../types';
import { Link } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      const snap = await getDocs(collection(db, 'productos'));
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
      setProductos(prods);
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setFiltered([]);
      setIsOpen(false);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = productos.filter(p => 
      p.nombre.toLowerCase().includes(lowerQuery) || 
      p.descripcion.toLowerCase().includes(lowerQuery)
    );
    setFiltered(results);
    setIsOpen(true);
  }, [query, productos]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block">
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 rounded-full border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none text-sm"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() !== '') setIsOpen(true); }}
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {filtered.map(prod => (
            <Link
              key={prod.id}
              to={`/producto/${prod.id}`}
              onClick={() => { setIsOpen(false); setQuery(''); }}
              className="flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
            >
              <img src={prod.imagen} alt={prod.nombre} loading="lazy" className="w-12 h-12 object-cover rounded-md" />
              <div>
                <p className="font-medium text-sm text-navy-900">{prod.nombre}</p>
                <p className="text-xs text-stone-500 line-clamp-1">{prod.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {isOpen && query.trim() !== '' && filtered.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-stone-100 p-4 text-center text-sm text-stone-500 z-50">
          No se encontraron productos.
        </div>
      )}
    </div>
  );
}

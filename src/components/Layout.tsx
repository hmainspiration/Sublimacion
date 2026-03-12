import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, Settings } from 'lucide-react';
import ContactInfo from './ContactInfo';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white font-sans text-oxford-900">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <ShoppingBag className="h-7 w-7 text-gold-500" />
              <span className="font-serif font-semibold text-2xl tracking-tight text-oxford-900">COMUNICACIÓN SOCIAL</span>
            </Link>
            <nav className="flex gap-6 items-center">
              <Link to="/" className="text-oxford-800 hover:text-gold-600 font-medium transition-colors text-sm uppercase tracking-wider">
                Catálogo
              </Link>
              <Link to="/admin" className="text-oxford-800 hover:text-gold-600 font-medium transition-colors flex items-center gap-2 text-sm uppercase tracking-wider">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>

      <ContactInfo />

      <footer className="bg-oxford-900 text-stone-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <p className="font-serif text-lg mb-4 text-gold-400">COMUNICACIÓN SOCIAL</p>
          <p className="text-sm mb-8">&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
          
          <div className="pt-8 border-t border-oxford-800 w-full flex flex-col items-center justify-center gap-4">
            <span className="text-xs text-stone-500 uppercase tracking-widest">Diseño y Desarrollo Web por</span>
            <a 
              href="https://github.com/hmainspiration" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="opacity-60 hover:opacity-100 transition-opacity duration-300"
            >
              <img 
                src="https://raw.githubusercontent.com/hmainspiration/imagenes-tienda/main/Logo%20HMA.png" 
                alt="HMA Inspiration" 
                className="h-6 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

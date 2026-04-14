import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, Settings, MessageCircle, ShoppingCart } from 'lucide-react';
import ContactInfo from './ContactInfo';
import SearchBar from './SearchBar';
import Cart from './Cart';
import { useCart } from '../context/CartContext';
import { getWhatsAppLink } from '../utils/contact';

export default function Layout() {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-offwhite font-sans text-charcoal flex flex-col">
      <ContactInfo />
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-stone-100/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <ShoppingBag className="h-7 w-7 text-gold-500" />
              <span className="font-serif font-semibold text-xl sm:text-2xl tracking-tight text-navy-900 hidden sm:block">COMUNICACIÓN SOCIAL</span>
            </Link>
            
            <div className="flex-1 flex justify-center max-w-md">
              <SearchBar />
            </div>

            <nav className="flex gap-4 sm:gap-6 items-center shrink-0">
              <Link to="/" className="text-navy-800 hover:text-gold-600 font-medium transition-colors text-xs sm:text-sm uppercase tracking-wider hidden sm:block">
                Catálogo
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-navy-800 hover:text-gold-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-gold-500 text-navy-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link to="/admin" className="text-navy-800 hover:text-gold-600 font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <Cart />

      <footer className="bg-navy-900 text-stone-300 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="h-10 w-10 text-gold-500 opacity-90" />
            <span className="font-serif text-3xl text-gold-400 tracking-wide font-semibold">COMUNICACIÓN SOCIAL</span>
          </div>
          
          <p className="text-sm mb-8 max-w-md text-stone-400 leading-relaxed">
            Preservando la historia y celebrando el centenario a través de productos conmemorativos de alta calidad.
          </p>

          <a 
            href={getWhatsAppLink()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 mb-12 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Contáctanos por WhatsApp
          </a>

          <p className="text-sm mb-8">&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
          
          <div className="pt-8 border-t border-navy-800 w-full flex flex-col items-center justify-center gap-4">
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
                loading="lazy"
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

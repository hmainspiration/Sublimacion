import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Producto, Precio, Diseno } from '../types';
import { ArrowLeft, MessageCircle, CheckCircle2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { getWhatsAppLink } from '../utils/contact';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, clienteData, setClienteData, updateCartItemDbId } = useCart();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDiseno, setSelectedDiseno] = useState<Diseno | null>(null);
  const [selectedPrecio, setSelectedPrecio] = useState<Precio | null>(null);
  const [selectedSpecificSize, setSelectedSpecificSize] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [tempClienteNombre, setTempClienteNombre] = useState('');
  const [tempClienteTelefono, setTempClienteTelefono] = useState('');
  const [tempClienteIglesia, setTempClienteIglesia] = useState('');

  const getSpecificSizes = (talla: string): string[] | null => {
    if (!talla) return null;
    const lowerTalla = talla.toLowerCase();
    if (lowerTalla.includes('juvenil 0-8')) {
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
    }
    if (lowerTalla.includes('10 a xl')) {
      return ['10', '12', '14', '16', 'S', 'M', 'L', 'XL'];
    }
    if (lowerTalla.includes('2xl y 3xl')) {
      return ['2XL', '3XL'];
    }
    return null;
  };

  useEffect(() => {
    if (selectedPrecio) {
      const specificSizes = getSpecificSizes(selectedPrecio.talla);
      if (specificSizes && specificSizes.length > 0) {
        setSelectedSpecificSize(specificSizes[0]);
      } else {
        setSelectedSpecificSize('');
      }
    }
  }, [selectedPrecio]);

  useEffect(() => {
    const fetchProducto = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'productos', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Producto;
          setProducto(data);
          if (data.disenos && data.disenos.length > 0) {
            setSelectedDiseno(data.disenos[0]);
          }
          if (data.precios && data.precios.length > 0) {
            setSelectedPrecio(data.precios[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-serif font-bold text-navy-900">Producto no encontrado</h2>
        <Link to="/" className="text-gold-600 hover:text-gold-500 mt-6 inline-block uppercase tracking-wider text-sm font-medium">Volver al inicio</Link>
      </div>
    );
  }

  const handleAddToCartClick = () => {
    if (!producto || !selectedPrecio) {
      alert('Por favor, selecciona una opción/precio antes de añadir al carrito.');
      return;
    }

    if (!clienteData) {
      setShowClienteModal(true);
    } else {
      processAddToCart(clienteData);
    }
  };

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClienteNombre || !tempClienteTelefono) {
      alert('Por favor, ingresa tu nombre y teléfono.');
      return;
    }
    const newData = {
      nombre: tempClienteNombre,
      telefono: tempClienteTelefono,
      iglesia: tempClienteIglesia
    };
    setClienteData(newData);
    setShowClienteModal(false);
    processAddToCart(newData);
  };

  const processAddToCart = async (data: { nombre: string, telefono: string, iglesia?: string }) => {
    if (!producto || !selectedPrecio) return;
    
    const cartItem = {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      producto_imagen: selectedDiseno?.imagen || producto.imagen,
      diseno_nombre: selectedDiseno?.nombre,
      diseno_codigo: selectedDiseno?.codigo,
      opcion_descripcion: selectedPrecio.descripcion,
      talla: selectedSpecificSize || selectedPrecio.talla,
      precio_unitario: selectedPrecio.precio,
      cantidad: cantidad
    };

    // Add to cart state immediately for fast UI response
    const cartItemId = addToCart(cartItem);

    try {
      // Register in DB in background
      const docRef = await addDoc(collection(db, 'pedidos'), {
        producto_id: cartItem.producto_id,
        producto_nombre: cartItem.producto_nombre,
        producto_imagen: cartItem.producto_imagen,
        diseno_codigo: cartItem.diseno_codigo || null,
        diseno_nombre: cartItem.diseno_nombre || null,
        opcion_descripcion: cartItem.opcion_descripcion || null,
        talla: cartItem.talla || null,
        precio_unitario: cartItem.precio_unitario,
        cantidad: cartItem.cantidad,
        total: cartItem.precio_unitario * cartItem.cantidad,
        cliente_nombre: data.nombre,
        cliente_telefono: data.telefono,
        cliente_iglesia: data.iglesia || null,
        estado: 'pendiente',
        createdAt: serverTimestamp()
      });
      
      // Update cart item with DB ID if needed later
      updateCartItemDbId(cartItemId, docRef.id);
    } catch (error) {
      console.error("Error al registrar el pedido en segundo plano:", error);
    }
  };

  const handleContactar = () => {
    const message = `Hola, me gustaría obtener más información sobre el producto: ${producto.nombre}.`;
    window.open(getWhatsAppLink(message), '_blank');
  };

  const displayImage = selectedDiseno?.imagen || producto.imagen;
  const total = selectedPrecio ? selectedPrecio.precio * cantidad : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      <Link to={`/coleccion/${producto.categoria_id}`} className="inline-flex items-center text-sm font-medium text-navy-800 hover:text-gold-600 mb-6 transition-colors uppercase tracking-wider">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* Left Column: Image (Sticky on Mobile & Desktop) */}
        <div className="lg:col-span-6">
          <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md pb-4 lg:pb-0 lg:bg-transparent lg:backdrop-blur-none">
            <div className="bg-white border border-stone-100 p-2 lg:p-4 shadow-sm rounded-2xl">
              <div className="aspect-w-1 aspect-h-1 lg:aspect-w-4 lg:aspect-h-5 overflow-hidden bg-stone-50 rounded-xl">
                <img 
                  src={getImageUrl(displayImage)} 
                  alt={producto.nombre}
                  loading="lazy"
                  className="w-full h-full object-contain object-center transition-opacity duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-stone-100 p-6 lg:p-8 shadow-sm rounded-2xl mt-6 hidden lg:block">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-6">{producto.nombre}</h1>
            <div className="prose prose-stone max-w-none">
              <p className="text-stone-600 text-lg font-light leading-relaxed">{producto.descripcion}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Configurator and Cart */}
        <div className="lg:col-span-6">
          <div className="space-y-6 lg:space-y-8">
            
            {/* Mobile Title & Description */}
            <div className="bg-white border border-stone-100 p-6 shadow-sm rounded-2xl lg:hidden">
              <h1 className="text-2xl font-serif font-bold text-navy-900 mb-4">{producto.nombre}</h1>
              <p className="text-stone-600 text-base font-light leading-relaxed">{producto.descripcion}</p>
            </div>

            {/* Configurator */}
            <div className="bg-white border border-stone-100 p-6 lg:p-8 shadow-sm rounded-2xl">
              <h2 className="text-xl lg:text-2xl font-serif font-bold text-navy-900 mb-6 border-b border-stone-100 pb-4">Configura tu pedido</h2>
              
              {/* Step 1: Designs */}
              {producto.disenos && producto.disenos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">1. Selecciona el Diseño</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    {producto.disenos.map((diseno, index) => {
                      const isSelected = selectedDiseno?.codigo === diseno.codigo && selectedDiseno?.nombre === diseno.nombre;
                      const isAgotado = diseno.stock !== undefined && diseno.stock <= 0;
                      return (
                        <button
                          key={`${diseno.codigo}-${diseno.nombre}-${index}`}
                          onClick={() => !isAgotado && setSelectedDiseno(diseno)}
                          disabled={isAgotado}
                          className={`px-3 py-3 text-xs sm:text-sm font-medium transition-all duration-200 border rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-center sm:text-left relative overflow-hidden ${
                            isAgotado
                              ? 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed'
                              : isSelected 
                                ? 'border-gold-500 bg-gold-50 text-navy-900 shadow-md' 
                                : 'border-stone-200 bg-white text-stone-600 hover:border-gold-300'
                          }`}
                        >
                          <span className="truncate w-full">{diseno.nombre}</span>
                          {isSelected && !isAgotado && <CheckCircle2 className="h-4 w-4 text-gold-600 flex-shrink-0 hidden sm:block" />}
                          {isAgotado && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                              Agotado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Options/Prices */}
              {producto.precios && producto.precios.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">
                    {producto.disenos && producto.disenos.length > 0 ? '2.' : '1.'} Opciones y Precios
                  </h3>
                  <div className="space-y-3">
                    {producto.precios.map((precio, index) => {
                      const isSelected = selectedPrecio?.descripcion === precio.descripcion && selectedPrecio?.talla === precio.talla;
                      return (
                        <button
                          key={`${precio.descripcion}-${precio.talla}-${index}`}
                          onClick={() => setSelectedPrecio(precio)}
                          className={`w-full text-left px-5 py-4 transition-all duration-200 border rounded-xl flex justify-between items-center ${
                            isSelected 
                              ? 'border-gold-500 bg-gold-50 shadow-md' 
                              : 'border-stone-200 bg-white hover:border-gold-300'
                          }`}
                        >
                          <div>
                            <div className={`font-medium ${isSelected ? 'text-navy-900' : 'text-stone-700'}`}>
                              {precio.descripcion}
                            </div>
                            {precio.talla && (
                              <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">
                                {precio.talla}
                              </div>
                            )}
                          </div>
                          <div className={`text-xl font-sans font-bold tracking-tight ${isSelected ? 'text-gold-600' : 'text-navy-900'}`}>
                            C${precio.precio}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Specific Size */}
              {selectedPrecio && getSpecificSizes(selectedPrecio.talla) && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">
                    Selecciona la talla exacta
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getSpecificSizes(selectedPrecio.talla)?.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSpecificSize(size)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 border ${
                          selectedSpecificSize === size 
                            ? 'border-gold-500 bg-gold-500 text-white shadow-md' 
                            : 'border-stone-200 bg-white text-stone-700 hover:border-gold-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Quantity */}
              <div className="mb-2">
                <h3 className="text-xs font-bold text-navy-800 uppercase tracking-widest mb-4">Cantidad</h3>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-sans font-semibold text-navy-900 w-12 text-center">{cantidad}</span>
                  <button 
                    onClick={() => setCantidad(cantidad + 1)}
                    className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-navy-900 text-white p-6 lg:p-8 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-6 border-b border-navy-800 pb-4">
                <ShoppingCart className="h-6 w-6 text-gold-500" />
                <h2 className="text-xl font-serif font-bold">Resumen de Selección</h2>
              </div>
              
              <div className="space-y-4 mb-8 text-sm font-light text-stone-300">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Producto:</span>
                  <span className="text-right">{producto.nombre}</span>
                </div>
                {selectedDiseno && (
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Diseño:</span>
                    <span className="text-right">{selectedDiseno.nombre}</span>
                  </div>
                )}
                {selectedPrecio && (
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Opción:</span>
                    <span className="text-right">{selectedPrecio.descripcion}</span>
                  </div>
                )}
                {selectedSpecificSize && (
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Talla:</span>
                    <span className="text-right">{selectedSpecificSize}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-white">Cantidad:</span>
                  <span className="text-right">{cantidad}</span>
                </div>
                {selectedPrecio && (
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Precio Unitario:</span>
                    <span className="text-right">C${selectedPrecio.precio}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-8 pt-6 border-t border-navy-800">
                <span className="text-lg font-medium text-gold-400">Subtotal</span>
                <span className="text-3xl font-sans font-bold tracking-tight text-gold-500">
                  C${total}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleAddToCartClick}
                  className="w-full font-bold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider bg-gold-500 hover:bg-gold-600 text-navy-900"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Añadir al Carrito
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Cliente Data Modal */}
      <AnimatePresence>
        {showClienteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-50"
              onClick={() => setShowClienteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold text-navy-900 mb-2">Tus Datos</h3>
                <p className="text-stone-500 mb-6">Por favor, ingresa tus datos para registrar el pedido.</p>
                
                <form onSubmit={handleClienteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nombre completo *</label>
                    <input 
                      type="text" 
                      required
                      value={tempClienteNombre}
                      onChange={e => setTempClienteNombre(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono (WhatsApp) *</label>
                    <input 
                      type="tel" 
                      required
                      value={tempClienteTelefono}
                      onChange={e => setTempClienteTelefono(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Iglesia / Organización (Opcional)</label>
                    <input 
                      type="text" 
                      value={tempClienteIglesia}
                      onChange={e => setTempClienteIglesia(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowClienteModal(false)}
                      className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-medium transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Producto, Precio, Diseno } from '../types';
import { ArrowLeft, MessageCircle, CheckCircle2, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDiseno, setSelectedDiseno] = useState<Diseno | null>(null);
  const [selectedPrecio, setSelectedPrecio] = useState<Precio | null>(null);
  const [selectedSpecificSize, setSelectedSpecificSize] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-serif font-bold text-oxford-900">Producto no encontrado</h2>
        <Link to="/" className="text-gold-600 hover:text-gold-500 mt-6 inline-block uppercase tracking-wider text-sm font-medium">Volver al inicio</Link>
      </div>
    );
  }

  const handleRegisterOrder = async () => {
    if (!clienteNombre || !clienteTelefono) {
      alert('Por favor, ingresa tu nombre y teléfono para procesar el pedido.');
      return;
    }

    setIsSubmitting(true);
    const total = selectedPrecio ? selectedPrecio.precio * cantidad : 0;
    
    try {
      // Save order to Firestore
      await addDoc(collection(db, 'pedidos'), {
        producto_nombre: producto.nombre,
        diseno_nombre: selectedDiseno ? `${selectedDiseno.nombre} (${selectedDiseno.codigo})` : null,
        opcion_descripcion: selectedPrecio ? selectedPrecio.descripcion : null,
        talla: selectedSpecificSize || selectedPrecio?.talla || null,
        cantidad,
        total,
        estado: 'pendiente',
        createdAt: serverTimestamp(),
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono
      });

      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = async () => {
    if (!clienteNombre || !clienteTelefono) {
      alert('Por favor, ingresa tu nombre y teléfono para procesar el pedido.');
      return;
    }

    setIsSubmitting(true);
    const total = selectedPrecio ? selectedPrecio.precio * cantidad : 0;
    
    try {
      // Save order to Firestore
      await addDoc(collection(db, 'pedidos'), {
        producto_nombre: producto.nombre,
        diseno_nombre: selectedDiseno ? `${selectedDiseno.nombre} (${selectedDiseno.codigo})` : null,
        opcion_descripcion: selectedPrecio ? selectedPrecio.descripcion : null,
        talla: selectedSpecificSize || selectedPrecio?.talla || null,
        cantidad,
        total,
        estado: 'pendiente',
        createdAt: serverTimestamp(),
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono
      });

      setOrderSuccess(true);

      // Open WhatsApp
      const message = `Hola, quiero ordenar:
${cantidad}x ${producto.nombre}
${selectedDiseno ? `Diseño/Retrato: ${selectedDiseno.nombre} (${selectedDiseno.codigo})` : ''}
${selectedPrecio ? `Opción: ${selectedPrecio.descripcion}` : ''}
${selectedPrecio?.talla ? `Talla/Rango: ${selectedPrecio.talla}` : ''}
${selectedSpecificSize ? `Talla Exacta: ${selectedSpecificSize}` : ''}
Nombre: ${clienteNombre}
Teléfono: ${clienteTelefono}

Total: C$${total}`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/50557693382?text=${encodedMessage}`, '_blank');
      
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
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
      <Link to={`/categoria/${producto.categoria_id}`} className="inline-flex items-center text-sm font-medium text-oxford-800 hover:text-gold-600 mb-8 transition-colors uppercase tracking-wider">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la categoría
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border border-stone-100 p-4 shadow-sm">
            <div className="aspect-w-4 aspect-h-5 overflow-hidden bg-stone-50">
              <img 
                src={getImageUrl(displayImage)} 
                alt={producto.nombre}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="bg-white border border-stone-100 p-8 shadow-sm">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-oxford-900 mb-6">{producto.nombre}</h1>
            <div className="prose prose-stone max-w-none">
              <p className="text-oxford-800 text-lg font-light leading-relaxed">{producto.descripcion}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Configurator and Cart */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-8">
            
            {/* Configurator */}
            <div className="bg-white border border-stone-100 p-8 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-oxford-900 mb-6 border-b border-stone-100 pb-4">Configura tu pedido</h2>
              
              {/* Step 1: Designs */}
              {producto.disenos && producto.disenos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-oxford-800 uppercase tracking-widest mb-4">1. Selecciona el Diseño / Retrato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {producto.disenos.map(diseno => (
                      <button
                        key={diseno.id}
                        onClick={() => setSelectedDiseno(diseno)}
                        className={`px-4 py-3 text-sm font-medium transition-all duration-200 border flex items-center justify-between ${
                          selectedDiseno?.id === diseno.id 
                            ? 'border-gold-500 bg-gold-50 text-oxford-900' 
                            : 'border-stone-200 bg-white text-oxford-800 hover:border-gold-300'
                        }`}
                      >
                        <span className="truncate pr-2">{diseno.nombre}</span>
                        {selectedDiseno?.id === diseno.id && <CheckCircle2 className="h-4 w-4 text-gold-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Options/Prices */}
              {producto.precios && producto.precios.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-oxford-800 uppercase tracking-widest mb-4">
                    {producto.disenos && producto.disenos.length > 0 ? '2.' : '1.'} Opciones y Precios
                  </h3>
                  <div className="space-y-3">
                    {producto.precios.map(precio => (
                      <button
                        key={precio.id}
                        onClick={() => setSelectedPrecio(precio)}
                        className={`w-full text-left px-5 py-4 transition-all duration-200 border flex justify-between items-center ${
                          selectedPrecio?.id === precio.id 
                            ? 'border-gold-500 bg-gold-50' 
                            : 'border-stone-200 bg-white hover:border-gold-300'
                        }`}
                      >
                        <div>
                          <div className={`font-medium ${selectedPrecio?.id === precio.id ? 'text-oxford-900' : 'text-oxford-800'}`}>
                            {precio.descripcion}
                          </div>
                          {precio.talla && (
                            <div className="text-xs text-oxford-800 mt-1 uppercase tracking-wider opacity-80">
                              {precio.talla}
                            </div>
                          )}
                        </div>
                        <div className={`text-xl font-sans font-bold tracking-tight ${selectedPrecio?.id === precio.id ? 'text-gold-600' : 'text-oxford-900'}`}>
                          C${precio.precio}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Specific Size */}
              {selectedPrecio && getSpecificSizes(selectedPrecio.talla) && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-oxford-800 uppercase tracking-widest mb-4">
                    Selecciona la talla exacta
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getSpecificSizes(selectedPrecio.talla)?.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSpecificSize(size)}
                        className={`w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-200 border ${
                          selectedSpecificSize === size 
                            ? 'border-gold-500 bg-gold-500 text-white' 
                            : 'border-stone-200 bg-white text-oxford-800 hover:border-gold-300'
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
                <h3 className="text-xs font-bold text-oxford-800 uppercase tracking-widest mb-4">Cantidad</h3>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-10 h-10 border border-stone-300 flex items-center justify-center text-oxford-800 hover:bg-stone-50 hover:border-stone-400 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-sans font-semibold text-oxford-900 w-8 text-center">{cantidad}</span>
                  <button 
                    onClick={() => setCantidad(cantidad + 1)}
                    className="w-10 h-10 border border-stone-300 flex items-center justify-center text-oxford-800 hover:bg-stone-50 hover:border-stone-400 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Step 5: Client Info */}
              <div className="mb-2">
                <h3 className="text-xs font-bold text-oxford-800 uppercase tracking-widest mb-4">Datos del Cliente</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-oxford-800 mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Ej. Juan Pérez"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-oxford-800 mb-1">Teléfono (WhatsApp)</label>
                    <input 
                      type="tel" 
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Ej. +505 8888 8888"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-oxford-900 text-white p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6 border-b border-oxford-800 pb-4">
                <ShoppingCart className="h-6 w-6 text-gold-500" />
                <h2 className="text-xl font-serif font-bold">Resumen de Pedido</h2>
              </div>
              
              <div className="space-y-4 mb-8 text-sm font-light text-stone-300">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Producto:</span>
                  <span className="text-right">{producto.nombre}</span>
                </div>
                {selectedDiseno && (
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Diseño/Retrato:</span>
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

              <div className="flex items-center justify-between mb-8 pt-6 border-t border-oxford-800">
                <span className="text-lg font-medium text-gold-400">Total a Pagar</span>
                <span className="text-3xl font-sans font-bold tracking-tight text-gold-500">
                  C${total}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleRegisterOrder}
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 px-8 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider ${
                    orderSuccess 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : orderSuccess ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      ¡Pedido Registrado!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Registrar Pedido
                    </>
                  )}
                </button>
                <button 
                  onClick={handleWhatsAppClick}
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 px-8 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <MessageCircle className="h-5 w-5" />
                  Pedir por WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

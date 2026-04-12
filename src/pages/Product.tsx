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
  const [clienteIglesia, setClienteIglesia] = useState('');
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

  const handleRegisterOrder = async () => {
    if (!clienteNombre || !clienteTelefono || !clienteIglesia) {
      alert('Por favor, ingresa tu nombre, iglesia y teléfono para procesar el pedido.');
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
        cliente_iglesia: clienteIglesia,
        cliente_telefono: clienteTelefono
      });

      setOrderSuccess(true);

      // Open WhatsApp with order details
      const message = `Hola, acabo de registrar un pedido:
*${cantidad}x ${producto.nombre}*
${selectedDiseno ? `Diseño: ${selectedDiseno.nombre} (${selectedDiseno.codigo})` : ''}
${selectedPrecio ? `Opción: ${selectedPrecio.descripcion}` : ''}
${selectedPrecio?.talla ? `Talla/Rango: ${selectedPrecio.talla}` : ''}
${selectedSpecificSize ? `Talla Exacta: ${selectedSpecificSize}` : ''}

*Datos del Cliente:*
Nombre: ${clienteNombre}
Iglesia: ${clienteIglesia}
Teléfono: ${clienteTelefono}

*Total: C$${total}*`;

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

  const handleContactar = () => {
    const message = `Hola, me gustaría obtener más información sobre el producto: ${producto.nombre}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/50557693382?text=${encodedMessage}`, '_blank');
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
                      return (
                        <button
                          key={`${diseno.codigo}-${diseno.nombre}-${index}`}
                          onClick={() => setSelectedDiseno(diseno)}
                          className={`px-3 py-3 text-xs sm:text-sm font-medium transition-all duration-200 border rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-center sm:text-left ${
                            isSelected 
                              ? 'border-gold-500 bg-gold-50 text-navy-900 shadow-md' 
                              : 'border-stone-200 bg-white text-stone-600 hover:border-gold-300'
                          }`}
                        >
                          <span className="truncate w-full">{diseno.nombre}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-gold-600 flex-shrink-0 hidden sm:block" />}
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
                      const isAgotado = precio.stock !== undefined && precio.stock <= 0;
                      return (
                        <button
                          key={`${precio.descripcion}-${precio.talla}-${index}`}
                          onClick={() => !isAgotado && setSelectedPrecio(precio)}
                          disabled={isAgotado}
                          className={`w-full text-left px-5 py-4 transition-all duration-200 border rounded-xl flex justify-between items-center ${
                            isAgotado 
                              ? 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed'
                              : isSelected 
                                ? 'border-gold-500 bg-gold-50 shadow-md' 
                                : 'border-stone-200 bg-white hover:border-gold-300'
                          }`}
                        >
                          <div>
                            <div className={`font-medium ${isSelected && !isAgotado ? 'text-navy-900' : 'text-stone-700'}`}>
                              {precio.descripcion}
                            </div>
                            {precio.talla && (
                              <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">
                                {precio.talla}
                              </div>
                            )}
                            {isAgotado && (
                              <div className="text-xs text-red-500 mt-1 font-medium">
                                Agotado
                              </div>
                            )}
                          </div>
                          <div className={`text-xl font-sans font-bold tracking-tight ${isSelected && !isAgotado ? 'text-gold-600' : 'text-navy-900'}`}>
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
                  onClick={handleAddToCart}
                  className="w-full font-bold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider bg-gold-500 hover:bg-gold-600 text-navy-900"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Añadir al Carrito
                </button>
                <button 
                  onClick={handleContactar}
                  className="w-full font-bold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider bg-stone-800 hover:bg-stone-700 text-white"
                >
                  <MessageCircle className="h-5 w-5" />
                  Consultar por WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

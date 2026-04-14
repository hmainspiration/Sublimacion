import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, Plus, Minus, Edit2, UserX } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageHelper';
import { useState, useEffect } from 'react';
import { getWhatsAppLink } from '../utils/contact';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Cart() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, clearCart, clienteData, setClienteData } = useCart();
  const [isEditingCliente, setIsEditingCliente] = useState(false);
  const [tempNombre, setTempNombre] = useState('');
  const [tempTelefono, setTempTelefono] = useState('');
  const [tempIglesia, setTempIglesia] = useState('');

  useEffect(() => {
    if (clienteData) {
      setTempNombre(clienteData.nombre);
      setTempTelefono(clienteData.telefono);
      setTempIglesia(clienteData.iglesia || '');
    }
  }, [clienteData]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
    
    // Also update DB if dbId exists
    const item = cartItems.find(i => i.id === id);
    if (item && item.dbId) {
      try {
        if (newQuantity <= 0) {
          await deleteDoc(doc(db, 'pedidos', item.dbId));
        } else {
          await updateDoc(doc(db, 'pedidos', item.dbId), {
            cantidad: newQuantity,
            total: item.precio_unitario * newQuantity
          });
        }
      } catch (error) {
        console.error("Error updating DB:", error);
      }
    }
  };

  const handleRemoveFromCart = async (id: string) => {
    removeFromCart(id);
    
    const item = cartItems.find(i => i.id === id);
    if (item && item.dbId) {
      try {
        await deleteDoc(doc(db, 'pedidos', item.dbId));
      } catch (error) {
        console.error("Error deleting from DB:", error);
      }
    }
  };

  const handleSaveCliente = () => {
    if (!tempNombre || !tempTelefono) {
      alert('Por favor, ingresa tu nombre y teléfono.');
      return;
    }
    setClienteData({
      nombre: tempNombre,
      telefono: tempTelefono,
      iglesia: tempIglesia
    });
    setIsEditingCliente(false);
  };

  const handleChangeUser = () => {
    setClienteData(null);
    setTempNombre('');
    setTempTelefono('');
    setTempIglesia('');
    setIsEditingCliente(true);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!clienteData) {
      alert('Por favor, ingresa tus datos antes de enviar el pedido.');
      setIsEditingCliente(true);
      return;
    }

    let message = `*NUEVO PEDIDO*\n\n`;
    message += `*Datos del Cliente:*\n`;
    message += `Nombre: ${clienteData.nombre}\n`;
    message += `Teléfono: ${clienteData.telefono}\n`;
    if (clienteData.iglesia) message += `Iglesia/Org: ${clienteData.iglesia}\n`;
    message += `\n*Detalle del Pedido:*\n`;

    cartItems.forEach((item, index) => {
      message += `\n${index + 1}. *${item.cantidad}x ${item.producto_nombre}*\n`;
      if (item.diseno_nombre) message += `   Diseño: ${item.diseno_nombre} ${item.diseno_codigo ? `(${item.diseno_codigo})` : ''}\n`;
      if (item.opcion_descripcion) message += `   Opción: ${item.opcion_descripcion}\n`;
      if (item.talla) message += `   Talla: ${item.talla}\n`;
      message += `   Subtotal: C$${item.precio_unitario * item.cantidad}\n`;
    });

    message += `\n*TOTAL: C$${cartTotal}*`;

    window.open(getWhatsAppLink(message), '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h2 className="text-xl font-serif font-bold text-navy-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Tu Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
                  <ShoppingBag className="h-16 w-16 text-stone-200" />
                  <p>Tu carrito está vacío</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2 bg-gold-500 text-navy-900 rounded-full font-medium hover:bg-gold-600 transition-colors"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-white border border-stone-100 p-3 rounded-xl shadow-sm">
                      <div className="w-20 h-20 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                        <img 
                          src={getImageUrl(item.producto_imagen)} 
                          alt={item.producto_nombre}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-medium text-navy-900 line-clamp-1">{item.producto_nombre}</h3>
                          <div className="text-xs text-stone-500 mt-1 space-y-0.5">
                            {item.diseno_nombre && <p>Diseño: {item.diseno_nombre}</p>}
                            {item.opcion_descripcion && <p>{item.opcion_descripcion} {item.talla ? `(${item.talla})` : ''}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-stone-200 rounded-lg bg-white">
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                              className="p-1 text-stone-500 hover:text-navy-900 hover:bg-stone-50 rounded-l-lg"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-navy-900">
                              {item.cantidad}
                            </span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                              className="p-1 text-stone-500 hover:text-navy-900 hover:bg-stone-50 rounded-r-lg"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gold-600">C${item.precio_unitario * item.cantidad}</span>
                            <button 
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-stone-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-8 border-t border-stone-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-navy-900">Tus Datos</h3>
                      {clienteData && !isEditingCliente && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditingCliente(true)}
                            className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
                          </button>
                          <button 
                            onClick={handleChangeUser}
                            className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1 ml-2"
                          >
                            <UserX className="h-3 w-3" /> Cambiar Cliente
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {(!clienteData || isEditingCliente) ? (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Nombre completo *"
                          required
                          value={tempNombre}
                          onChange={e => setTempNombre(e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                        />
                        <input 
                          type="tel" 
                          placeholder="Teléfono (WhatsApp) *"
                          required
                          value={tempTelefono}
                          onChange={e => setTempTelefono(e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder="Iglesia / Organización (Opcional)"
                          value={tempIglesia}
                          onChange={e => setTempIglesia(e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
                        />
                        <button 
                          onClick={handleSaveCliente}
                          className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium transition-colors mt-2"
                        >
                          Guardar Datos
                        </button>
                      </div>
                    ) : (
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <p className="font-medium text-navy-900">{clienteData.nombre}</p>
                        <p className="text-sm text-stone-600">{clienteData.telefono}</p>
                        {clienteData.iglesia && <p className="text-sm text-stone-600">{clienteData.iglesia}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 bg-stone-50 border-t border-stone-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-stone-600 font-medium">Total a pagar:</span>
                  <span className="text-2xl font-bold text-navy-900">C${cartTotal}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-medium transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  Enviar Pedido por WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

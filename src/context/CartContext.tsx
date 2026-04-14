import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

export interface ClienteData {
  nombre: string;
  telefono: string;
  iglesia?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => string;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  clienteData: ClienteData | null;
  setClienteData: (data: ClienteData | null) => void;
  updateCartItemDbId: (id: string, dbId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clienteData, setClienteData] = useState<ClienteData | null>(() => {
    const saved = localStorage.getItem('clienteData');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (clienteData) {
      localStorage.setItem('clienteData', JSON.stringify(clienteData));
    } else {
      localStorage.removeItem('clienteData');
    }
  }, [clienteData]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const newItemId = Date.now().toString();
    setCartItems(prev => {
      // Check if identical item exists (same product, design, option, size)
      const existingItemIndex = prev.findIndex(
        i => i.producto_id === item.producto_id && 
             i.diseno_nombre === item.diseno_nombre && 
             i.opcion_descripcion === item.opcion_descripcion && 
             i.talla === item.talla
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].cantidad += item.cantidad;
        return newItems;
      }

      return [...prev, { ...item, id: newItemId }];
    });
    setIsCartOpen(true);
    return newItemId;
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, cantidad } : item));
  };

  const updateCartItemDbId = (id: string, dbId: string) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, dbId } : item));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.cantidad, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen,
      clienteData,
      setClienteData,
      updateCartItemDbId
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

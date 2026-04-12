export interface Coleccion {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
  codigo_acceso?: string;
  activa?: boolean;
  requiere_codigo?: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  imagen: string;
  coleccion_id?: string;
  activa?: boolean;
}

export interface Diseno {
  id: string;
  nombre: string;
  codigo: string;
  imagen?: string;
}

export interface Precio {
  descripcion: string;
  talla: string;
  precio: number;
  stock?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  imagen: string;
  disenos?: Diseno[];
  precios?: Precio[];
}

export interface Pedido {
  id: string;
  producto_nombre: string;
  diseno_nombre?: string;
  opcion_descripcion?: string;
  talla?: string;
  cantidad: number;
  total: number;
  estado: 'pendiente' | 'completado' | 'cancelado';
  createdAt: any; // Firestore Timestamp
  cliente_nombre: string;
  cliente_telefono: string;
}

export interface CartItem {
  id: string; // unique id for the cart item (e.g., timestamp)
  producto_id: string;
  producto_nombre: string;
  producto_imagen: string;
  diseno_nombre?: string;
  diseno_codigo?: string;
  opcion_descripcion?: string;
  talla?: string;
  precio_unitario: number;
  cantidad: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin';
}

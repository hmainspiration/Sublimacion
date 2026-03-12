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

export interface User {
  id: string;
  email: string;
  role: 'admin';
}

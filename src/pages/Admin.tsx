import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Producto, Categoria, Diseno, Precio, Coleccion, Pedido } from '../types';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, LogOut, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';
import { db, auth, storage } from '../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, query, orderBy, getDocFromServer } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export default function Admin() {
  return <AdminContent />;
}

function AdminContent() {
  const [globalError, setGlobalError] = useState<Error | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isColeccionModalOpen, setIsColeccionModalOpen] = useState(false);
  
  // Forms state
  const [newProduct, setNewProduct] = useState({ nombre: '', descripcion: '', categoria_id: '', imagen: '' });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDisenos, setSelectedDisenos] = useState<{ id: string, nombre: string, codigo: string, imagen: string }[]>([]);
  const [productPrecios, setProductPrecios] = useState<{ descripcion: string, talla: string, precio: number }[]>([]);
  
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [editingColeccion, setEditingColeccion] = useState<Coleccion | null>(null);
  const [newColeccion, setNewColeccion] = useState({ nombre: '', descripcion: '', codigo_acceso: '', imagen: '', activa: true });
  const [coleccionImageFile, setColeccionImageFile] = useState<File | null>(null);

  const handleImageUpload = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'productos' | 'categorias' | 'colecciones' | 'pedidos' | 'usuarios' | 'configuracion'>('pedidos');
  const [users, setUsers] = useState<{id: string, email: string, role: string}[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [settings, setSettings] = useState({ 
    telefono: '', 
    banco: '', 
    redes: '', 
    visible: false 
  });

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setGlobalError(error instanceof Error ? error : new Error(JSON.stringify(errInfo)));
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorCode = error.code || 'unknown';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setLoginError('Correo o contraseña incorrectos');
      } else if (errorCode === 'auth/network-request-failed') {
        setLoginError('Error de red: No se pudo conectar con Firebase. Revisa tu conexión o los dominios autorizados.');
      } else {
        setLoginError(`Error (${errorCode}): No se pudo iniciar sesión.`);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportInitialData = async () => {
    setImporting(true);
    setImportError(null);
    
    try {
      // 1. Crear Colección
      let colRef;
      try {
        colRef = await addDoc(collection(db, 'colecciones'), {
          nombre: 'Colección Centenario',
          descripcion: 'Productos exclusivos del centenario',
          imagen: 'https://picsum.photos/seed/centenario/800/400',
          codigo_acceso: '',
          activa: true
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'colecciones');
        return;
      }
      const colId = colRef.id;

      // 2. Crear Categorías
      const categoriasData = [
        { nombre: 'Camisas sublimadas', imagen: 'https://picsum.photos/seed/camisas/400/300' },
        { nombre: 'Tazas sublimadas 11oz', imagen: 'https://picsum.photos/seed/tazas/400/300' },
        { nombre: 'Termos de acero 500ml', imagen: 'https://picsum.photos/seed/termos500/400/300' },
        { nombre: 'Termos de aluminio 600ml', imagen: 'https://picsum.photos/seed/termos600/400/300' },
        { nombre: 'Llaveros', imagen: 'https://picsum.photos/seed/llaveros/400/300' },
        { nombre: 'Gorras', imagen: 'https://picsum.photos/seed/gorras/400/300' },
        { nombre: 'Láminas de aluminio 21x29', imagen: 'https://picsum.photos/seed/laminas/400/300' },
        { nombre: 'Papel fotográfico', imagen: 'https://picsum.photos/seed/papel/400/300' }
      ];

      const catIds: Record<string, string> = {};
      for (const cat of categoriasData) {
        try {
          const ref = await addDoc(collection(db, 'categorias'), { ...cat, coleccion_id: colId });
          catIds[cat.nombre] = ref.id;
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'categorias');
        }
      }

      // 3. Diseños
      const disenosComunes = [
        { id: '1', nombre: 'Diseño Árbol', codigo: 'DA', imagen: '' },
        { id: '2', nombre: 'Diseño 100 Años', codigo: 'DC', imagen: '' },
        { id: '3', nombre: 'Diseño Naciones', codigo: 'DN', imagen: '' }
      ];

      // 4. Productos
      const productosData = [
        {
          nombre: 'Camisa Sublimada Centenario',
          descripcion: 'Camisa de alta calidad con diseños exclusivos del centenario.',
          categoria_id: catIds['Camisas sublimadas'],
          imagen: 'https://picsum.photos/seed/camisa1/600/600',
          disenos: [
            { nombre: 'Frente simple - Árbol', codigo: 'C1DA', imagen: 'C1DA' },
            { nombre: 'Frente simple - 100 Años', codigo: 'C1DC', imagen: 'C1DC' },
            { nombre: 'Frente simple - Naciones', codigo: 'C1DN', imagen: 'C1DN' },
            { nombre: 'Frente y espalda - Árbol', codigo: 'C2DA', imagen: 'C2DA' },
            { nombre: 'Frente y espalda - 100 Años', codigo: 'C2DC', imagen: 'C2DC' },
            { nombre: 'Frente y espalda - Naciones', codigo: 'C2DN', imagen: 'C2DN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: 'Única', precio: 260 }]
        },
        {
          nombre: 'Taza Sublimada 11oz',
          descripcion: 'Taza de cerámica de 11oz con diseño del centenario.',
          categoria_id: catIds['Tazas sublimadas 11oz'],
          imagen: 'https://picsum.photos/seed/taza1/600/600',
          disenos: [
            { nombre: 'Diseño Árbol', codigo: '1TDA', imagen: '1TDA' },
            { nombre: 'Diseño 100 Años', codigo: '1TDC', imagen: '1TDC' },
            { nombre: 'Diseño Naciones', codigo: '1TDN', imagen: '1TDN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: 'Única', precio: 150 }]
        },
        {
          nombre: 'Termo de acero 500ml',
          descripcion: 'Termo de acero inoxidable.',
          categoria_id: catIds['Termos de acero 500ml'],
          imagen: 'https://picsum.photos/seed/termo500/600/600',
          disenos: [
            { nombre: 'Diseño Árbol', codigo: '2TCDA', imagen: '2TCDA' },
            { nombre: 'Diseño 100 Años', codigo: '2TCDC', imagen: '2TCDC' },
            { nombre: 'Diseño Naciones', codigo: '2TCDN', imagen: '2TCDN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: '500ml', precio: 450 }]
        },
        {
          nombre: 'Termo de aluminio 600ml',
          descripcion: 'Termo ligero de aluminio.',
          categoria_id: catIds['Termos de aluminio 600ml'],
          imagen: 'https://picsum.photos/seed/termo600/600/600',
          disenos: [
            { nombre: 'Diseño Árbol', codigo: '3TADA', imagen: '3TADA' },
            { nombre: 'Diseño 100 Años', codigo: '3TADC', imagen: '3TADC' },
            { nombre: 'Diseño Naciones', codigo: '3TADN', imagen: '3TADN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: '600ml', precio: 240 }]
        },
        {
          nombre: 'Llaveros',
          descripcion: 'Llavero metálico conmemorativo.',
          categoria_id: catIds['Llaveros'],
          imagen: 'https://picsum.photos/seed/llavero1/600/600',
          disenos: [
            { nombre: 'Diseño Árbol', codigo: 'LL2DA', imagen: 'LL2DA' },
            { nombre: 'Diseño 100 Años', codigo: 'LL2DC', imagen: 'LL2DC' },
            { nombre: 'Diseño Naciones', codigo: 'LL2DN', imagen: 'LL2DN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: 'Única', precio: 120 }]
        },
        {
          nombre: 'Gorras',
          descripcion: 'Gorra tipo trucker.',
          categoria_id: catIds['Gorras'],
          imagen: 'https://picsum.photos/seed/gorra1/600/600',
          disenos: [
            { nombre: 'Diseño Árbol', codigo: 'G1DA', imagen: 'G1DA' },
            { nombre: 'Diseño 100 Años', codigo: 'G1DC', imagen: 'G1DC' },
            { nombre: 'Diseño Naciones', codigo: 'G1DN', imagen: 'G1DN' }
          ],
          precios: [{ descripcion: 'Estándar', talla: 'Única', precio: 180 }]
        },
        {
          nombre: 'Láminas de aluminio 21x29',
          descripcion: 'Lámina de aluminio sublimada.',
          categoria_id: catIds['Láminas de aluminio 21x29'],
          imagen: 'https://picsum.photos/seed/lamina1/600/600',
          disenos: [
            { nombre: 'Retrato Apóstol Naasón Joaquín', codigo: 'R1NJG', imagen: 'R1NJG' },
            { nombre: 'Retrato Apóstol Samuel Joaquín', codigo: 'R1SJF', imagen: 'R1SJF' },
            { nombre: 'Retrato Apóstol Aarón Joaquín', codigo: 'R1AJG', imagen: 'R1AJG' }
          ],
          precios: [{ descripcion: 'Estándar', talla: '21x29 cm', precio: 300 }]
        },
        {
          nombre: 'Papel Fotográfico',
          descripcion: 'Impresión en papel fotográfico.',
          categoria_id: catIds['Papel fotográfico'],
          imagen: 'https://picsum.photos/seed/papel1/600/600',
          disenos: [
            { nombre: 'Fotografía Apóstol Naasón Joaquín', codigo: 'F1NJG', imagen: 'F1NJG' },
            { nombre: 'Fotografía Apóstol Samuel Joaquín', codigo: 'F1SJF', imagen: 'F1SJF' },
            { nombre: 'Fotografía Apóstol Aarón Joaquín', codigo: 'F1AJG', imagen: 'F1AJG' }
          ],
          precios: [{ descripcion: 'Estándar', talla: 'Varios', precio: 100 }]
        }
      ];

      for (const prod of productosData) {
        try {
          await addDoc(collection(db, 'productos'), prod);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'productos');
        }
      }

      fetchData();
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catSnap, prodSnap, colSnap, pedSnap, userSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'categorias')),
        getDocs(collection(db, 'productos')),
        getDocs(collection(db, 'colecciones')),
        getDocs(query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'users')),
        getDocFromServer(doc(db, 'settings', 'contacto'))
      ]);

      setCategorias(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Categoria)));
      setProductos(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Producto)));
      setColecciones(colSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coleccion)));
      setPedidos(pedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Pedido)));
      setUsers(userSnap.docs.map(d => ({ id: d.id, email: d.data().email, role: d.data().role })));
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as any);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, collectionName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar este elemento?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        fetchData();
      } catch (error) {
        console.error('Error deleting document', error);
        alert('Error al eliminar. Verifica tus permisos.');
      }
    }
  };

  const handleEditClick = (producto: Producto) => {
    setNewProduct({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria_id: producto.categoria_id,
      imagen: producto.imagen || ''
    });
    setEditingId(producto.id);
    setSelectedDisenos(producto.disenos || []);
    setProductPrecios(producto.precios || []);
    setProductImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = newProduct.imagen;
      if (productImageFile) {
        imageUrl = await handleImageUpload(productImageFile, 'productos');
      }

      const productData = {
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        categoria_id: newProduct.categoria_id,
        imagen: imageUrl,
        disenos: selectedDisenos,
        precios: productPrecios
      };

      if (editingId) {
        await updateDoc(doc(db, 'productos', editingId), productData);
      } else {
        await addDoc(collection(db, 'productos'), productData);
      }
      
      setIsModalOpen(false);
      setNewProduct({ nombre: '', descripcion: '', categoria_id: '', imagen: '' });
      setProductImageFile(null);
      setEditingId(null);
      setSelectedDisenos([]);
      setProductPrecios([]);
      fetchData();
    } catch (error) {
      console.error('Error saving product', error);
      alert('Error al guardar el producto.');
    }
  };

  const handleEditCategory = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setCategoryImageFile(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      let imageUrl = editingCategory.imagen;
      if (categoryImageFile) {
        imageUrl = await handleImageUpload(categoryImageFile, 'categorias');
      }

      const catData = {
        nombre: editingCategory.nombre,
        coleccion_id: editingCategory.coleccion_id,
        imagen: imageUrl
      };

      if (!editingCategory.id) {
        await addDoc(collection(db, 'categorias'), catData);
      } else {
        await updateDoc(doc(db, 'categorias', editingCategory.id), catData);
      }

      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryImageFile(null);
      fetchData();
    } catch (error) {
      console.error('Error saving category', error);
      alert('Error al guardar la categoría.');
    }
  };

  const handleEditColeccion = (coleccion: Coleccion) => {
    setEditingColeccion(coleccion);
    setColeccionImageFile(null);
    setIsColeccionModalOpen(true);
  };

  const handleSaveColeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetCol = editingColeccion || newColeccion;
      let imageUrl = targetCol.imagen;
      if (coleccionImageFile) {
        imageUrl = await handleImageUpload(coleccionImageFile, 'colecciones');
      }

      const colData = {
        nombre: targetCol.nombre,
        descripcion: targetCol.descripcion || '',
        codigo_acceso: targetCol.codigo_acceso || '',
        imagen: imageUrl,
        activa: targetCol.activa
      };

      if (editingColeccion && editingColeccion.id) {
        await updateDoc(doc(db, 'colecciones', editingColeccion.id), colData);
      } else {
        await addDoc(collection(db, 'colecciones'), colData);
      }

      setIsColeccionModalOpen(false);
      setEditingColeccion(null);
      setNewColeccion({ nombre: '', descripcion: '', codigo_acceso: '', imagen: '', activa: true });
      setColeccionImageFile(null);
      fetchData();
    } catch (error) {
      console.error('Error saving collection', error);
      alert('Error al guardar la colección.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    try {
      // Nota: Esto solo autoriza el correo en Firestore. 
      // El usuario aún debe crear su cuenta con ese correo (o tú crearla en la consola).
      await addDoc(collection(db, 'users'), {
        email: newUserEmail.toLowerCase(),
        role: 'admin'
      });
      setNewUserEmail('');
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding user', error);
      alert('Error al autorizar usuario.');
    }
  };
  const updatePedidoEstado = async (id: string, estado: 'pendiente' | 'completado' | 'cancelado') => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado });
      fetchData();
    } catch (err) {
      console.error('Error updating pedido', err);
      alert('Error al actualizar el pedido.');
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-stone-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Acceso Administrador</h1>
          <p className="text-stone-500 mt-2">Ingresa tus credenciales para continuar</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
              placeholder="admin@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {loginError}
            </div>
          )}
          
          <button 
            type="submit"
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-400">
            Si no tienes cuenta, contacta al administrador principal.
          </p>
        </div>
      </motion.div>
    );
  }

  if (globalError) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl m-4">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error en la Aplicación</h2>
        <p className="text-red-600 mb-4 whitespace-pre-wrap">{globalError.message}</p>
        <button 
          onClick={() => setGlobalError(null)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Panel de Administración</h1>
          <p className="text-stone-500 mt-2">Gestiona los pedidos, productos, categorías y colecciones.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-stone-500">{auth.currentUser?.email}</span>
            <button 
              onClick={() => alert(`UID: ${auth.currentUser?.uid}\nEmail: ${auth.currentUser?.email}`)}
              className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider underline"
            >
              Ver Info Usuario
            </button>
          </div>
          {importError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 max-w-xs">
              Error: {importError}
            </div>
          )}
          {productos.length === 0 && categorias.length === 0 && (
            <button 
              onClick={handleImportInitialData}
              disabled={importing}
              className={`${importing ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors`}
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                'Importar Datos Iniciales'
              )}
            </button>
          )}
          {activeTab === 'productos' && (
            <button 
              onClick={() => {
                setEditingId(null);
                setNewProduct({ nombre: '', descripcion: '', categoria_id: '', imagen: '' });
                setSelectedDisenos([]);
                setProductPrecios([]);
                setProductImageFile(null);
                setIsModalOpen(true);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="text-stone-500 hover:text-red-600 transition-colors flex items-center gap-1"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-stone-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'pedidos' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('productos')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'productos' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'categorias' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('colecciones')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'colecciones' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Colecciones
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'usuarios' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Administradores
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'configuracion' 
              ? 'border-b-2 border-gold-500 text-gold-600' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Configuración
        </button>
      </div>

      {activeTab === 'pedidos' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Detalle</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                    {pedido.createdAt?.toDate ? pedido.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-stone-900">{pedido.cliente_nombre}</div>
                    <div className="text-sm text-stone-500">{pedido.cliente_telefono}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-stone-900 font-medium">{pedido.cantidad}x {pedido.producto_nombre}</div>
                    <div className="text-xs text-stone-500">
                      {pedido.diseno_nombre && <div>Diseño: {pedido.diseno_nombre}</div>}
                      {pedido.opcion_descripcion && <div>Opción: {pedido.opcion_descripcion}</div>}
                      {pedido.talla && <div>Talla: {pedido.talla}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    C${pedido.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pedido.estado === 'completado' ? 'bg-green-100 text-green-800' : 
                      pedido.estado === 'cancelado' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {pedido.estado === 'pendiente' && (
                      <>
                        <button onClick={() => updatePedidoEstado(pedido.id, 'completado')} className="text-green-600 hover:text-green-900 mr-3" title="Marcar Completado">
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button onClick={() => updatePedidoEstado(pedido.id, 'cancelado')} className="text-red-600 hover:text-red-900 mr-3" title="Cancelar Pedido">
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {pedido.estado !== 'pendiente' && (
                      <button onClick={() => updatePedidoEstado(pedido.id, 'pendiente')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Marcar Pendiente">
                        <Clock className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(pedido.id, 'pedidos')} className="text-stone-400 hover:text-red-600" title="Eliminar">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {pedidos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-stone-500">No hay pedidos registrados.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-stone-100 rounded-md overflow-hidden flex items-center justify-center">
                        {producto.imagen ? (
                          <img className="h-10 w-10 object-cover" src={getImageUrl(producto.imagen)} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-stone-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-stone-900">{producto.nombre}</div>
                        <div className="text-sm text-stone-500 truncate max-w-xs">{producto.descripcion}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">
                      {categorias.find(c => c.id === producto.categoria_id)?.nombre || 'Desconocida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditClick(producto)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(producto.id, 'productos')} className="text-red-600 hover:text-red-900 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {productos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500">No hay productos para mostrar.</p>
          </div>
        )}
      </div>
      )}

      {activeTab === 'categorias' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex justify-end p-4 border-b border-stone-200">
            <button 
              onClick={() => {
                setEditingCategory({ id: '', nombre: '', imagen: '', coleccion_id: colecciones[0]?.id || '' });
                setCategoryImageFile(null);
                setIsCategoryModalOpen(true);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24 bg-stone-100 rounded-md overflow-hidden flex items-center justify-center">
                          {categoria.imagen ? (
                            <img className="h-full w-full object-cover" src={getImageUrl(categoria.imagen)} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-stone-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-stone-900">{categoria.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditCategory(categoria)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(categoria.id, 'categorias')} className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {categorias.length === 0 && (
            <div className="text-center py-12">
              <p className="text-stone-500">No hay categorías para mostrar.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'colecciones' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex justify-end p-4 border-b border-stone-200">
            <button 
              onClick={() => {
                setEditingColeccion(null);
                setNewColeccion({ nombre: '', descripcion: '', codigo_acceso: '', imagen: '', activa: true });
                setColeccionImageFile(null);
                setIsColeccionModalOpen(true);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Colección
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Colección</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Acceso</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {colecciones.map((coleccion) => (
                  <tr key={coleccion.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24 bg-stone-100 rounded-md overflow-hidden flex items-center justify-center">
                          {coleccion.imagen ? (
                            <img className="h-full w-full object-cover" src={getImageUrl(coleccion.imagen)} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-stone-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-stone-900">{coleccion.nombre}</div>
                          <div className="text-sm text-stone-500 truncate max-w-xs">{coleccion.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coleccion.activa ? 'bg-gold-100 text-gold-800' : 'bg-stone-100 text-stone-800'}`}>
                        {coleccion.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coleccion.codigo_acceso ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {coleccion.codigo_acceso ? 'Con Código' : 'Público'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditColeccion(coleccion)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(coleccion.id, 'colecciones')} className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {colecciones.length === 0 && (
            <div className="text-center py-12">
              <p className="text-stone-500">No hay colecciones para mostrar.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50">
            <h3 className="font-semibold text-stone-900">Administradores Autorizados</h3>
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Autorizar Correo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Correo Electrónico</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Rol</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {/* Super Admin Hardcoded */}
                <tr className="bg-gold-50/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    hmalldm95@gmail.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gold-100 text-gold-800">
                      Super Admin (Sistema)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-stone-400 italic">
                    Protegido
                  </td>
                </tr>
                {users.filter(u => u.email !== 'hmalldm95@gmail.com').map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(user.id, 'users')} className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-6">Configuración de Contacto</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
              <input type="text" value={settings.telefono} onChange={e => setSettings({...settings, telefono: e.target.value})} className="w-full px-3 py-2 border border-stone-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cuenta Bancaria</label>
              <input type="text" value={settings.banco} onChange={e => setSettings({...settings, banco: e.target.value})} className="w-full px-3 py-2 border border-stone-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Redes Sociales</label>
              <input type="text" value={settings.redes} onChange={e => setSettings({...settings, redes: e.target.value})} className="w-full px-3 py-2 border border-stone-300 rounded-lg" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="visible" checked={settings.visible} onChange={e => setSettings({...settings, visible: e.target.checked})} className="h-4 w-4 text-emerald-600 border-stone-300 rounded" />
              <label htmlFor="visible" className="ml-2 block text-sm text-stone-900">Hacer visible en la página principal</label>
            </div>
            <button 
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'settings', 'contacto'), settings);
                  alert('Configuración guardada');
                } catch (e) {
                  await addDoc(collection(db, 'settings'), { ...settings, id: 'contacto' });
                  alert('Configuración guardada');
                }
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-stone-900">Autorizar Administrador</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <p className="text-sm text-stone-500">
                Ingresa el correo de la persona que deseas autorizar. Esa persona deberá crear su cuenta con este mismo correo para poder acceder.
              </p>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium">Autorizar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-stone-900">
                {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.nombre}
                  onChange={e => setNewProduct({...newProduct, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Descripción</label>
                <textarea 
                  required
                  rows={3}
                  value={newProduct.descripcion}
                  onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoría</label>
                <select 
                  required
                  value={newProduct.categoria_id}
                  onChange={e => setNewProduct({...newProduct, categoria_id: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Imagen del Producto</label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setProductImageFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <div className="text-center text-stone-500 text-sm font-medium">O usar URL:</div>
                  <input 
                    type="text" 
                    value={newProduct.imagen}
                    onChange={e => setNewProduct({...newProduct, imagen: e.target.value})}
                    placeholder="URL de la imagen"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={!!productImageFile}
                  />
                </div>
              </div>

              {/* Opciones y Precios */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-stone-700">Opciones y Precios</label>
                  <button 
                    type="button"
                    onClick={() => setProductPrecios([...productPrecios, { descripcion: '', talla: '', precio: 0 }])}
                    className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar Opción
                  </button>
                </div>
                <div className="space-y-2">
                  {productPrecios.map((precio, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input 
                        type="text" 
                        placeholder="Descripción"
                        value={precio.descripcion}
                        onChange={e => {
                          const newPrecios = [...productPrecios];
                          newPrecios[index].descripcion = e.target.value;
                          setProductPrecios(newPrecios);
                        }}
                        className="flex-1 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Tallas"
                        value={precio.talla}
                        onChange={e => {
                          const newPrecios = [...productPrecios];
                          newPrecios[index].talla = e.target.value;
                          setProductPrecios(newPrecios);
                        }}
                        className="w-32 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <input 
                        type="number" 
                        placeholder="Precio"
                        value={precio.precio === 0 ? '' : precio.precio}
                        onChange={e => {
                          const newPrecios = [...productPrecios];
                          newPrecios[index].precio = parseFloat(e.target.value) || 0;
                          setProductPrecios(newPrecios);
                        }}
                        className="w-24 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newPrecios = [...productPrecios];
                          newPrecios.splice(index, 1);
                          setProductPrecios(newPrecios);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {productPrecios.length === 0 && (
                    <p className="text-sm text-stone-500 italic">No hay opciones de precio configuradas.</p>
                  )}
                </div>
              </div>

              {/* Diseños */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-stone-700">Diseños / Retratos</label>
                  <button 
                    type="button"
                    onClick={() => setSelectedDisenos([...selectedDisenos, { id: Date.now().toString(), nombre: '', codigo: '', imagen: '' }])}
                    className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar Diseño
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedDisenos.map((diseno, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input 
                        type="text" 
                        placeholder="Nombre"
                        value={diseno.nombre}
                        onChange={e => {
                          const newDisenos = [...selectedDisenos];
                          newDisenos[index].nombre = e.target.value;
                          setSelectedDisenos(newDisenos);
                        }}
                        className="flex-1 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Código"
                        value={diseno.codigo}
                        onChange={e => {
                          const newDisenos = [...selectedDisenos];
                          newDisenos[index].codigo = e.target.value;
                          setSelectedDisenos(newDisenos);
                        }}
                        className="w-24 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="URL Imagen"
                        value={diseno.imagen}
                        onChange={e => {
                          const newDisenos = [...selectedDisenos];
                          newDisenos[index].imagen = e.target.value;
                          setSelectedDisenos(newDisenos);
                        }}
                        className="flex-1 px-2 py-1.5 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newDisenos = [...selectedDisenos];
                          newDisenos.splice(index, 1);
                          setSelectedDisenos(newDisenos);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {selectedDisenos.length === 0 && (
                    <p className="text-sm text-stone-500 italic">No hay diseños configurados.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
                  {editingId ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-stone-900">
                {!editingCategory.id ? 'Nueva Categoría' : `Editar Categoría`}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={editingCategory.nombre}
                  onChange={e => setEditingCategory({...editingCategory, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Colección</label>
                <select 
                  value={editingCategory.coleccion_id || ''}
                  onChange={e => setEditingCategory({...editingCategory, coleccion_id: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona una colección</option>
                  {colecciones.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Imagen de Categoría</label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setCategoryImageFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <div className="text-center text-stone-500 text-sm font-medium">O usar URL:</div>
                  <input 
                    type="text" 
                    value={editingCategory.imagen || ''}
                    onChange={e => setEditingCategory({...editingCategory, imagen: e.target.value})}
                    placeholder="URL"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={!!categoryImageFile}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isColeccionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-stone-900">
                {editingColeccion ? 'Editar Colección' : 'Nueva Colección'}
              </h3>
              <button onClick={() => setIsColeccionModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveColeccion} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={editingColeccion ? editingColeccion.nombre : newColeccion.nombre}
                  onChange={e => editingColeccion 
                    ? setEditingColeccion({...editingColeccion, nombre: e.target.value})
                    : setNewColeccion({...newColeccion, nombre: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Descripción</label>
                <textarea 
                  rows={2}
                  value={editingColeccion ? (editingColeccion.descripcion || '') : newColeccion.descripcion}
                  onChange={e => editingColeccion 
                    ? setEditingColeccion({...editingColeccion, descripcion: e.target.value})
                    : setNewColeccion({...newColeccion, descripcion: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Código de Acceso (Opcional)</label>
                <input 
                  type="text" 
                  value={editingColeccion ? (editingColeccion.codigo_acceso || '') : newColeccion.codigo_acceso}
                  onChange={e => editingColeccion 
                    ? setEditingColeccion({...editingColeccion, codigo_acceso: e.target.value})
                    : setNewColeccion({...newColeccion, codigo_acceso: e.target.value})
                  }
                  placeholder="Dejar vacío para acceso público"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="activa"
                  checked={editingColeccion ? editingColeccion.activa : newColeccion.activa}
                  onChange={e => editingColeccion 
                    ? setEditingColeccion({...editingColeccion, activa: e.target.checked})
                    : setNewColeccion({...newColeccion, activa: e.target.checked})
                  }
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-stone-300 rounded"
                />
                <label htmlFor="activa" className="ml-2 block text-sm text-stone-900">
                  Colección Activa
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Imagen de Portada</label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setColeccionImageFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <div className="text-center text-stone-500 text-sm font-medium">O usar URL:</div>
                  <input 
                    type="text" 
                    value={editingColeccion ? editingColeccion.imagen : newColeccion.imagen}
                    onChange={e => editingColeccion 
                      ? setEditingColeccion({...editingColeccion, imagen: e.target.value})
                      : setNewColeccion({...newColeccion, imagen: e.target.value})
                    }
                    placeholder="URL de la imagen"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={!!coleccionImageFile}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsColeccionModalOpen(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Coleccion from './pages/Coleccion';
import Category from './pages/Category';
import Product from './pages/Product';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="coleccion/:id" element={<Coleccion />} />
          <Route path="categoria/:id" element={<Category />} />
          <Route path="producto/:id" element={<Product />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}

import React from 'react';
import { useProducts } from '../hooks/useProducts';

export default function ProductList() {
  const { products, loading } = useProducts();

  if (loading) return <div>Chargement...</div>;

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          {product.name} - {product.price} €
        </li>
      ))}
    </ul>
  );
}

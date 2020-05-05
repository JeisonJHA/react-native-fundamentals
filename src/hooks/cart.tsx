import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarktplace:cart');
      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementedProduct = products.map(product => {
        if (product.id === id) {
          const prod = { ...product, quantity: product.quantity + 1 };
          return prod;
        }
        return product;
      });
      setProducts(incrementedProduct);
      await AsyncStorage.setItem(
        '@GoMarktplace:cart',
        JSON.stringify(incrementedProduct),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const hasProduct = products.find(prod => prod.id === product.id);
      if (hasProduct) {
        increment(product.id);
        return;
      }
      setProducts(state => [...state, { ...product, quantity: 1 }]);
      await AsyncStorage.setItem(
        '@GoMarktplace:cart',
        JSON.stringify([...products, { ...product, quantity: 1 }]),
      );
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const decrementedProduct = products
        .map(product => {
          if (product.id === id) {
            const prod = { ...product, quantity: product.quantity - 1 };
            return prod;
          }
          return product;
        })
        .filter(product => product.quantity > 0);
      setProducts(decrementedProduct);
      await AsyncStorage.setItem(
        '@GoMarktplace:cart',
        JSON.stringify(decrementedProduct),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

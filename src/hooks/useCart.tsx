import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const CART_STORAGE_KEY = '@RocketShoes:cart';

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const cartUpdated = [...cart];
      const productExistInCart = cartUpdated.find(product => product.id === productId);

      const stockAmount = await api.get(`stock/${productId}`).then(response => response.data.amount);

      const currentAmount = productExistInCart ? productExistInCart.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExistInCart) {
        productExistInCart.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`)
        
        const newProduct = { ...product.data, amount: 1 }; 
        cartUpdated.push(newProduct);
      }
      setCart(cartUpdated);

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartUpdated));

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      let cartUpdated = [...cart];
      const productExistInCart = cartUpdated.find(product => product.id === productId);
      
      if(productExistInCart) {
        cartUpdated = cartUpdated.filter(product => product.id !== productId );
      } else {
        throw Error()
      }

      setCart(cartUpdated);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartUpdated));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount <= 0) {
        return
      }

      const cartUpdated = [...cart]; 
      const productExists = cartUpdated.find(product => product.id === productId);

      const stockAmount = await api.get(`stock/${productId}`).then(resp => resp.data.amount);

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productExists) {
        productExists.amount = amount
        setCart(cartUpdated)
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartUpdated));
      } else {
        throw Error();
      }


    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

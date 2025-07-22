import { cartService } from '../services/cartService';
import { localStorageService } from '../services/localStorageService';
import type { CartResponse } from '../types';
import React, { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface CartContextType {
	cartData: CartResponse;
	cartCount: number;
	loading: boolean;
	refreshCart: () => Promise<void>;
	clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export { CartContext };

interface CartProviderProps {
	children: ReactNode;
}

const emptyCart: CartResponse = {
	items: [],
	summary: {
		grandTotal: 0,
		totalItems: 0,
		totalTypes: 0,
		totalQuantity: 0,
		subtotal: 0,
		total: 0,
		tax: 0,
		discount: 0,
		shipping: 0,
	},
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
	const [cartData, setCartData] = useState<CartResponse>(emptyCart);
	const [loading, setLoading] = useState(false);

	// Tính toán cartCount từ cartData
	const cartCount = cartData.items.reduce(
		(total, item) => total + item.quantity,
		0,
	);

	// Load cart từ localStorage khi khởi tạo
	useEffect(() => {
		const savedCart = localStorageService.getCart();
		if (savedCart) {
			setCartData(savedCart);
		}
	}, []);

	// Function để refresh cart từ API và lưu vào localStorage
	const refreshCart = async (): Promise<void> => {
		setLoading(true);
		try {
			const freshCartData = await cartService.getMyCart();
			setCartData(freshCartData);
			localStorageService.setCart(freshCartData);
		} catch (error) {
			console.error('Error refreshing cart:', error);
			// Nếu có lỗi, giữ nguyên cart hiện tại hoặc set về empty
			const savedCart = localStorageService.getCart();
			if (savedCart) {
				setCartData(savedCart);
			} else {
				setCartData(emptyCart);
			}
		} finally {
			setLoading(false);
		}
	};

	// Function để clear cart
	const clearCart = (): void => {
		setCartData(emptyCart);
		localStorageService.clearCart();
	};

	const value = {
		cartData,
		cartCount,
		loading,
		refreshCart,
		clearCart,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};


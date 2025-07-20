import type { CartResponse } from '../types';

const CART_STORAGE_KEY = 'rose_shop_cart';

export const localStorageService = {
	// Get cart data from localStorage
	getCart: (): CartResponse | null => {
		try {
			const cartData = localStorage.getItem(CART_STORAGE_KEY);
			return cartData ? JSON.parse(cartData) : null;
		} catch (error) {
			console.error('Error parsing cart data from localStorage:', error);
			return null;
		}
	},

	// Save cart data to localStorage
	setCart: (cartData: CartResponse): void => {
		try {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
		} catch (error) {
			console.error('Error saving cart data to localStorage:', error);
		}
	},

	// Clear cart data from localStorage
	clearCart: (): void => {
		try {
			localStorage.removeItem(CART_STORAGE_KEY);
		} catch (error) {
			console.error('Error clearing cart data from localStorage:', error);
		}
	},

	// Get cart count from localStorage
	getCartCount: (): number => {
		try {
			const cartData = localStorageService.getCart();
			if (!cartData || !cartData.items) return 0;

			return cartData.items.reduce((total, item) => total + item.quantity, 0);
		} catch (error) {
			console.error('Error getting cart count from localStorage:', error);
			return 0;
		}
	},
};


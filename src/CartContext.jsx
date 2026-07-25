import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('hnk_cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever cartItems changes
    useEffect(() => {
        try {
            localStorage.setItem('hnk_cart', JSON.stringify(cartItems));
        } catch {
            // ignore storage errors
        }
    }, [cartItems]);

    const addToCart = useCallback((game) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.steam_appid === game.steam_appid);
            if (existing) {
                return prev.map(item =>
                    item.steam_appid === game.steam_appid
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prev, { ...game, qty: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((steam_appid) => {
        setCartItems(prev => prev.filter(item => item.steam_appid !== steam_appid));
    }, []);

    const updateQty = useCallback((steam_appid, delta) => {
        setCartItems(prev =>
            prev.map(item =>
                item.steam_appid === steam_appid
                    ? { ...item, qty: Math.max(1, item.qty + delta) }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const totalCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
        const price = item.Price?.US?.final || 0;
        return sum + (price / 100) * item.qty;
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            totalCount,
            totalPrice,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}

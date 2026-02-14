import { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useRecordSale } from '../hooks/useSales';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface CartItem {
    product: Product;
    quantity: number;
}

export function POSPage() {
    const { data: products, isLoading } = useProducts();
    const { mutate: recordSale, isPending: isProcessing } = useRecordSale();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    const filteredProducts = products?.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.current_stock > 0
    );

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.current_stock) return prev;
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.product.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item;
                    if (newQty > item.product.current_stock) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const cartTotal = cart.reduce(
        (sum, item) => sum + item.product.unit_selling_price * item.quantity,
        0
    );

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const saleItems = cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.unit_selling_price,
        }));

        recordSale(
            { items: saleItems, total: cartTotal },
            {
                onSuccess: () => {
                    setCart([]);
                    // Ideally show a success toast here
                    alert('Sale recorded successfully!');
                },
                onError: (error) => {
                    alert('Failed to record sale: ' + error.message);
                },
            }
        );
    };

    return (
        <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-4 bg-white border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 md:pb-0">
                        {isLoading ? (
                            <div className="col-span-full text-center py-10 text-gray-400">Loading products...</div>
                        ) : filteredProducts?.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-gray-400">No products found</div>
                        ) : (
                            filteredProducts?.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start text-left hover:border-blue-500 transition-colors active:scale-95 duration-100"
                                >
                                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                                    <p className="text-blue-600 font-bold mb-2">R{product.unit_selling_price}</p>
                                    <p className="text-xs text-gray-400 mt-auto">{product.current_stock} in stock</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-[40vh] md:h-full shadow-xl md:shadow-none z-40 fixed bottom-14 left-0 md:static">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Current Sale
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                        {cart.length} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence>
                        {cart.map((item) => (
                            <motion.div
                                key={item.product.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                                    <p className="text-sm text-gray-500">R{item.product.unit_selling_price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, -1)}
                                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, 1)}
                                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="p-1 ml-1 rounded-full bg-red-50 hover:bg-red-100 text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Cart is empty. Tap products to add them.
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total</span>
                        <span className="text-2xl font-bold text-gray-900">R{cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isProcessing}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95",
                            cart.length === 0 || isProcessing
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                        )}
                    >
                        {isProcessing ? 'Processing...' : `Checkout (R${cartTotal.toFixed(2)})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

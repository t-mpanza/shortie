import { useState } from 'react';
import { Search, Trash2, Plus, Minus, X } from 'lucide-react';
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
    const [isCartOpen, setIsCartOpen] = useState(false);

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

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
                    setIsCartOpen(false);
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
        <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col bg-gray-50 relative overflow-hidden">
            {/* 1. Header & Search */}
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* 2. Product Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="col-span-full text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <span className="text-gray-400 font-medium">Loading inventory...</span>
                        </div>
                    ) : filteredProducts?.length === 0 ? (
                        <div className="col-span-full text-center py-20 flex flex-col items-center">
                            <Search className="w-12 h-12 text-gray-300 mb-2" />
                            <span className="text-gray-400 font-medium">No products found</span>
                        </div>
                    ) : (
                        filteredProducts?.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start text-left hover:border-blue-500/50 hover:shadow-md transition-all active:scale-[0.98] duration-100 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 leading-snug">{product.name}</h3>
                                <p className="text-blue-600 font-extrabold text-lg">R{product.unit_selling_price}</p>
                                <p className="text-xs text-gray-400 mt-auto font-medium">{product.current_stock} in stock</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Bottom Sticky Bar (Cart Summary) */}
            <AnimatePresence>
                {cart.length > 0 && !isCartOpen && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-[70px] md:bottom-6 left-0 right-0 p-4 z-20 pointer-events-none"
                    >
                        <div className="max-w-2xl mx-auto pointer-events-auto">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {cartItemCount}
                                    </div>
                                    <span className="font-bold text-lg">View Cart</span>
                                </div>
                                <span className="font-bold text-xl">R{cartTotal.toFixed(2)}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Cart Drawer (Bottom Sheet) */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col md:max-w-2xl md:mx-auto md:bottom-4 md:rounded-3xl"
                        >
                            {/* Handle Bar (Visual cue for dragging) */}
                            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsCartOpen(false)}>
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900">Current Sale</h2>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{item.product.name}</h4>
                                            <p className="text-gray-500 font-medium">R{item.product.unit_selling_price} each</p>
                                        </div>

                                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 active:scale-95 transition-transform"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-6 text-center font-bold text-lg">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 active:scale-95 transition-transform"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50 pb-8 md:pb-4 rounded-b-3xl">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <span className="text-gray-500 font-bold text-lg">Total Amount</span>
                                    <span className="text-3xl font-extrabold text-gray-900">R{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCart([])}
                                        className="px-6 py-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className={clsx(
                                            "flex-1 py-4 rounded-xl font-bold text-xl text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                                            isProcessing
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                        )}
                                    >
                                        {isProcessing ? 'Processing...' : 'Checkout & Pay'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

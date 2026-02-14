import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Plus, Minus, Search } from 'lucide-react';
import { useEditSale, useDeleteSale } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import clsx from 'clsx';

interface EditSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
}

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export function EditSaleModal({ isOpen, onClose, sale }: EditSaleModalProps) {
    const editSale = useEditSale();
    const deleteSale = useDeleteSale();
    const { data: products } = useProducts();

    // POS State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    // Initialize cart from sale data
    useEffect(() => {
        if (sale && isOpen) {
            const initialCart = sale.items.map((item: any) => ({
                productId: item.product_id,
                name: item.product_name,
                price: item.unit_price,
                quantity: item.quantity
            }));
            setCart(initialCart);
            setSearchTerm('');
            setShowProductSearch(false);
        }
    }, [sale, isOpen]);

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products || [];
        return (products || []).filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const addToCart = (product: any) => {
        setCart(current => {
            const existing = current.find(item => item.productId === product.id);
            if (existing) {
                return current.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...current, {
                productId: product.id,
                name: product.name,
                price: product.unit_selling_price,
                quantity: 1
            }];
        });
        setSearchTerm('');
        setShowProductSearch(false);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(current => current.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleSave = () => {
        if (cart.length === 0) {
            if (window.confirm('Cart is empty. Void this sale?')) {
                handleDelete();
            }
            return;
        }

        editSale.mutate({
            saleId: sale.id,
            originalItems: sale.items,
            newItems: cart,
            newTotal: total
        }, {
            onSuccess: () => onClose()
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to VOID this sale? Stock will be restored.')) {
            deleteSale.mutate(sale, {
                onSuccess: () => onClose()
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && sale && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900">Edit Sale #{sale.id.slice(0, 6)}</h2>
                                    <p className="text-xs text-gray-500">Modify items and quantities</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {/* Left: Cart Items */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">In Cart</label>
                                        <button
                                            onClick={() => setShowProductSearch(!showProductSearch)}
                                            className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline md:hidden"
                                        >
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>

                                    {cart.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                            Cart is empty
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div key={item.productId} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-500">R{item.price} each</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, -1)}
                                                            className="p-1 hover:bg-white rounded-md transition-colors shadow-sm"
                                                        >
                                                            <Minus className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, 1)}
                                                            className="p-1 hover:bg-white rounded-md transition-colors shadow-sm"
                                                        >
                                                            <Plus className="w-3 h-3 text-gray-600" />
                                                        </button>
                                                    </div>
                                                    <p className="font-bold text-gray-900 w-16 text-right">
                                                        R{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Right (Desktop) / Overlay (Mobile): Product Search */}
                                <div className={clsx(
                                    "md:w-72 border-l border-gray-100 bg-gray-50 flex flex-col",
                                    "md:relative absolute inset-0 md:inset-auto z-10 md:z-auto transition-transform duration-300 md:transform-none",
                                    showProductSearch ? "translate-x-0" : "translate-x-full md:translate-x-0"
                                )}>
                                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="relative w-full">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus={showProductSearch}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowProductSearch(false)}
                                            className="ml-2 md:hidden text-gray-500"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {filteredProducts.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className="w-full text-left p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-gray-900 group-hover:text-blue-700 text-sm">{product.name}</p>
                                                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md">R{product.unit_selling_price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Stock: {product.current_stock}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500 font-medium">New Total</span>
                                    <span className="text-2xl font-bold text-gray-900">R{total.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleteSale.isPending || editSale.isPending}
                                        className="flex-1 text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Void
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={editSale.isPending || deleteSale.isPending}
                                        className="flex-[2] bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editSale.isPending ? 'Saving...' : 'Update Sale'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

import { useEffect } from 'react';
import { Package, ShoppingBag, X } from 'lucide-react';
import { useRestock } from '../hooks/useProducts';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

interface RestockFormData {
    productId: string;
    batchesPurchased: number;
    costPerBatch: number;
    notes: string;
}

export function RestockModal({ isOpen, onClose, products }: RestockModalProps) {
    const { register, handleSubmit, watch, setValue, reset } = useForm<RestockFormData>();
    const { mutate: restock, isPending } = useRestock();

    const selectedProductId = watch('productId');
    const batchesPurchased = watch('batchesPurchased');
    const costPerBatch = watch('costPerBatch');

    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Auto-fill cost when product is selected
    useEffect(() => {
        if (selectedProduct) {
            setValue('costPerBatch', selectedProduct.cost_per_batch);
        }
    }, [selectedProduct, setValue]);

    const totalCost = (batchesPurchased && costPerBatch)
        ? Number(batchesPurchased) * Number(costPerBatch)
        : 0;

    const unitsAdded = (selectedProduct && batchesPurchased)
        ? selectedProduct.units_per_batch * Number(batchesPurchased)
        : 0;

    const onSubmit = (data: RestockFormData) => {
        if (!selectedProduct) return;

        restock({
            productId: data.productId,
            batches: Number(data.batchesPurchased),
            costPerBatch: Number(data.costPerBatch),
            totalCost,
            unitsAdded,
            notes: data.notes
        }, {
            onSuccess: () => {
                reset();
                onClose();
            }
        });
    };

    console.log('RestockModal rendered with products:', products?.length, products);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[60] p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="font-bold text-lg text-gray-900">Restock Inventory</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                                    <div className="relative">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <select
                                            {...register('productId', { required: true })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-900"
                                        >
                                            <option value="">Choose a product...</option>
                                            {products.length === 0 && <option disabled>No products found</option>}
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} (Current: {product.current_stock})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {selectedProduct && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Units per batch:</span>
                                            <span className="font-medium text-gray-900">{selectedProduct.units_per_batch}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Batches</label>
                                        <div className="relative">
                                            <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="number"
                                                min="1"
                                                {...register('batchesPurchased', { required: true, min: 1 })}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="Qty"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost / Batch</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('costPerBatch', { required: true, min: 0 })}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {selectedProduct && batchesPurchased && (
                                    <div className="text-xs text-gray-500 text-right">
                                        Adding {unitsAdded} units total
                                    </div>
                                )}

                                {totalCost > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                                        <span className="text-lg font-bold text-green-600">R{totalCost.toFixed(2)}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        {...register('notes')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        rows={2}
                                        placeholder="Supplier info, etc."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isPending || !selectedProduct}
                                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPending ? 'Restocking...' : 'Confirm Restock'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

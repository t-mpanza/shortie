import { useEffect, useState } from 'react';
import { X, Minus, Plus, ChevronDown } from 'lucide-react';
import { useRestock } from '../hooks/useProducts';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

type RestockMode = 'batches' | 'units';

export function RestockModal({ isOpen, onClose, products }: RestockModalProps) {
    const { mutate: restock, isPending } = useRestock();

    const [selectedProductId, setSelectedProductId] = useState('');
    const [mode, setMode] = useState<RestockMode>('units');
    const [quantity, setQuantity] = useState(1);
    const [totalCost, setTotalCost] = useState('');
    const [notes, setNotes] = useState('');

    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedProductId('');
            setMode('units');
            setQuantity(1);
            setTotalCost('');
            setNotes('');
        }
    }, [isOpen]);

    // Auto-fill cost estimate when product or quantity changes
    useEffect(() => {
        if (!selectedProduct) return;
        if (mode === 'batches') {
            setTotalCost((quantity * selectedProduct.cost_per_batch).toFixed(2));
        } else {
            const costPerUnit = selectedProduct.cost_per_batch / selectedProduct.units_per_batch;
            setTotalCost((quantity * costPerUnit).toFixed(2));
        }
    }, [selectedProduct, quantity, mode]);

    const unitsAdded = selectedProduct
        ? mode === 'batches'
            ? quantity * selectedProduct.units_per_batch
            : quantity
        : 0;

    const batchesForRecord = selectedProduct
        ? mode === 'batches'
            ? quantity
            : Math.ceil(quantity / selectedProduct.units_per_batch)
        : 0;

    const costPerBatchForRecord = selectedProduct
        ? batchesForRecord > 0
            ? parseFloat(totalCost || '0') / batchesForRecord
            : 0
        : 0;

    const handleSubmit = () => {
        if (!selectedProduct || quantity < 1) return;

        restock({
            productId: selectedProduct.id,
            batches: batchesForRecord,
            costPerBatch: costPerBatchForRecord,
            totalCost: parseFloat(totalCost || '0'),
            unitsAdded,
            notes: notes || undefined,
        }, {
            onSuccess: () => onClose(),
        });
    };

    const adjustQuantity = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-[60]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col md:max-w-lg md:mx-auto md:bottom-4 md:rounded-3xl"
                    >
                        {/* Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-3 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Restock</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
                            {/* Product Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product</label>
                                <div className="relative">
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            setSelectedProductId(e.target.value);
                                            setQuantity(1);
                                        }}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select a product...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — {p.current_stock} in stock
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {selectedProduct && (
                                <>
                                    {/* Mode Toggle */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add by</label>
                                        <div className="flex bg-gray-100 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => { setMode('units'); setQuantity(1); }}
                                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                                    mode === 'units'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                Exact Units
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setMode('batches'); setQuantity(1); }}
                                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                                    mode === 'batches'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                By Batches
                                            </button>
                                        </div>
                                        {mode === 'batches' && (
                                            <p className="text-xs text-gray-400 mt-1.5 text-center">
                                                1 batch = {selectedProduct.units_per_batch} units
                                            </p>
                                        )}
                                    </div>

                                    {/* Quantity Stepper */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            {mode === 'units' ? 'Units to add' : 'Batches to add'}
                                        </label>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => adjustQuantity(-1)}
                                                disabled={quantity <= 1}
                                                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Minus className="w-5 h-5" />
                                            </button>

                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-24 text-center text-3xl font-bold text-gray-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => adjustQuantity(1)}
                                                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Quick-add buttons */}
                                        <div className="flex justify-center gap-2 mt-3">
                                            {(mode === 'units'
                                                ? [5, 10, 25, 50, 100]
                                                : [1, 2, 5, 10]
                                            ).map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setQuantity(val)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                        quantity === val
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Units being added</span>
                                            <span className="text-lg font-bold text-gray-900">+{unitsAdded}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Stock after restock</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {selectedProduct.current_stock + unitsAdded}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3">
                                            <label className="block text-sm text-gray-500 mb-1.5">Total cost paid</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={totalCost}
                                                    onChange={(e) => setTotalCost(e.target.value)}
                                                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes (optional)</label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="e.g. Supplier name, order #"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="px-5 pb-6 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !selectedProduct || quantity < 1}
                                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {isPending
                                    ? 'Adding stock...'
                                    : selectedProduct
                                        ? `Add ${unitsAdded} unit${unitsAdded !== 1 ? 's' : ''} to ${selectedProduct.name}`
                                        : 'Select a product'
                                }
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

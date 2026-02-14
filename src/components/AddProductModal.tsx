import { useForm } from 'react-hook-form';
import { useAddProduct } from '../hooks/useProducts';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProductFormData {
    name: string;
    description: string;
    unit_selling_price: number;
    cost_per_batch: number;
    units_per_batch: number;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>();
    const { mutate: addProduct, isPending } = useAddProduct();

    const onSubmit = (data: ProductFormData) => {
        addProduct(
            {
                ...data,
                description: data.description || null,
                // Ensure numbers are numbers
                unit_selling_price: Number(data.unit_selling_price),
                cost_per_batch: Number(data.cost_per_batch),
                units_per_batch: Number(data.units_per_batch),
            },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="font-bold text-lg text-gray-900">Add New Product</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input
                                        {...register('name', { required: 'Name is required' })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. Chips"
                                    />
                                    {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <textarea
                                        {...register('description')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Size, flavor, etc."
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Unit)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('unit_selling_price', { required: 'Price is required', min: 0 })}
                                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (Per Batch)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('cost_per_batch', { required: 'Cost is required', min: 0 })}
                                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Units per Batch</label>
                                    <input
                                        type="number"
                                        {...register('units_per_batch', { required: 'Units is required', min: 1 })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 24"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">How many items are in a box/case?</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPending ? 'Adding Product...' : 'Save Product'}
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

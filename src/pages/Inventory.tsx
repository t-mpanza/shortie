import { useState } from 'react';
import { Plus, Search, Edit2, PackagePlus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { motion } from 'framer-motion';
import { AddProductModal } from '../components/AddProductModal';
import { RestockModal } from '../components/RestockModal';
import { EditProduct } from '../components/EditProduct';
import { Product } from '../types';

export function InventoryPage() {
    const { data: products, isLoading } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const filteredProducts = products?.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-gray-500">Manage your stock levels and prices.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsRestockModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <PackagePlus className="w-5 h-5" />
                        Restock
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts?.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                                <button
                                    onClick={() => setEditingProduct(product)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {product.description || 'No description available'}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div>
                                <span className="block text-xs text-gray-400 uppercase tracking-wider">Price</span>
                                <span className="font-bold text-gray-900">R{product.unit_selling_price}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-400 uppercase tracking-wider">Stock</span>
                                <span className={`font-bold ${product.current_stock < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                    {product.current_stock} units
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredProducts?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    No products found matching "{searchTerm}"
                </div>
            )}

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
            <RestockModal
                isOpen={isRestockModalOpen}
                onClose={() => setIsRestockModalOpen(false)}
                products={products || []}
            />
            {editingProduct && (
                <EditProduct
                    product={editingProduct}
                    onSuccess={() => setEditingProduct(null)}
                    onCancel={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
}

import { useRecentSales } from '../hooks/useSales';
import { History, Search, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { EditSaleModal } from '../components/EditSaleModal';

export function TransactionsPage() {
    const { data: sales, isLoading } = useRecentSales();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
    }

    const handleSaleClick = (sale: any) => {
        setSelectedSale(sale);
        setIsEditModalOpen(true);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-gray-500">View and manage past sales.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {sales?.map((sale) => (
                        <div
                            key={sale.id}
                            onClick={() => handleSaleClick(sale)}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <History className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">R{sale.total_amount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(sale.sale_date).toLocaleDateString('en-ZA', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        Completed
                                    </span>
                                    <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </div>
                            <div className="pl-12">
                                <p className="text-sm text-gray-600">
                                    {sale.items.map((item: any) => `${item.quantity}x ${item.product_name}`).join(', ')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {sales?.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            No transactions found.
                        </div>
                    )}
                </div>
            </div>

            <EditSaleModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                sale={selectedSale}
            />
        </div>
    );
}


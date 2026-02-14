import { motion } from 'framer-motion';
import { TrendingUp, Package, DollarSign, ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProductMetrics } from '../hooks/useProducts';
import { useRecentSales } from '../hooks/useSales';


export function DashboardPage() {
    const { data: metrics, isLoading: metricsLoading } = useProductMetrics();
    const { data: recentSales, isLoading: salesLoading } = useRecentSales();

    const totalRevenue = metrics?.reduce((sum, p) => sum + p.total_revenue, 0) || 0;
    const totalProfit = metrics?.reduce((sum, p) => sum + p.profit, 0) || 0;
    const totalProducts = metrics?.length || 0;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (metricsLoading || salesLoading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back to your stall overview.</p>
                </div>
                <Link
                    to="/pos"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Sale
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Revenue
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">R{totalRevenue.toFixed(2)}</h3>
                    <p className="text-sm text-gray-500 mt-1">Total earnings</p>
                </motion.div>

                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            Profit
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">R{totalProfit.toFixed(2)}</h3>
                    <p className="text-sm text-gray-500 mt-1">Net profit</p>
                </motion.div>

                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Inventory
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
                    <p className="text-sm text-gray-500 mt-1">Active products</p>
                </motion.div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentSales?.map((sale) => (
                        <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {sale.items.length > 0
                                            ? sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')
                                            : 'Unknown Items'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(sale.sale_date).toLocaleDateString('en-ZA', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                            <span className="font-bold text-gray-900">R{sale.total_amount}</span>
                        </div>
                    ))}
                    {recentSales?.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No sales recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

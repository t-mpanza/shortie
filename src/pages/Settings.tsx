import { useState } from 'react';
import { Download, Trash2, AlertTriangle, FileSpreadsheet, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { downloadCSV } from '../utils/export';
import { useResetSales } from '../hooks/useSales';
import { useResetInventory } from '../hooks/useProducts';

export function SettingsPage() {
    const [exporting, setExporting] = useState(false);

    const { mutate: resetSales, isPending: isResettingSales } = useResetSales();
    const { mutate: resetInventory, isPending: isResettingInventory } = useResetInventory();

    const handleExportInventory = async () => {
        try {
            setExporting(true);
            const { data, error } = await supabase
                .from('products')
                .select('name, description, unit_selling_price, cost_per_batch, units_per_batch, current_stock, total_units_sold');

            if (error) throw error;

            const formattedData = data.map(item => ({
                Name: item.name,
                Description: item.description,
                'Selling Price': item.unit_selling_price,
                'Cost (Batch)': item.cost_per_batch,
                'Units (Batch)': item.units_per_batch,
                'Current Stock': item.current_stock,
                'Total Sold': item.total_units_sold
            }));

            downloadCSV(formattedData, `shortie_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export inventory.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportSales = async () => {
        try {
            setExporting(true);
            // Fetch flattened sales data
            const { data, error } = await supabase
                .from('sale_items')
                .select(`
                    quantity,
                    unit_price,
                    subtotal,
                    created_at,
                    products (name),
                    sales (id, total_amount, created_at)
                `);

            if (error) throw error;

            const formattedData = (data as any[]).map(item => ({
                'Sale Date': new Date(item.sales.created_at).toLocaleString(),
                'Product': item.products?.name || 'Unknown',
                'Quantity': item.quantity,
                'Unit Price': item.unit_price,
                'Subtotal': item.subtotal,
                'Order Total': item.sales.total_amount,
                'Sale ID': item.sales.id
            }));

            downloadCSV(formattedData, `shortie_sales_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export sales history.');
        } finally {
            setExporting(false);
        }
    };

    const handleResetSales = () => {
        if (window.confirm('ARE YOU SURE? This will delete ALL sales history. This action cannot be undone.')) {
            resetSales(undefined, {
                onSuccess: () => alert('Sales history has been cleared.')
            });
        }
    };

    const handleResetInventory = () => {
        if (window.confirm('ARE YOU SURE? This will delete ALL products and inventory counts. This action cannot be undone.')) {
            resetInventory(undefined, {
                onSuccess: () => alert('Inventory has been cleared.')
            });
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your data and application preferences.</p>
            </div>

            {/* Data Management Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        Data Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Export your data for external analysis.</p>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-4">
                    <button
                        onClick={handleExportInventory}
                        disabled={exporting}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-gray-900">Export Inventory</div>
                                <div className="text-xs text-gray-500">Download .csv file</div>
                            </div>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </button>

                    <button
                        onClick={handleExportSales}
                        disabled={exporting}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-gray-900">Export Sales</div>
                                <div className="text-xs text-gray-500">Download .csv file</div>
                            </div>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
                <div className="p-6 border-b border-red-100">
                    <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Danger Zone
                    </h2>
                    <p className="text-red-700 text-sm mt-1">Irreversible actions. Tread carefully.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100">
                        <div>
                            <div className="font-semibold text-red-900">Clear Sales History</div>
                            <div className="text-xs text-red-600">Deletes all recorded transactions. Keeps products.</div>
                        </div>
                        <button
                            onClick={handleResetSales}
                            disabled={isResettingSales}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isResettingSales ? 'Clearing...' : 'Clear History'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100">
                        <div>
                            <div className="font-semibold text-red-900">Factory Reset</div>
                            <div className="text-xs text-red-600">Deletes ALL products and sales. Complete wipe.</div>
                        </div>
                        <button
                            onClick={handleResetInventory}
                            disabled={isResettingInventory}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isResettingInventory ? 'Resetting...' : 'Delete Everything'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

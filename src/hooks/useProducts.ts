import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as Product[];
        },
    });
}

export function useProductMetrics() {
    return useQuery({
        queryKey: ['product_metrics'],
        queryFn: async () => {
            // Fetch products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('*');
            if (productsError) throw productsError;

            // Fetch sales items for revenue
            const { data: saleItems, error: salesError } = await supabase
                .from('sale_items')
                .select('product_id, subtotal, quantity');
            if (salesError) throw salesError;

            // Fetch stock purchases for costs
            const { data: purchases, error: purchasesError } = await supabase
                .from('stock_purchases')
                .select('product_id, total_cost');
            if (purchasesError) throw purchasesError;

            // Calculate metrics
            const metrics = products.map(product => {
                const productSales = saleItems.filter(item => item.product_id === product.id);
                const productPurchases = purchases.filter(item => item.product_id === product.id);

                const revenue = productSales.reduce((sum, item) => sum + item.subtotal, 0);

                const totalCost = productPurchases.reduce((sum, item) => sum + item.total_cost, 0);

                return {
                    ...product,
                    total_revenue: revenue,
                    total_cost: totalCost,
                    profit: revenue - totalCost,
                    profit_margin: revenue > 0 ? ((revenue - totalCost) / revenue) * 100 : 0
                };
            });

            return metrics;
        }
    });
}

export function useAddProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'total_units_sold' | 'current_stock'>) => {
            const { data, error } = await supabase
                .from('products')
                .insert([{ ...newProduct, current_stock: 0, total_units_sold: 0 }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useRestock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            productId,
            batches,
            costPerBatch,
            totalCost,
            unitsAdded,
            notes
        }: {
            productId: string;
            batches: number;
            costPerBatch: number;
            totalCost: number;
            unitsAdded: number;
            notes?: string;
        }) => {
            const { error } = await supabase.from('stock_purchases').insert([{
                product_id: productId,
                batches_purchased: batches,
                cost_per_batch: costPerBatch,
                total_cost: totalCost,
                units_added: unitsAdded,
                notes: notes || null,
            }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Partial<Product> & { id: string }) => {
            const { error } = await supabase
                .from('products')
                .update(product)
                .eq('id', product.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

export function useResetInventory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('products')
                .delete()
                .neq('id', '0'); // Delete all

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

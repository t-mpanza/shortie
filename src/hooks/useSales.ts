import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';


export function useRecentSales() {
    return useQuery({
        queryKey: ['recent_sales'],
        queryFn: async () => {
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('id, sale_date, total_amount')
                .order('sale_date', { ascending: false })
                .limit(20); // Increased limit for better history view

            if (salesError) throw salesError;

            const salesWithItems = await Promise.all(
                sales.map(async (sale) => {
                    const { data, error: itemsError } = await supabase
                        .from('sale_items')
                        .select('quantity, unit_price, product_id, product:products(name)')
                        .eq('sale_id', sale.id);

                    const items = data as any[];

                    if (itemsError) throw itemsError;

                    return {
                        ...sale,
                        items: items.map(item => ({
                            product_id: item.product_id,
                            product_name: Array.isArray(item.product) ? item.product[0]?.name : item.product?.name || 'Unknown',
                            quantity: item.quantity,
                            unit_price: item.unit_price
                        }))
                    };
                })
            );

            return salesWithItems;
        }
    });
}

export function useRecordSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ items, total }: { items: { productId: string; quantity: number; price: number }[], total: number }) => {
            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{ total_amount: total }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items
            const saleItems = items.map(item => ({
                sale_id: sale.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.quantity * item.price
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) throw itemsError;

            return sale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recent_sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changes
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        }
    });
}

export function useUpdateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, total_amount }: { id: string; total_amount: number }) => {
            const { error } = await supabase
                .from('sales')
                .update({ total_amount })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recent_sales'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

export function useDeleteSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sale: { id: string; items: { product_id: string; quantity: number }[] }) => {
            // 1. Restore Stock
            await Promise.all(sale.items.map(async (item) => {
                // Get current stock
                const { data: product } = await supabase
                    .from('products')
                    .select('current_stock, total_units_sold')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({
                            current_stock: product.current_stock + item.quantity,
                            total_units_sold: Math.max(0, product.total_units_sold - item.quantity)
                        })
                        .eq('id', item.product_id);
                }
            }));

            // 2. Delete Sale Items (Cascade usually handles this, but robust to do explicitly if needed. 
            // However, Supabase/Postgres cascade delete on foreign key is standard. 
            // Assuming we relied on cascade or need to delete manually. 
            // Let's delete items first to be safe.)
            const { error: itemsError } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', sale.id);

            if (itemsError) throw itemsError;

            // 3. Delete Sale
            const { error: saleError } = await supabase
                .from('sales')
                .delete()
                .eq('id', sale.id);

            if (saleError) throw saleError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recent_sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

export function useEditSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            saleId,
            originalItems,
            newItems,
            newTotal
        }: {
            saleId: string;
            originalItems: any[];
            newItems: { productId: string; quantity: number; price: number }[];
            newTotal: number
        }) => {
            // 1. Restore Stock for ORIGINAL items
            await Promise.all(originalItems.map(async (item) => {
                const { data: product } = await supabase
                    .from('products')
                    .select('current_stock, total_units_sold')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({
                            current_stock: product.current_stock + item.quantity,
                            total_units_sold: Math.max(0, product.total_units_sold - item.quantity)
                        })
                        .eq('id', item.product_id);
                }
            }));

            // 2. Clear old sale items
            const { error: deleteError } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', saleId);

            if (deleteError) throw deleteError;

            // 3. Update Sale Total
            const { error: updateError } = await supabase
                .from('sales')
                .update({ total_amount: newTotal })
                .eq('id', saleId);

            if (updateError) throw updateError;

            // 4. Insert NEW sale items
            const saleItems = newItems.map(item => ({
                sale_id: saleId,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.quantity * item.price
            }));

            const { error: insertError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (insertError) throw insertError;

            // 5. Deduct Stock for NEW items
            await Promise.all(newItems.map(async (item) => {
                const { data: product } = await supabase
                    .from('products')
                    .select('current_stock, total_units_sold')
                    .eq('id', item.productId)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({
                            current_stock: product.current_stock - item.quantity,
                            total_units_sold: product.total_units_sold + item.quantity
                        })
                        .eq('id', item.productId);
                }
            }));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recent_sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

export function useResetSales() {
    const queryClient = useQueryClient();
    // ...

    return useMutation({
        mutationFn: async () => {
            // Delete all sale items first (foreign key constraint)
            const { error: itemsError } = await supabase
                .from('sale_items')
                .delete()
                .neq('id', '0'); // Delete all

            if (itemsError) throw itemsError;

            // Then delete all sales
            const { error: salesError } = await supabase
                .from('sales')
                .delete()
                .neq('id', '0'); // Delete all

            if (salesError) throw salesError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recent_sales'] });
            queryClient.invalidateQueries({ queryKey: ['product_metrics'] });
        },
    });
}

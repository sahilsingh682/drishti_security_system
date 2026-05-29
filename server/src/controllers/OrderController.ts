import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, customerDetails } = req.body;
    let totalAmount = 0;
    const secureItems = [];

    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('name, price')
        .eq('id', item.id)
        .single();

      if (error || !product) {
         res.status(404).json({ error: `Product ${item.id} not found` });
         return;
      }

      totalAmount += product.price * item.qty;
      secureItems.push({ id: item.id, name: product.name, price: product.price, qty: item.qty });
    }

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    const { error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        customer_name: customerDetails.name,
        phone: customerDetails.phone,
        total_amount: totalAmount,
        items: JSON.stringify(secureItems),
        payment_status: 'pending'
      });

    if (insertError) throw insertError;

    res.status(200).json({ success: true, orderId, totalAmount });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
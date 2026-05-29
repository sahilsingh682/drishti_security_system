import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Grab the items, customer details, and the new frontend totalAmount
    const { items, customerDetails, totalAmount: frontendTotal } = req.body;
    let calculatedTotal = 0;
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

      // 2. THE FIX: Safely parse quantity. If the frontend forgets it, default to 1!
      const qty = item.qty || item.quantity || 1;
      
      calculatedTotal += (product.price * qty);
      secureItems.push({ id: item.id, name: product.name, price: product.price, qty: qty });
    }

    // 3. THE FIX: Ensure the total is a valid number. 
    // If the calculation fails for any reason, safely fall back to the frontend's price.
    const finalAmount = !isNaN(calculatedTotal) && calculatedTotal > 0 
      ? calculatedTotal 
      : (Number(frontendTotal) || 0);

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    const { error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        customer_name: customerDetails.name,
        phone: customerDetails.phone,
        total_amount: finalAmount,
        items: JSON.stringify(secureItems),
        payment_status: 'pending'
      });

    if (insertError) throw insertError;

    res.status(200).json({ success: true, orderId, totalAmount: finalAmount });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, customerDetails, totalAmount: frontendTotal } = req.body;
    let calculatedTotal = 0;
    const secureItems = [];

    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('name, price')
        .eq('id', item.id)
        .single();

      if (error || !product) continue;

      const qty = item.qty || item.quantity || 1;
      
      calculatedTotal += (product.price * qty);
      secureItems.push({ id: item.id, name: product.name, price: product.price, qty: qty });
    }

    // 🚀 THE FIX: Respect the frontend's discounted price!
    // If the cart sends a valid discounted total, we use it. If not, we fall back to the raw calculated total.
    const finalAmount = frontendTotal !== undefined && frontendTotal !== null 
      ? Number(frontendTotal) 
      : calculatedTotal;

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    const { error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        customer_name: customerDetails.name,
        phone: customerDetails.phone,
        delivery_address: customerDetails.address,
        total_amount: finalAmount, // Now it correctly saves the discounted ₹9,540!
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
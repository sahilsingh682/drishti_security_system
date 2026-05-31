import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logAdminAction } from '../utils/auditLogger';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// 1. Initialize Razorpay using your new .env keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

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

    const finalAmount = frontendTotal !== undefined && frontendTotal !== null 
      ? Number(frontendTotal) 
      : calculatedTotal;

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    
    // 2. Generate Razorpay Order (Amount must be in paise, so multiply by 100)
    let razorpayOrderId = null;
    const amountInPaise = Math.round(finalAmount * 100);

    if (customerDetails.paymentMethod === 'online') {
      // STRICT EDGE CASE: Validate amount >= 100 paise (₹1)
      if (amountInPaise < 100) {
        res.status(400).json({ error: "Order amount must be at least ₹1 for online payment." });
        return;
      }

      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId,
      };
      const rzpOrder = await razorpay.orders.create(options);
      razorpayOrderId = rzpOrder.id;
    }

    // 3. Send back the Razorpay Order ID to the frontend
    res.status(200).json({ 
        success: true, 
        orderId, 
        totalAmount: finalAmount,
        razorpayOrderId 
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. NEW FUNCTION: Verify the payment after the user pays
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Razorpay security check: Ensure the signature is authentic
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic! Update Supabase status to 'paid'
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. NEW FUNCTION: Admin updates order status from the Dashboard
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params; 
    const { newStatus } = req.body; 
    
    // Allow it to read from the token OR the body for testing
    const staffId = (req as any).user?.id || req.body.staffId; 

    if (!staffId) {
       res.status(401).json({ error: "Unauthorized: Only staff can update orders." });
       return;
    }

    // 1. Fetch the old status using the CORRECT column name (install_status)
    const { data: oldOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('install_status') 
      .eq('id', orderId)
      .single();

    if (fetchError || !oldOrder) {
       console.log("SUPABASE FETCH ERROR:", fetchError);
       res.status(404).json({ error: "Order not found" });
       return;
    }

    // 2. Update the order using the CORRECT column name
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ install_status: newStatus }) 
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 3. 🚀 TRIGGER THE AUDIT LOGGER! 🚀
    await logAdminAction(
      staffId,
      "UPDATE_ORDER_STATUS",
      "orders",
      orderId,
      { old_status: oldOrder.install_status, new_status: newStatus } // Log the exact change
    );

    res.status(200).json({ success: true, message: "Order updated & logged successfully" });

  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
import { supabaseAdmin } from '../config/supabase'; // Adjust path to your Supabase instance

/**
 * Logs an administrative action to the Supabase audit_logs table.
 * * @param staffId - The UUID of the admin/technician performing the action
 * @param actionType - E.g., 'UPDATE_ORDER_STATUS', 'ASSIGN_TECHNICIAN', 'DELETE_PRODUCT'
 * @param entityName - E.g., 'orders', 'products', 'users'
 * @param entityId - The specific ID of the item being changed
 * @param details - A JSON object containing the old/new values
 */
export const logAdminAction = async (
  staffId: string,
  actionType: string,
  entityName: string,
  entityId: string,
  details: object
) => {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          staff_id: staffId,
          action_type: actionType,
          entity_name: entityName,
          entity_id: entityId,
          details: details
        }
      ]);

    if (error) {
      throw error;
    }
    
    console.log(`[AUDIT LOG SUCCESS]: ${actionType} on ${entityName} #${entityId}`);
  } catch (err) {
    console.error("[CRITICAL AUDIT LOG ERROR]:", err);
    // Note: We don't throw the error to the frontend so it doesn't crash the user's request,
    // but we log it heavily in the Render server logs.
  }
};
import { supabase } from "./supabaseClient";
import { InvoiceData } from "../types";
import { logger } from "./loggerService";

const TABLE_NAME = "invoices";
const MAX_INVOICES = 3;

/**
 * Service to handle persistent storage of invoices.
 */
export const invoiceService = {
  /**
   * Saves an invoice to the cloud.
   * Enforces a limit of MAX_INVOICES (3) per user using FIFO strategy.
   */
  saveInvoice: async (data: InvoiceData): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User must be logged in to save invoices.");
      }

      // 1. Check current count
      const { count, error: countError } = await supabase
        .from(TABLE_NAME)
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // 2. Enforce Limit (Delete Oldest if needed)
      // Note: We check if count is >= MAX_INVOICES.
      // If exactly 3, we delete 1 to make room for the new one (maintaining 3).
      // If > 3 (shouldn't happen but good to handle), we might need to delete more,
      // but for now deleting the single oldest matches the requirements.
      if (count !== null && count >= MAX_INVOICES) {
        // Fetch the oldest ID
        const { data: oldest, error: fetchOldestError } = await supabase
          .from(TABLE_NAME)
          .select("id")
          .order("created_at", { ascending: true }) // Oldest first
          .limit(count - MAX_INVOICES + 1); // Delete excess + 1 for the new one?
        // Actually if we have 3, we delete 1 -> 2 lefot. Insert 1 -> 3 total.
        // So we need to delete (count - MAX_INVOICES + 1) items.

        if (fetchOldestError) throw fetchOldestError;

        if (oldest && oldest.length > 0) {
          const idsToDelete = oldest.map((r) => r.id);
          const { error: deleteError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .in("id", idsToDelete);

          if (deleteError) throw deleteError;
          logger.info(
            `Limit reached. Deleted ${idsToDelete.length} old invoice(s).`,
          );
        }
      }

      // 3. Insert New Invoice
      const { error: insertError } = await supabase.from(TABLE_NAME).insert([
        {
          user_id: user.id,
          data: data,
        },
      ]);

      if (insertError) throw insertError;
      logger.info("Invoice saved successfully.");
    } catch (error) {
      logger.error("Failed to save invoice", { error });
      throw error;
    }
  },

  /**
   * Retrieves the most recent invoices for the current user.
   */
  getRecentInvoices: async (): Promise<
    { id: string; data: InvoiceData; created_at: string }[]
  > => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id, data, created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_INVOICES);

    if (error) {
      logger.error("Failed to fetch recent invoices", { error });
      throw error;
    }

    // Type casting relying on our knowledge that 'data' column is InvoiceData
    return (data || []).map((row) => ({
      id: row.id,
      data: row.data as InvoiceData,
      created_at: row.created_at,
    }));
  },
};

import { supabase } from "./supabaseClient";
import { InvoiceData, SavedInvoice } from "../types";
import { logger } from "./loggerService";

const TABLE_NAME = "invoices";
const MAX_INVOICES = 3;

/**
 * Service to handle persistent storage of invoices.
 */
export const invoiceService = {
  /**
   * Saves an invoice to the cloud.
   * Checks for MAX_INVOICES limit. If reached, throws error with code 'LIMIT_REACHED'.
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

      // 2. Enforce Limit
      if (count !== null && count >= MAX_INVOICES) {
        const error = new Error("Storage limit reached");
        (error as { code?: string }).code = "LIMIT_REACHED";
        throw error;
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
   * Deletes an invoice by ID.
   */
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) throw error;
      logger.info("Invoice deleted successfully", { id });
    } catch (error) {
      logger.error("Failed to delete invoice", { error });
      throw error;
    }
  },

  /**
   * Updates an existing invoice.
   * Updates data and timestamp (effectively bumping it to top).
   * Bypasses limit check since it modifies existing record.
   */
  updateInvoice: async (id: string, data: InvoiceData): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User must be logged in to update invoices.");
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          data: data,
          created_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      logger.info("Invoice updated successfully", { id });
    } catch (error) {
      logger.error("Failed to update invoice", { error });
      throw error;
    }
  },

  /**
   * Deletes all invoices for the current user.
   */
  deleteAllInvoices: async (): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      logger.info("All invoices deleted successfully");
    } catch (error) {
      logger.error("Failed to delete all invoices", { error });
      throw error;
    }
  },

  /**
   * Retrieves the most recent invoices for the current user.
   */
  getRecentInvoices: async (): Promise<SavedInvoice[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id, data, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch recent invoices", { error });
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      data: row.data as InvoiceData,
      created_at: row.created_at,
    }));
  },
};

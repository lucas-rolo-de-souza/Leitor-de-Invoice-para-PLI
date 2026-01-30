import { useCallback } from "react";
import { InvoiceData, LineItem } from "../types";
import { normalizeToKg, convertFromKg } from "../utils/converters";

/**
 * Hook to manage Invoice Data Logic (Stateless / Controlled).
 *
 * ARCHITECTURE CHANGE (v1.05.00.34):
 * Removed internal state (useState/useEffect) to prevent race conditions.
 * Now acts as a pure logic controller that takes current data and triggers
 * atomic updates via onDataChange.
 */
/**
 * Hook: useInvoiceForm
 *
 * Manages the core business logic for the invoice editor in a "Stateless / Controlled" manner.
 *
 * Responsibilities:
 * 1. **Data Integrity**: Ensures numeric fields are valid and totals are calculated atomically.
 * 2. **Auto-Calculations**: detailed logic for:
 *    - `calculateGlobalTotals`: Subtotal, Net Weight, Grand Total.
 *    - `calculateDueDate`: Parses Payment Term (e.g., "Net 30") to prompt a date.
 *    - `handleLineItemChange`: Cross-calculates Unit Price vs Total, and Unit Weight vs Total Weight.
 * 3. **CRUD Operations**: Add, Duplicate, Remove line items.
 *
 * @param formData - The current state of the invoice data (lifted state).
 * @param onDataChange - Callback to update parent state.
 * @param isReadOnly - If true, blocks all edit operations.
 */
export const useInvoiceForm = (
  formData: InvoiceData,
  onDataChange: (data: InvoiceData) => void,
  isReadOnly: boolean = false,
) => {
  // --- Helper: Centralized Total Calculation ---
  // Calculates global totals (Subtotal, Net Weight, Grand Total) based on current Line Items
  const calculateGlobalTotals = (data: InvoiceData): InvoiceData => {
    const items = data.lineItems || [];

    // Sum Items
    const subtotal = items.reduce((sum, item) => {
      const val =
        typeof item.total === "string" ? parseFloat(item.total) : item.total;
      return sum + (isNaN(Number(val)) ? 0 : Number(val));
    }, 0);

    const totalNetWeightInKiilos = items.reduce((sum, item) => {
      const val = item.netWeight;
      const unit = item.weightUnit || "KG";
      const valInKg = normalizeToKg(val, unit);
      return sum + valInKg;
    }, 0);

    const targetUnit = data.weightUnit || "KG";
    const totalNetWeight = convertFromKg(totalNetWeightInKiilos, targetUnit);

    // Calculate Grand Total
    const freight = Number(data.freight) || 0;
    const insurance = Number(data.insurance) || 0;
    const other = Number(data.otherCharges) || 0;
    const tax = Number(data.tax) || 0;

    const grandTotal = subtotal + freight + insurance + other + tax;

    return {
      ...data,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalNetWeight: parseFloat(totalNetWeight.toFixed(4)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
  };

  // --- Helper: Due Date Calculation ---
  const calculateDueDate = (issueDate: string, term: string): string | null => {
    if (!issueDate || !term) return null;

    const date = new Date(issueDate);
    if (isNaN(date.getTime())) return null; // Invalid date

    const termLower = term.toLowerCase();

    // Immediate / Advance
    if (
      termLower.includes("imediato") ||
      termLower.includes("antecipado") ||
      termLower.includes("cash") ||
      termLower.includes("immediate")
    ) {
      return issueDate; // Same day
    }

    // Net X
    const netMatch = termLower.match(/net\s*(\d+)/);
    if (netMatch && netMatch[1]) {
      const days = parseInt(netMatch[1], 10);
      date.setDate(date.getDate() + days);
      return date.toISOString().split("T")[0];
    }

    return null;
  };

  // --- Field Handlers ---

  const handleChange = useCallback(
    (field: keyof InvoiceData, value: string | number | null) => {
      if (isReadOnly) return;

      let safeValue = value;
      // Enforce non-negative for top-level numeric fields
      if (
        [
          "totalVolumes",
          "totalGrossWeight",
          "totalNetWeight",
          "freight",
          "insurance",
          "otherCharges",
          "tax",
        ].includes(field as string) &&
        typeof value === "string"
      ) {
        if (value.startsWith("-")) {
          safeValue = value.replace(/-/g, "");
        }
      }

      let newData = { ...formData, [field]: safeValue };

      // If changing financial fields, recalculate Grand Total immediately
      if (["freight", "insurance", "tax", "otherCharges"].includes(field)) {
        newData = calculateGlobalTotals(newData);
      }

      // Auto-Calculate Due Date
      if (field === "date" || field === "paymentTerms") {
        const issueDate = field === "date" ? String(value) : newData.date || "";
        const term =
          field === "paymentTerms" ? String(value) : newData.paymentTerms || "";

        const newDueDate = calculateDueDate(issueDate, term);
        if (newDueDate) {
          newData.dueDate = newDueDate;
        }
      }

      onDataChange(newData);
    },
    [formData, isReadOnly, onDataChange],
  );

  const handleLineItemChange = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      if (isReadOnly) return;

      const newItems = [...(formData.lineItems || [])];

      // Enforce non-negative values for specific numeric fields
      let safeValue = value;
      if (
        [
          "quantity",
          "unitPrice",
          "netWeight",
          "unitNetWeight",
          "manufacturerCode", // Usually numeric and positive
        ].includes(field as string) &&
        typeof value === "string"
      ) {
        // Allow empty string to pass through (controlled input)
        // Check if it's a negative number string
        if (value.startsWith("-")) {
          safeValue = value.replace(/-/g, "");
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newItems[index] as any)[field] = safeValue;

      // --- Atomic Item Calculations ---
      const item = newItems[index];

      // Helper to get safe numbers
      const getSafeNumber = (val: string | number | null) => {
        if (val === "" || val === null || val === undefined) return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };

      // 1. Price Total Calculation (Qty * UnitPrice)
      // We recalculate whenever Quantity or Price changes, regardless of validity (fallback to 0)
      if (field === "quantity" || field === "unitPrice") {
        const qty = getSafeNumber(item.quantity);
        const price = getSafeNumber(item.unitPrice);
        newItems[index].total = parseFloat((qty * price).toFixed(2));
      }

      // 2. Weight Total Calculation (Qty * UnitWeight)
      // 2. Weight Total Calculation
      // Priority:
      // A) If Quantity changes -> Update Total Weight (Unit * Qty).
      // B) If Unit Weight changes -> Update Total Weight (Unit * Qty).
      // C) If Total Weight changes -> Update Unit Weight (Total / Qty).

      if (field === "quantity") {
        const qty = getSafeNumber(item.quantity);
        // Priority Change: Keep Total Net Weight constant, recalculate Unit Weight
        // Old: Total = Unit * Qty
        // New: Unit = Total / Qty
        const totalW = getSafeNumber(item.netWeight);
        if (qty > 0) {
          newItems[index].unitNetWeight = parseFloat((totalW / qty).toFixed(6));
        } else {
          newItems[index].unitNetWeight = 0;
        }
      }

      if (field === "unitNetWeight") {
        const qty = getSafeNumber(item.quantity);
        const unitW = getSafeNumber(item.unitNetWeight);
        newItems[index].netWeight = parseFloat((qty * unitW).toFixed(4));
      }

      if (field === "netWeight") {
        const qty = getSafeNumber(item.quantity);
        const totalW = getSafeNumber(item.netWeight);
        if (qty > 0) {
          newItems[index].unitNetWeight = parseFloat((totalW / qty).toFixed(6));
        }
      }

      let newData = { ...formData, lineItems: newItems };

      // --- Global Recalculation ---
      // Update Subtotal/GrandTotal immediately when items change
      // We trigger this for any field that affects totals
      if (
        field === "quantity" ||
        field === "unitPrice" ||
        field === "total" ||
        field === "netWeight" ||
        field === "unitNetWeight" ||
        field === "weightUnit"
      ) {
        newData = calculateGlobalTotals(newData);
      }

      onDataChange(newData);
    },
    [formData, isReadOnly, onDataChange],
  );

  const addLineItem = useCallback(() => {
    if (isReadOnly) return;
    const newItem: LineItem = {
      description: "",
      partNumber: "",
      productCode: "",
      taxClassificationDetail: null,
      quantity: "",
      unitMeasure: "UN",
      unitPrice: "",
      total: "",
      unitNetWeight: "",
      netWeight: "",
      weightUnit: "KG",
      ncm: "",
      manufacturerCode: "",
      material: "",
      manufacturerRef: "",
      manufacturerCountry: "",
      legalAct1Type: "",
      legalAct1Issuer: "",
      legalAct1Number: "",
      legalAct1Year: "",
      legalAct1Ex: "",
      legalAct1Rate: "",
      legalAct2Type: "",
      legalAct2Issuer: "",
      legalAct2Number: "",
      legalAct2Year: "",
      legalAct2Ex: "",
      legalAct2Rate: "",
      complementaryNote: "",
      attr1Level: "",
      attr1Name: "",
      attr1Value: "",
      attr2Level: "",
      attr2Name: "",
      attr2Value: "",
      attr3Level: "",
      attr3Name: "",
      attr3Value: "",
    };

    // Ensure we run calculation even when adding empty item to maintain state consistency
    const newData = calculateGlobalTotals({
      ...formData,
      lineItems: [...(formData.lineItems || []), newItem],
    });

    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const duplicateLineItem = useCallback(
    (index: number) => {
      if (isReadOnly) return;
      const items = formData.lineItems || [];
      if (!items[index]) return;

      // Deep copy using JSON to avoid reference issues
      const itemToCopy = JSON.parse(JSON.stringify(items[index]));

      // Insert after current item
      const newItems = [
        ...items.slice(0, index + 1),
        itemToCopy,
        ...items.slice(index + 1),
      ];

      const newData = calculateGlobalTotals({
        ...formData,
        lineItems: newItems,
      });
      onDataChange(newData);
    },
    [formData, isReadOnly, onDataChange],
  );

  const removeLineItem = useCallback(
    (index: number) => {
      if (isReadOnly) return;
      const newItems = (formData.lineItems || []).filter((_, i) => i !== index);
      const newData = calculateGlobalTotals({
        ...formData,
        lineItems: newItems,
      });
      onDataChange(newData);
    },
    [formData, isReadOnly, onDataChange],
  );

  const copyFieldToItems = useCallback(
    (sourceIndex: number, field: keyof LineItem, targetIndices: number[]) => {
      if (isReadOnly) return;
      const sourceItem = formData.lineItems?.[sourceIndex];
      if (!sourceItem) return;

      const sourceValue = sourceItem[field];

      const newItems = (formData.lineItems || []).map((item, idx) => {
        if (!targetIndices.includes(idx)) return item;
        return { ...item, [field]: sourceValue };
      });

      let newData = { ...formData, lineItems: newItems };

      // If copying weight fields, recalculate totals
      if (
        field === "netWeight" ||
        field === "unitNetWeight" ||
        field === "weightUnit"
      ) {
        newData = calculateGlobalTotals(newData);
      }

      onDataChange(newData);
    },
    [formData, isReadOnly, onDataChange],
  );

  const handleNCMChange = useCallback(
    (index: number, rawValue: string) => {
      if (isReadOnly) return;
      const digits = rawValue.replace(/\D/g, "");
      const limited = digits.slice(0, 8);
      let masked = limited;
      if (limited.length > 4)
        masked = `${limited.slice(0, 4)}.${limited.slice(4)}`;
      if (limited.length > 6)
        masked = `${limited.slice(0, 4)}.${limited.slice(4, 6)}.${limited.slice(
          6,
        )}`;

      handleLineItemChange(index, "ncm", masked);
    },
    [isReadOnly, handleLineItemChange],
  );

  // Derived totals for UI consistency check (Virtual Fields)
  const calculatedTotals = {
    // FORCE CALCULATION FROM ITEMS
    subtotal: (formData.lineItems || []).reduce((sum, item) => {
      const val =
        typeof item.total === "string" ? parseFloat(item.total) : item.total;
      return sum + (isNaN(Number(val)) ? 0 : Number(val));
    }, 0),
    grandTotal: Number(formData.grandTotal) || 0,
    totalQuantity: (formData.lineItems || []).reduce(
      (sum, i) => sum + (Number(i.quantity) || 0),
      0,
    ),
    totalNetWeight: convertFromKg(
      (formData.lineItems || []).reduce((sum, item) => {
        const val = item.netWeight;
        const unit = item.weightUnit || "KG";
        return sum + normalizeToKg(val, unit);
      }, 0),
      formData.weightUnit || "KG",
    ),
  };

  return {
    data: formData, // Pass through the prop data
    handleChange,
    handleLineItemChange,
    handleNCMChange,
    addLineItem,
    duplicateLineItem,
    removeLineItem,
    copyFieldToItems,
    calculatedTotals,
  };
};

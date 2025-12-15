
import { useCallback } from 'react';
import { InvoiceData, LineItem } from '../types';

/**
 * Hook to manage Invoice Data Logic (Stateless / Controlled).
 * 
 * ARCHITECTURE CHANGE (v1.05.00.34):
 * Removed internal state (useState/useEffect) to prevent race conditions.
 * Now acts as a pure logic controller that takes current data and triggers
 * atomic updates via onDataChange.
 */
export const useInvoiceForm = (
  formData: InvoiceData, 
  onDataChange: (data: InvoiceData) => void, 
  isReadOnly: boolean = false
) => {

  // --- Helper: Centralized Total Calculation ---
  // Calculates global totals (Subtotal, Net Weight, Grand Total) based on current Line Items
  const calculateGlobalTotals = (data: InvoiceData): InvoiceData => {
      const items = data.lineItems || [];
      
      // Sum Items
      const subtotal = items.reduce((sum, item) => {
          const val = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
          return sum + (isNaN(Number(val)) ? 0 : Number(val));
      }, 0);

      const totalNetWeight = items.reduce((sum, item) => {
          const val = typeof item.netWeight === 'string' ? parseFloat(item.netWeight) : item.netWeight;
          return sum + (isNaN(Number(val)) ? 0 : Number(val));
      }, 0);
      
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
          grandTotal: parseFloat(grandTotal.toFixed(2))
      };
  };

  // --- Field Handlers ---

  const handleChange = useCallback((field: keyof InvoiceData, value: string | number | null) => {
    if (isReadOnly) return;
    
    let newData = { ...formData, [field]: value };

    // If changing financial fields, recalculate Grand Total immediately
    if (['freight', 'insurance', 'tax', 'otherCharges'].includes(field)) {
        newData = calculateGlobalTotals(newData);
    }

    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const handleLineItemChange = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    if (isReadOnly) return;
    
    const newItems = [...(formData.lineItems || [])];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };

    // --- Atomic Item Calculations ---
    const item = newItems[index];

    // Helper to get safe numbers
    const getSafeNumber = (val: string | number | null) => {
        if (val === '' || val === null || val === undefined) return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };

    // 1. Price Total Calculation (Qty * UnitPrice)
    // We recalculate whenever Quantity or Price changes, regardless of validity (fallback to 0)
    if (field === 'quantity' || field === 'unitPrice') {
        const qty = getSafeNumber(item.quantity);
        const price = getSafeNumber(item.unitPrice);
        newItems[index].total = parseFloat((qty * price).toFixed(2));
    }

    // 2. Weight Total Calculation (Qty * UnitWeight)
    if (field === 'quantity' || field === 'unitNetWeight') {
        const qty = getSafeNumber(item.quantity);
        const unitW = getSafeNumber(item.unitNetWeight);
        if (unitW > 0 || field === 'unitNetWeight') {
             // Only overwrite Net Weight if Unit Weight is set or being edited
             newItems[index].netWeight = parseFloat((qty * unitW).toFixed(4));
        }
    }

    let newData = { ...formData, lineItems: newItems };
    
    // --- Global Recalculation ---
    // Update Subtotal/GrandTotal immediately when items change
    // We trigger this for any field that affects totals
    if (field === 'quantity' || field === 'unitPrice' || field === 'total' || field === 'netWeight' || field === 'unitNetWeight') {
        newData = calculateGlobalTotals(newData);
    }

    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const addLineItem = useCallback(() => {
    if (isReadOnly) return;
    const newItem: LineItem = { 
        description: '', partNumber: '', productCode: '', productDetail: '',
        quantity: '', unitMeasure: 'UN', unitPrice: '', total: '', 
        unitNetWeight: '', netWeight: '', ncm: '',
        manufacturerCode: '', material: '', manufacturerRef: '', manufacturerCountry: '',
        legalAct1Type: '', legalAct1Issuer: '', legalAct1Number: '', legalAct1Year: '', legalAct1Ex: '', legalAct1Rate: '',
        legalAct2Type: '', legalAct2Issuer: '', legalAct2Number: '', legalAct2Year: '', legalAct2Ex: '', legalAct2Rate: '',
        complementaryNote: '',
        attr1Level: '', attr1Name: '', attr1Value: '',
        attr2Level: '', attr2Name: '', attr2Value: '',
        attr3Level: '', attr3Name: '', attr3Value: '',
    };
    
    // Ensure we run calculation even when adding empty item to maintain state consistency
    const newData = calculateGlobalTotals({ 
        ...formData, 
        lineItems: [...(formData.lineItems || []), newItem] 
    });
    
    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const duplicateLineItem = useCallback((index: number) => {
    if (isReadOnly) return;
    const items = formData.lineItems || [];
    if (!items[index]) return;

    // Deep copy using JSON to avoid reference issues
    const itemToCopy = JSON.parse(JSON.stringify(items[index]));
    
    // Insert after current item
    const newItems = [
        ...items.slice(0, index + 1),
        itemToCopy,
        ...items.slice(index + 1)
    ];

    const newData = calculateGlobalTotals({ ...formData, lineItems: newItems });
    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const removeLineItem = useCallback((index: number) => {
    if (isReadOnly) return;
    const newItems = (formData.lineItems || []).filter((_, i) => i !== index);
    const newData = calculateGlobalTotals({ ...formData, lineItems: newItems });
    onDataChange(newData);
  }, [formData, isReadOnly, onDataChange]);

  const handleNCMChange = useCallback((index: number, rawValue: string) => {
    if (isReadOnly) return;
    const digits = rawValue.replace(/\D/g, '');
    const limited = digits.slice(0, 8);
    let masked = limited;
    if (limited.length > 4) masked = `${limited.slice(0, 4)}.${limited.slice(4)}`;
    if (limited.length > 6) masked = `${limited.slice(0, 4)}.${limited.slice(4, 6)}.${limited.slice(6)}`;
    
    handleLineItemChange(index, 'ncm', masked);
  }, [isReadOnly, handleLineItemChange]);

  // Derived totals for UI consistency check (Virtual Fields)
  const calculatedTotals = {
      // FORCE CALCULATION FROM ITEMS
      subtotal: (formData.lineItems || []).reduce((sum, item) => {
          const val = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
          return sum + (isNaN(Number(val)) ? 0 : Number(val));
      }, 0),
      grandTotal: Number(formData.grandTotal) || 0,
      totalQuantity: (formData.lineItems || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
      totalNetWeight: (formData.lineItems || []).reduce((sum, i) => sum + (Number(i.netWeight) || 0), 0)
  };

  return {
    data: formData, // Pass through the prop data
    handleChange,
    handleLineItemChange,
    handleNCMChange,
    addLineItem,
    duplicateLineItem,
    removeLineItem,
    calculatedTotals
  };
};

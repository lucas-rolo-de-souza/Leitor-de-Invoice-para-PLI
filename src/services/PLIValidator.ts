import { InvoiceData } from "../types";

interface PliError {
  line: number;
  messages: string[];
}

/**
 * Validates data against strict PLI Industry Model constraints.
 * Returns a formatted text report if errors are found, or null if valid.
 */
export const validatePliData = (data: InvoiceData): string | null => {
  const items = data.lineItems || [];
  const errors: PliError[] = [];

  const isNumeric = (val: any) => {
    if (val === null || val === undefined || val === "") return false;
    const num = Number(val.toString().replace(",", "."));
    return !isNaN(num);
  };

  items.forEach((item, index) => {
    const rowNum = index + 2; // Excel Row (Header is 1)
    const lineMessages: string[] = [];

    // --- 1. Text Format / Required Checks ---
    // "O campo X deve ser formatado com o tipo: Texto" generally implies the field is missing or empty in this context.

    if (!item.productCode || item.productCode.trim() === "") {
      lineMessages.push(
        "O campo CODIGO_PRODUTO deve ser formatado com o tipo: Texto"
      );
    }

    if (!item.ncm || item.ncm.trim() === "") {
      lineMessages.push(
        "O campo CODIGO_NCM deve ser formatado com o tipo: Texto"
      );
    }

    // Product Detail: Check existence OR Length
    if (
      !item.taxClassificationDetail ||
      item.taxClassificationDetail.trim() === ""
    ) {
      lineMessages.push(
        "O campo DETALHE_PRODUTO deve ser formatado com o tipo: Texto"
      );
    } else if (item.taxClassificationDetail.length > 4) {
      lineMessages.push(
        `O campo DETALHE_PRODUTO excedeu o tamnho máximo permitido. Atual:${item.taxClassificationDetail.length}, Máximo 4.`
      );
    }

    // --- 2. Length Constraints ---

    // DESCRICAO (Max 254)
    if (item.description && item.description.length > 254) {
      lineMessages.push(
        `O campo DESCRICAO excedeu o tamnho máximo permitido. Atual:${item.description.length}, Máximo 254.`
      );
    }

    // CODIGO_PAIS_FABRICANTE_DESCONHECIDO check removed as field is cleared in export

    // --- 3. Numeric Constraints ---

    if (!isNumeric(item.netWeight)) {
      lineMessages.push(
        `É permitido apenas números para o campo: PESO_LIQUIDO`
      );
    }

    if (!isNumeric(item.unitPrice)) {
      lineMessages.push(
        `É permitido apenas números para o campo: VALOR_UNITARIO`
      );
    }

    // Manufacturer Code: Required + Numeric check
    if (!item.manufacturerCode || item.manufacturerCode.trim() === "") {
      lineMessages.push(`O campo CODIGO_FABRICANTE é obrigatorio.`);
    } else if (!isNumeric(item.manufacturerCode)) {
      lineMessages.push(
        `É permitido apenas números para o campo: CODIGO_FABRICANTE`
      );
    }

    // Rate checks removed as fields are cleared in export

    if (lineMessages.length > 0) {
      errors.push({ line: rowNum, messages: lineMessages });
    }
  });

  if (errors.length === 0) return null;

  // Format Output
  return errors
    .map((err) => {
      const msgs = err.messages.map((m) => `     ${m}`).join("\n");
      return `Linha: ${err.line}\n${msgs}`;
    })
    .join("\n\n");
};

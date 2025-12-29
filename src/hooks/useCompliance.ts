
// Version: 1.05.00.39
import { useMemo } from 'react';
import { InvoiceData } from '../types';
import { isFieldInvalid, isValidNCM, isValidReference } from '../utils/validators';
import { INCOTERMS_LIST, PAYMENT_TERMS_LIST, CURRENCIES_LIST, COUNTRIES_LIST } from '../utils/validationConstants';
import { ncmService } from '../services/ncmService';

/**
 * Hook to handle Customs Compliance (Art. 557) logic.
 * Generates field error map and a detailed conformity checklist.
 */
export const useCompliance = (data: InvoiceData) => {
  
  // 1. Field Level Errors (for Input highlighting)
  const fieldErrors = useMemo(() => {
    const errs: Record<string, string | null> = {};

    const check = (field: string, value: any, msg: string = "Campo obrigatório.") => {
        if (isFieldInvalid(value)) errs[field] = msg;
    };

    // Identifiers
    check('invoiceNumber', data.invoiceNumber, "Número da fatura ausente.");
    check('packingListNumber', data.packingListNumber, "Número do PL ausente.");
    check('date', data.date, "Data de emissão obrigatória.");
    check('dueDate', data.dueDate, "Data de vencimento obrigatória.");

    // String based comparison for dates (YYYY-MM-DD) avoids Timezone/UTC instantiation issues
    if (data.date && data.dueDate && !errs.date && !errs.dueDate) {
        if (data.dueDate < data.date) {
            errs.dueDate = "Vencimento anterior à emissão.";
        }
    }

    // Entities
    check('exporterName', data.exporterName, "Nome do exportador não identificado.");
    check('exporterAddress', data.exporterAddress, "Endereço do exportador incompleto.");
    check('importerName', data.importerName, "Nome do importador não identificado.");
    check('importerAddress', data.importerAddress, "Endereço do importador incompleto.");
    
    // Logistics
    check('totalNetWeight', data.totalNetWeight, "Peso líquido total deve ser > 0.");
    check('totalGrossWeight', data.totalGrossWeight, "Peso bruto total deve ser > 0.");
    
    if (!errs.totalNetWeight && !errs.totalGrossWeight) {
        if ((data.totalNetWeight || 0) > (data.totalGrossWeight || 0)) {
            errs.totalNetWeight = "Peso Líquido > Peso Bruto.";
            errs.totalGrossWeight = "Peso Bruto < Peso Líquido.";
        }
    }

    check('totalVolumes', data.totalVolumes, "Quantidade de volumes deve ser > 0.");
    check('volumeType', data.volumeType, "Tipo de volume não informado.");
    
    // Trade & Cross-Field Logic
    check('incoterm', data.incoterm, "Incoterm obrigatório.");
    if (data.incoterm) {
        if (!isValidReference(data.incoterm, INCOTERMS_LIST)) {
            if (isValidReference(data.incoterm, CURRENCIES_LIST)) {
                errs.incoterm = "Parece ser uma Moeda, não Incoterm.";
            } else {
                errs.incoterm = "Incoterm inválido.";
            }
        }
    }

    // Countries
    const checkCountry = (field: string, val: string | null) => {
        check(field, val, "País obrigatório.");
        if (val) {
            if (!isValidReference(val, COUNTRIES_LIST)) {
                 if (isValidReference(val, CURRENCIES_LIST)) {
                     errs[field] = "Parece ser uma Moeda.";
                 } else {
                     errs[field] = "Código/Nome inválido (Use ISO-3166).";
                 }
            }
        }
    }
    checkCountry('countryOfOrigin', data.countryOfOrigin);
    checkCountry('countryOfAcquisition', data.countryOfAcquisition);
    checkCountry('countryOfProvenance', data.countryOfProvenance);

    // Financials
    check('paymentTerms', data.paymentTerms, "Condição de pagamento obrigatória.");
    if (data.paymentTerms) {
        if (!isValidReference(data.paymentTerms, PAYMENT_TERMS_LIST)) {
            errs.paymentTerms = "Condição não padronizada.";
        }
    }

    check('currency', data.currency, "Moeda obrigatória.");
    if (data.currency) {
        if (!isValidReference(data.currency, CURRENCIES_LIST)) {
             if (isValidReference(data.currency, INCOTERMS_LIST)) {
                 errs.currency = "Parece ser um Incoterm.";
             } else {
                 errs.currency = "Código inválido (Use ISO-4217).";
             }
        }
    }

    check('subtotal', data.subtotal, "Subtotal inválido.");
    check('grandTotal', data.grandTotal, "Total geral inválido.");

    return errs;
  }, [data]);

  // 2. Item Level Swapped Field Detection
  const itemIssues = useMemo(() => {
      const issues: string[] = [];
      const items = data.lineItems || [];
      
      items.forEach((item, idx) => {
          if (item.partNumber) {
              const cleanPN = item.partNumber.replace(/\D/g, '');
              if (cleanPN.length === 8 && ncmService.getDescription(cleanPN)) {
                  issues.push(`Item ${idx + 1}: Part Number '${item.partNumber}' parece um NCM válido.`);
              }
          }
          if (item.ncm && /[a-zA-Z]/.test(item.ncm)) {
              issues.push(`Item ${idx + 1}: NCM contém letras, verifique se não houve troca.`);
          }
      });
      return issues;
  }, [data.lineItems]);

  // 3. High Level Checklist
  const checklist = useMemo(() => {
    const items = data.lineItems || [];
    
    const createCheck = (id: string, title: string, isValid: boolean, emptyValue: any, successMsg: string, errorMsg: string, emptyMsg: string, expected: string, details: string) => {
       let status = 'ok';
       let msg = successMsg;
       
       if (!isValid) {
           status = 'invalid';
           msg = errorMsg;
       }
       if (isFieldInvalid(emptyValue)) {
           status = 'missing';
           msg = emptyMsg;
       }

       return { id, title, status, msg, expected, details };
    };

    const allItemsHaveDescription = items.length > 0 && items.every(i => !isFieldInvalid(i.description) && (i.description?.length || 0) <= 254);
    const descStatus = items.length === 0 ? 'missing' : allItemsHaveDescription ? 'ok' : 'invalid';
    const descMsg = allItemsHaveDescription ? "Itens descritos." : items.some(i => (i.description?.length || 0) > 254) ? "Descrição excede 254 caracteres." : "Descrição ausente.";

    // NCM Check
    const validNcms = items.length > 0 && items.every(i => isValidNCM(i.ncm));
    let ncmStatus = 'ok';
    let ncmMsg = "NCMs válidos.";
    if (items.length === 0) { ncmStatus = 'missing'; ncmMsg = "Sem itens."; }
    else if (!validNcms) { ncmStatus = 'invalid'; ncmMsg = "NCM inválido em alguns itens."; }
    
    if (itemIssues.length > 0) {
        ncmStatus = 'warning';
        ncmMsg = "Possível inversão de campos detectada.";
    }

    // STRICT SCUD Validation Check (Mirroring scudValidator.ts)
    const isNumeric = (v: any) => {
       if (v === null || v === undefined || v === '') return false;
       const n = Number(v.toString().replace(',', '.'));
       return !isNaN(n);
    };

    const itemsInvalidScud = items.filter(i => {
        // Required Fields (Type: Text check in validator)
        if (!i.productCode) return true;
        if (!i.ncm) return true;
        if (!i.productDetail) return true;
        
        // Lengths
        if (i.productDetail.length > 4) return true;
        // Manufacturer Country check removed
        if (i.description && i.description.length > 254) return true;

        // Numerics
        if (!isNumeric(i.netWeight)) return true;
        if (!isNumeric(i.unitPrice)) return true;
        
        // Manufacturer (Required + Numeric)
        if (!i.manufacturerCode || !isNumeric(i.manufacturerCode)) return true;
        
        // Rate checks removed

        return false;
    });
    
    let scudStatus = 'ok';
    let scudMsg = "Detalhamento técnico completo.";
    let scudDetails = "OK";

    if (items.length === 0) {
        scudStatus = 'missing';
        scudMsg = "Sem itens para validar.";
        scudDetails = "-";
    } else if (itemsInvalidScud.length > 0) {
        scudStatus = 'invalid';
        scudMsg = `Erros em ${itemsInvalidScud.length} itens (Formato/Tam./Tipo).`;
        
        // Diagnostic hint
        const i = itemsInvalidScud[0];
        const idx = items.indexOf(i) + 1;
        let hint = '';
        
        if (!i.manufacturerCode || !isNumeric(i.manufacturerCode)) hint = 'Cód. Fabr. (Núm)';
        else if (i.productDetail && i.productDetail.length > 4) hint = 'Detalhe > 4 chars';
        else if (!i.productDetail) hint = 'Detalhe ausente';
        else if (!isNumeric(i.netWeight)) hint = 'Peso Líq. (Núm)';
        
        scudDetails = `Verif. Item ${idx}: ${hint}...`;
    }

    return [
      createCheck('exporter', 'I - Exportador', 
        !fieldErrors.exporterName && !fieldErrors.exporterAddress, data.exporterName,
        "Exportador identificado.", "Dados do exportador incompletos.", "Exportador não encontrado.",
        "Nome completo e endereço.", !data.exporterName ? "Nome Ausente" : "OK"),

      createCheck('importer', 'II - Importador',
        !fieldErrors.importerName && !fieldErrors.importerAddress, data.importerName,
        "Importador identificado.", "Dados do importador incompletos.", "Importador não encontrado.",
        "Nome completo e endereço.", !data.importerName ? "Nome Ausente" : "OK"),

      {
        id: 'spec',
        title: 'III - Mercadorias',
        status: descStatus,
        msg: descMsg,
        expected: "Descrição completa (Max 254).",
        details: `${items.length} itens.`
      },

      {
        id: 'ncm',
        title: 'IV - Classificação Fiscal',
        status: ncmStatus,
        msg: ncmMsg,
        expected: "NCM 8 dígitos.",
        details: itemIssues.length > 0 ? itemIssues[0] : "Obrigatório."
      },
      
      {
        id: 'scud_details',
        title: 'IX - Detalhamento Técnico (SCUD)',
        status: scudStatus,
        msg: scudMsg,
        expected: "Campos obrigatórios, numéricos e limites.",
        details: scudDetails
      },

      createCheck('volumes', 'V - Volumes',
        !fieldErrors.totalVolumes && !fieldErrors.volumeType, data.totalVolumes,
        "Volumes OK.", "Erro nos volumes.", "Volumes ausentes.",
        "Qtd e Tipo.", `Qtd: ${data.totalVolumes || '-'}`),

      createCheck('gross_weight', 'VI - Peso Bruto',
        !fieldErrors.totalGrossWeight, data.totalGrossWeight,
        "Peso Bruto OK.", fieldErrors.totalGrossWeight || "Erro.", "Ausente.",
        "PB > 0.", `PB: ${data.totalGrossWeight}`),

      createCheck('net_weight', 'VII - Peso Líquido',
        !fieldErrors.totalNetWeight, data.totalNetWeight,
        "Peso Líquido OK.", fieldErrors.totalNetWeight || "Erro.", "Ausente.",
        "PL > 0.", `PL: ${data.totalNetWeight}`),

      createCheck('origin', 'VIII - País Origem',
        !fieldErrors.countryOfOrigin, data.countryOfOrigin,
        "Origem válida.", fieldErrors.countryOfOrigin || "Inválido.", "Ausente.",
        "ISO 3166-3.", `${data.countryOfOrigin || '-'}`),

      createCheck('payment', 'XIII - Pagamento',
        !fieldErrors.paymentTerms, data.paymentTerms,
        "Condição definida.", fieldErrors.paymentTerms || "Inválido.", "Ausente.",
        "Ex: Net 30, Antecipado.", `${data.paymentTerms || '-'}`),

      createCheck('currency', 'XIII - Moeda',
        !fieldErrors.currency, data.currency,
        "Moeda definida.", fieldErrors.currency || "Inválido.", "Ausente.",
        "ISO 4217 (USD, EUR).", `${data.currency || '-'}`),

      createCheck('incoterm', 'XIV - Incoterm',
        !fieldErrors.incoterm, data.incoterm,
        "Incoterm válido.", fieldErrors.incoterm || "Inválido.", "Ausente.",
        "Sigla válida.", `${data.incoterm || '-'}`),
    ];
  }, [data, fieldErrors, itemIssues]);

  const compliancePercentage = Math.round((checklist.filter(i => i.status === 'ok').length / checklist.length) * 100);

  return { fieldErrors, checklist, compliancePercentage };
};

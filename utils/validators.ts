
// Version: 1.05.00.26
import { InvoiceData } from '../types';
import { ReferenceItem } from './validationConstants';
import { validateNCM } from './ncmValidator';
import { ncmService } from '../services/ncmService';

/**
 * Pure function to check if a generic value is considered 'invalid' (empty/null/NaN).
 */
export const isFieldInvalid = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'number' && isNaN(value)) return true;
  return false;
};

/**
 * Validates Brazilian NCM (Nomenclature Comum do Mercosul).
 */
export const isValidNCM = (ncm: string | null): boolean => {
  const result = validateNCM(ncm);
  if (!result.isValid) return false;

  if (!ncm) return false;
  const clean = ncm.replace(/\D/g, '');

  // Bypass Rule
  if (clean === '99999999') return true;

  // Strict Database Check
  const status = ncmService.getStatus();
  if (status.isReady) {
      return ncmService.getDescription(clean) !== null;
  }

  return true;
};

export const isValidReference = (value: string | null, list: ReferenceItem[]): boolean => {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return list.some(item => 
    item.code.toUpperCase() === normalized || 
    item.name.toUpperCase() === normalized
  );
};

export interface ValidationError {
  field: string;
  message: string;
}

export const generateValidationErrors = (data: InvoiceData, 
  lists: { incoterms: ReferenceItem[], currencies: ReferenceItem[], countries: ReferenceItem[] }
): ValidationError[] => {
  const errors: ValidationError[] = [];

  const check = (field: keyof InvoiceData, msg: string) => {
    // @ts-ignore
    if (isFieldInvalid(data[field])) {
      errors.push({ field: String(field), message: msg });
    }
  };

  // Identifiers
  check('invoiceNumber', 'Número da fatura ausente');
  check('packingListNumber', 'Número do Packing List ausente');
  check('date', 'Data de emissão ausente');
  check('dueDate', 'Data de vencimento ausente');

  if (data.date && data.dueDate) {
    if (new Date(data.dueDate) < new Date(data.date)) {
        errors.push({ field: 'dueDate', message: 'Vencimento anterior à emissão' });
    }
  }
  
  // Entities
  check('exporterName', 'Nome do exportador ausente');
  check('exporterAddress', 'Endereço do exportador ausente');
  check('importerName', 'Nome do importador ausente');
  check('importerAddress', 'Endereço do importador ausente');

  // Trade
  check('incoterm', 'Incoterm ausente');
  if (data.incoterm && !isValidReference(data.incoterm, lists.incoterms)) {
      errors.push({ field: 'incoterm', message: 'Incoterm inválido' });
  }

  check('paymentTerms', 'Condição de pagamento ausente');
  
  check('currency', 'Moeda ausente');
  if (data.currency && !isValidReference(data.currency, lists.currencies)) {
      errors.push({ field: 'currency', message: 'Moeda inválida (Use ISO 4217 ou Nome)' });
  }
  
  // Countries
  const countryFields = ['countryOfOrigin', 'countryOfAcquisition', 'countryOfProvenance'];
  countryFields.forEach(field => {
    // @ts-ignore
    const val = data[field];
    if (isFieldInvalid(val)) {
        errors.push({ field, message: 'País ausente' });
    } else if (!isValidReference(val, lists.countries)) {
        errors.push({ field, message: `País inválido (${field})` });
    }
  });

  // Logistics (Safe Number Conversion)
  const netWeight = Number(data.totalNetWeight) || 0;
  const grossWeight = Number(data.totalGrossWeight) || 0;
  const volumes = Number(data.totalVolumes) || 0;

  if (netWeight <= 0) errors.push({ field: 'totalNetWeight', message: 'Peso líquido inválido' });
  if (grossWeight <= 0) errors.push({ field: 'totalGrossWeight', message: 'Peso bruto inválido' });
  
  if (netWeight > grossWeight) {
     errors.push({ field: 'totalNetWeight', message: 'Peso Líquido > Peso Bruto' });
  }

  if (volumes <= 0) errors.push({ field: 'totalVolumes', message: 'Qtd volumes inválida' });
  
  // Items
  if (!data.lineItems || data.lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'Nenhum item na fatura' });
  } else {
    data.lineItems.forEach((item, index) => {
      const idxStr = `Item ${index + 1}`;
      
      // Standard Fields
      if (isFieldInvalid(item.description)) errors.push({ field: `lineItem[${index}].description`, message: `${idxStr}: Descrição Técnica ausente` });
      if (isFieldInvalid(item.partNumber)) errors.push({ field: `lineItem[${index}].partNumber`, message: `${idxStr}: Part Number ausente` });
      if (isFieldInvalid(item.quantity) || Number(item.quantity) <= 0) errors.push({ field: `lineItem[${index}].quantity`, message: `${idxStr}: Quantidade inválida` });
      if (isFieldInvalid(item.unitPrice) || Number(item.unitPrice) < 0) errors.push({ field: `lineItem[${index}].unitPrice`, message: `${idxStr}: Preço unitário inválido` });
      
      const isNcmValid = isValidNCM(item.ncm);
      if (!isNcmValid) errors.push({ field: `lineItem[${index}].ncm`, message: `${idxStr}: Código NCM inválido` });

      // SCUD Mandatory Fields
      if (isFieldInvalid(item.productCode)) errors.push({ field: `lineItem[${index}].productCode`, message: `${idxStr}: Código Produto ausente` });
      if (isFieldInvalid(item.productDetail)) errors.push({ field: `lineItem[${index}].productDetail`, message: `${idxStr}: Detalhe Produto ausente` });
      if (isFieldInvalid(item.unitMeasure)) errors.push({ field: `lineItem[${index}].unitMeasure`, message: `${idxStr}: Unidade ausente` });
      if (isFieldInvalid(item.netWeight) || Number(item.netWeight) <= 0) errors.push({ field: `lineItem[${index}].netWeight`, message: `${idxStr}: Peso Líquido inválido` });
      if (isFieldInvalid(item.manufacturerCode)) errors.push({ field: `lineItem[${index}].manufacturerCode`, message: `${idxStr}: Código Fabricante ausente` });
      if (isFieldInvalid(item.manufacturerRef)) errors.push({ field: `lineItem[${index}].manufacturerRef`, message: `${idxStr}: Ref. Fabricante ausente` });

    });
  }

  return errors;
};

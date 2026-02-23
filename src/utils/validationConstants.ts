// Version: 1.05.00.46
/**
 * Standardized lists for validation and autocomplete.
 * This file now re-exports data from src/data for backward compatibility.
 */

export type ReferenceItem = {
  code: string;
  name: string;
};

export { VOLUME_TYPES_LIST } from "../data/VOLUME_TYPES_LIST";
export { INCOTERMS_LIST } from "../data/INCOTERMS_LIST";
export { PAYMENT_TERMS_LIST } from "../data/PAYMENT_TERMS_LIST";
export { CURRENCIES_LIST } from "../data/CURRENCIES_LIST";
export { COUNTRIES_LIST } from "../data/COUNTRIES_LIST";

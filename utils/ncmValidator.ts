// Version: 1.02.00.01

export interface NCMValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string;
}

/**
 * Validates an NCM code.
 * Checks for:
 * 1. Presence (Required)
 * 2. Length (Must be 8 digits)
 * 
 * Performs structural integrity check only.
 */
export const validateNCM = (ncm: string | null): NCMValidationResult => {
  if (!ncm || !ncm.trim()) {
    return { isValid: false, message: "NCM é obrigatório." };
  }

  // Remove non-numeric characters
  const digits = ncm.replace(/\D/g, '');

  if (digits.length === 0) {
    return { isValid: false, message: "NCM inválido." };
  }

  if (digits.length < 8) {
    return { 
      isValid: false, 
      message: `Incompleto: ${digits.length}/8 dígitos.` 
    };
  }

  if (digits.length > 8) {
    return { 
      isValid: false, 
      message: `Excesso de dígitos: ${digits.length}/8.` 
    };
  }

  return {
    isValid: true,
    formatted: `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
  };
};
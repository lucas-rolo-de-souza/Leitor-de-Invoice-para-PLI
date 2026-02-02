// Version: 1.02.00.01

export type NCMValidationResult = {
  isValid: boolean;
  message?: string;
  formatted?: string;
};

/**
 * Structural Validation for NCM Codes.
 *
 * Unlike `validators.ts` (which checks the database), this function only validates the *string format*.
 *
 * Logic:
 * - Removes non-digits.
 * - Checks strict length of 8 chars.
 * - Returns formatted string if valid (e.g. 1234.56.78).
 */
export const validateNCM = (ncm: string | null): NCMValidationResult => {
  if (!ncm || !ncm.trim()) {
    return { isValid: false, message: "NCM é obrigatório." };
  }

  // Remove non-numeric characters
  const digits = ncm.replace(/\D/g, "");

  if (digits.length === 0) {
    return { isValid: false, message: "NCM inválido." };
  }

  if (digits.length < 8) {
    return {
      isValid: false,
      message: `Incompleto: ${digits.length}/8 dígitos.`,
    };
  }

  if (digits.length > 8) {
    return {
      isValid: false,
      message: `Excesso de dígitos: ${digits.length}/8.`,
    };
  }

  return {
    isValid: true,
    formatted: `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(
      6,
      8,
    )}`,
  };
};

/**
 * Formats a raw string into standard NCM format (XXXX.XX.XX).
 * Handles partial inputs gracefully.
 */
export const formatNcmString = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const limited = digits.slice(0, 8);
  let masked = limited;
  if (limited.length > 4) masked = `${limited.slice(0, 4)}.${limited.slice(4)}`;
  if (limited.length > 6)
    masked = `${limited.slice(0, 4)}.${limited.slice(4, 6)}.${limited.slice(
      6,
    )}`;
  return masked;
};

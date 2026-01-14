/**
 * Converts weight between Kilograms (KG) and Pounds (LB).
 *
 * Standard conversion rates:
 * 1 KG = 2.20462262 LB
 * 1 LB = 0.45359237 KG
 *
 * @param value The numerical value to convert.
 * @param fromUnit The unit of the provided value ('KG' or 'LB').
 * @returns The converted value. Returns 0 if value is invalid.
 */
export const convertWeight = (
  value: number | string | null | undefined,
  fromUnit: string
): number => {
  const val = Number(value || 0);
  if (isNaN(val)) return 0;

  // Normalize unit
  const unit = fromUnit.toUpperCase();

  if (unit === "KG") {
    // Convert KG to LB
    return val * 2.20462262;
  } else if (unit === "LB") {
    // Convert LB to KG
    return val * 0.45359237;
  }

  // Fallback if unit is unknown (or 'UN', etc.) - though for weight usually just KG/LB
  return val;
};

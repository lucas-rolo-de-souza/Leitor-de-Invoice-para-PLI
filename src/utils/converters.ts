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

  switch (unit) {
    case "KG":
      return val * 2.20462262; // KG -> LB
    case "LB":
      return val * 0.45359237; // LB -> KG
    case "G":
      return val * 0.035274; // G -> OZ
    case "OZ":
      return val * 28.3495; // OZ -> G
    default:
      return val;
  }
};

/**
 * Normalizes any weight unit to Kilograms (KG).
 */
export const normalizeToKg = (
  value: number | string | null | undefined,
  fromUnit: string
): number => {
  const val = Number(value || 0);
  if (isNaN(val)) return 0;
  const unit = fromUnit.toUpperCase();

  switch (unit) {
    case "KG":
      return val;
    case "LB":
      return val * 0.45359237;
    case "G":
      return val / 1000;
    case "OZ":
      return val * 0.0283495;
    default:
      return val;
  }
};

/**
 * Converts a value in Kilograms (KG) to a target unit.
 */
export const convertFromKg = (valueInKg: number, toUnit: string): number => {
  const unit = toUnit.toUpperCase();
  switch (unit) {
    case "KG":
      return valueInKg;
    case "LB":
      return valueInKg * 2.20462262;
    case "G":
      return valueInKg * 1000;
    case "OZ":
      return valueInKg * 35.274;
    default:
      return valueInKg;
  }
};

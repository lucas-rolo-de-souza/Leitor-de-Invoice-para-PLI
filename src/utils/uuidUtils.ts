/**
 * UUID Generator Utility
 * Provides a robust fallback for environments where crypto.randomUUID is not available
 * (e.g., non-secure HTTP contexts, older browsers).
 */

export function generateUUID(): string {
  // 1. Try native crypto.randomUUID (Fastest, Secure Contexts only)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Ignore and fall back if it fails unexpectedly
    }
  }

  // 2. Try URL.createObjectURL side-effect (Clever hack for UUID v4-ish uniqueness)
  // Not used here to keep it pure JS without DOM deps if possible, but kept as idea.

  // 3. Math.random Fallback (Standard UUID v4 regex compliant)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

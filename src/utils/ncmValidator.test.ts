import { formatNcmString } from "./ncmValidator";

const testCases = [
  { input: "12345678", expected: "1234.56.78", desc: "Raw 8 digits" },
  { input: "1234.56.78", expected: "1234.56.78", desc: "Already formatted" },
  { input: "12345", expected: "1234.5", desc: "Partial 5 digits" },
  { input: "1234567", expected: "1234.56.7", desc: "Partial 7 digits" },
  { input: "84813000", expected: "8481.30.00", desc: "User example" },
  { input: "abc12345678", expected: "1234.56.78", desc: "With letters" },
  { input: "", expected: "", desc: "Empty string" },
];

console.log("Running NCM Validator Tests...");
let failed = 0;

testCases.forEach(({ input, expected, desc }) => {
  const result = formatNcmString(input);
  if (result === expected) {
    console.log(`[PASS] ${desc}: '${input}' -> '${result}'`);
  } else {
    console.error(
      `[FAIL] ${desc}: '${input}' -> Expected '${expected}', got '${result}'`,
    );
    failed++;
  }
});

if (failed === 0) {
  console.log("All tests passed!");
} else {
  console.error(`${failed} tests failed.`);
  process.exit(1);
}

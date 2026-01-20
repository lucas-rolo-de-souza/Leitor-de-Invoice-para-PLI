---
description: Standard process for implementing or modifying AI Data Extraction features.
---

# AI Extraction Standard (Zod + Gemini)

This workflow defines the proven pattern for high-accuracy data extraction in this project.

## 1. Schema Definition (Source of Truth)

All data structures must be defined in `src/domain/schemas.ts` using **Zod**.

- Use strict types.
- Use `.describe()` to provide context to the AI (this flows into the JSON Schema).
- Use `nullable()` for fields that might be missing in the document.

```typescript
// src/domain/schemas.ts
export const MyEntitySchema = z.object({
  field: z.string().describe("Description for the AI"),
});
```

## 2. Prompt Generation

Do **NOT** write manual JSON examples in prompts. Use `z.toJSONSchema` (Zod 4 native).

```typescript
// src/services/geminiService.ts
import { z } from "zod";

function getPrompt() {
  const schema = z.toJSONSchema(MyEntitySchema);
  return `... ${JSON.stringify(schema, null, 2)}`;
}
```

## 3. Prompt Engineering Guidelines

The prompt text must follow this structure for best results:

1.  **Persona**: "You are an expert <Role> AI." (e.g., Customs Data Analyst).
2.  **Task**: Clear, single-sentence objective.
3.  **Scope**: Numbered list of exactly what to look for.
4.  **Exclusions**: Explicitly state what NOT to extract (e.g., "IGNORE line items").
5.  **Field Guidelines**: Specific rules for formats (Dates ISO 8601, Numbers without currency).
6.  **Output Format**: "Return strictly valid JSON matching the schema below."

## 4. Execution & Validation

- Use `Promise.all` for parallel execution if extracting multiple chunks (Metadata + Line Items).
- **Validate** the output using `MyEntitySchema.safeParse(result)`.
- Log warnings on validation failure, do not crash the app unless critical.

## 5. Zod Version Note

Ensure `zod` is v4.x+ to support `z.toJSONSchema`. Do not use `zod-to-json-schema` library anymore.

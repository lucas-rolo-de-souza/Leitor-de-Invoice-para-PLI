# Invoice Reader AI (Leitor de Faturas) v1.05

**Version:** 1.05.00.37
**Status:** Production Ready

An intelligent, regulatory-compliant web application designed to automate the extraction, validation, and processing of **Commercial Invoices** and **Packing Lists** for international trade (specifically optimized for Brazilian Customs/Receita Federal).

Powered by **Google Gemini 2.5 Flash**, this tool drastically reduces manual data entry for customs brokers (Despachantes Aduaneiros), ensuring compliance with **Art. 557 of the Regulamento Aduaneiro**.

---

## 📚 Documentation Index

For detailed technical information, please refer to the specific documentation files:

- **[🏗 Architecture](./docs/ARCHITECTURE.md)**: System design, data flow, component hierarchy, and state management.
- **[📝 Technical Notes](./docs/TECHNICAL_NOTES.md)**: Deep dive into NCM Caching, AI Prompting strategies, and Validation logic.
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)**: Instructions for building, environment configuration, and hosting.

---

## 🚀 Key Features

- **Multimodal AI Extraction**: Drag & drop PDF, Images, or Excel files. The app uses Gemini 2.5 to visually analyze documents and extract structured data.
- **SCUD Industry Model Compliance**: Full support for the rigorous "SCUD" data model, including mandatory Manufacturer Codes, Product Details, and Regulatory Acts (Atos Legais).
- **Customs Compliance Engine**: Real-time validation against Brazilian regulations (Art. 557).
  - **NCM Validation**: robust **Stale-While-Revalidate** database (always keeps the official Siscomex list updated).
  - **Logistics**: Logic checks for Net vs. Gross Weight and Volume types.
  - **Entities**: Distinguishes Exporter/Importer based on "Bill To" vs "Ship To".
- **Version Control System**: Toggle between _Original (AI)_, _Saved (Checkpoint)_, and _Current (Draft)_ versions of the data.
- **Mobile-First Design**: Optimized for tablets and phones with card views and large touch targets.
- **Export**: Generates structured Excel (.xlsx) and PDF reports with embedded error logs.

## 🛠 Quick Start

1. **Clone the repository**.
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure API Key**:
   Ensure `process.env.API_KEY` is available (see Deployment Guide).
4. **Run Development Server**:

   ```bash
   npm run dev
   ```

## ⚖️ License

**Proprietary Software.**  
All Rights Reserved. No part of this software may be reproduced or distributed without written permission.

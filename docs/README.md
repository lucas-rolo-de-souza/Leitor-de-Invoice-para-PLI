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

- **Premium Enterprise UI**: A polished, data-focused interface inspired by high-end fintech applications.
  - **Glassmorphism Header**: Clean navigation with blur effects.
  - **Dynamic Footer**: Floating status pill for version tracking and operational health.
- **Advanced Compliance Engine**:
  - **Weighted Scoring**: 80% weight on General Article 557 items, 20% on granular PLI item validity.
  - **Gradient Indicator**: Visual conformity pill that transitions from Red to Amber to Green based on score.
- **AI Consumption Monitor (Full Size)**:
  - **Detailed Metrics**: Track Token Input/Output, Latency, and Estimated Costs (USD/BRL).
  - **Session & Lifetime Stats**: View usage for the current session or historical totals.
  - **Fullscreen Analysis**: Expanded view in the editor for deep diving into logs without obstruction.
- **Multimodal AI Extraction**: Drag & drop PDF, Images, or Excel files. The app uses Gemini 2.5 to visually analyze documents and extract structured data.
- **PLI Industry Model Compliance**: Full support for the rigorous "PLI" data model.
- **Version Control System**: Toggle between _Original (AI)_, _Saved (Checkpoint)_, and _Current (Draft)_ versions.

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

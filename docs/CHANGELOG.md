# Changelog

## 1.05.00.44 - 2026-01-19

### Fixed

- **Type Safety**: Resolved critical `no-explicit-any` lint errors across core services (`geminiService`, `exportService`, `loggerService`) and utilities (`validators.ts`), improving codebase stability.
- **Code Quality**: Removed unused code (`cleanData` in `geminiService`) and enforced strict type definitions in UI components (`HeaderSection`).
- **Linting**: Achieved a clean state for `npm run type-check` and significantly reduced ESLint warnings.

## 1.05.00.43 - 2026-01-19

### Changed

- **Maintenance**: Updated core dependencies (@google/genai, lucide-react, zod) to latest versions for security and performance.
- **Linting**: Migrated to ESLint 9 Flat Config (eslint.config.mts) and added dedicated linting scripts.
- **Build System**: Simplified `dev` and `build` scripts, removing deprecated `update-version.js` dependency in favor of direct TypeScript execution with `jiti`.

### Added

- **Persistent Invoice History**: Added "Save to Cloud" button in the header bar.
- **Supabase Integration**: Implemented secure storage with a 3-invoice limit per user (FIFO) using Row Level Security (RLS).
- **Security Audit**: Validated application security and confirmed no distinct secret exposures.

## 1.05.00.42 - 2026-01-16

### Fixed

- **Weight Calculation**: Implemented `normalizeToKg` strategy to correctly sum weights of different units (KG, G, LB, OZ).
- **Unit Updates**: Changing the weight unit now triggers an immediate recalculation of global totals.
- **Error Visibility**: Resolved an issue where validation error messages were clipped or invisible in `WeightInputCard`. They now appear as a floating banner.

### Added

- **Localization**: Complete translation support for "Manufacturer Data" and "Legal Acts" sections in the Item Editor modal.

## 1.05.00.41 - 2026-01-14

### Fixed

- **Mobile Responsiveness**: Fixed critical layout breakage in the Logistics Section, ensuring proper grids on small screens.
- **Accessibility**: Added `aria-label` to all icon-only buttons (Export PDF/Excel, Theme Toggle).

### Added

- **Editor Theme Toggle**: Added theme switch control to the Editor header for better context consistency.

## 1.05.00.40 - 2026-01-14

### Added

- **Design Doc**: Created dedicated `DESIGN_SYSTEM.md` to document the "Flux" design philosophy and Material Design 3 specifications.
- **Documentation**: Updated `ARCHITECTURE.md` to reflect recent codebase refactoring (Types vs Interfaces), inclusion of `LogViewer`, and new documentation structure.

### Changed

- **Version Bump**: Incrementing version to reflect documentation consolidation.

## 1.05.00.39 - 2026-01-13

### Changed

- **Codebase Refactoring**: Replace all `interface` declarations with `type` definitions across the `src` directory for consistency and modern TypeScript practices.
- **Internal**: Improved type safety and consistency in services, components, and utility modules.

## 1.05.00.38 - 2026-01-13

### Added

- **Premium Enterprise Design**: Completa reformulação visual da Landing Page e Header, removendo elementos "Aura" em favor de um estilo corporativo limpo.
- **Conformity Weighting**: Nova lógica de cálculo de conformidade:
  - **80%**: Itens gerais (Art. 557, Entidades, Logística).
  - **20%**: Detalhes técnicos do PLI (proporção de itens válidos).
- **Gradient Conformity Indicator**: Indicador visual (Pílula) que transita entre Vermelho, Amarelo e Verde.

### Fixed

- **Usage Widget (Full Size)**: Resolvido problema de clipping no modal de uso. Agora ele utiliza `React Portal` para renderizar em tela cheia sobre a aplicação, ignorando restrições do rodapé.
- **Layout Adjustments**: Correção de sobreposição do Header fixo e ajustes de padding na Landing Page.

## 1.05.00.37 - 2026-01-12

### Added

- **Log Viewer**: Nova interface gráfica para visualização de logs em tempo real, acessível via modal.
- **NCM Service Robusto**: Implementada estratégia "Stale-While-Revalidate". O app carrega instantaneamente do cache e atualiza silenciosamente em segundo plano.
- **Multi-Proxy Chain**: Sistema de fallback inteligente para download do Siscomex. Prioriza a URL Oficial (via Proxy) antes de usar mirrors.

### Changed

- **Campos Manuais**: NCM, Fabricante e Material agora são campos estritamente manuais (forçados a NULL na extração da IA) para garantir revisão humana.
- **Refatoração PLI**: Renomeado `productDetail` para `taxClassificationDetail` (Detalhe NCM) para maior clareza fiscal.

## 1.05.00.35 - 2025-12-28

### Fixed

- **JSON Parsing**: Implemented a robust, multi-pass JSON repair strategy in `GeminiService` to handle truncated responses from the AI API, significantly reducing "JSON Parse Failed" errors on large files.
- **AI Hallucinations**: Updated System Prompt with a "Zero Hallucination Policy", explicitly forbidding the AI from guessing NCM codes or calculating totals unless explicitly asked.
- **Schema Optimization**: Added `propertyOrdering` to the Gemini schema to ensure critical header data is generated before line items, preserving metadata even if the response is cut off.

## 1.05.00.34 - 2025-12-28

### Fixed

- **Calculation Bug**: Fixed an issue where the Subtotal and Grand Total would not update when clearing the Quantity or Unit Price fields in the editor.
- **Form Logic**: Refactored `useInvoiceForm` to treat empty/invalid inputs as 0 during calculation, ensuring immediate UI updates via the controlled component pattern.

## 1.05.00.33 - 2025-12-28

### Added

- **Tipos de Volumes**: Adicionada lista padronizada de embalagens logísticas (Ex: Pallets, Cartons, Drums).
- **Interface**: Campo 'Tipo Volume' agora conta com autocompletar inteligente para agilizar o preenchimento.

## 1.05.00.32 - 2025-12-28

### Added

- **Suporte a Unidades de Peso**: O sistema agora reconhece e processa pesos em quilogramas (KG) ou libras (LB/LBS).
- **Interface**: Seletor de unidade adicionado à seção de logística para facilitar conversões e conferências.
- **Obrigatoriedade Reforçada**: Campos de Quantidade e Peso continuam sendo obrigatórios para validação de conformidade.

## 1.05.00.31 - 2025-12-28

### Changed

- **Contexto de Negócio Refinado**: O prompt da IA foi ajustado para assumir a persona de 'Assistente de Despachante Aduaneiro'.
- **Definição de Stakeholders**: Clarificação explícita de que o 'Importador' é o cliente final (Bill To) e não necessariamente o local de entrega (Ship To), otimizando a extração para DUIMP/DI.

## 1.05.00.30 - 2025-12-28

### Changed

- **Extração de Itens**: Definições de campo refinadas e clarificadas.
- **Part Number**: Prioridade para extração de SKU/Ref sem confundir com NCM.
- **Quantidades**: Mapeamento explícito da coluna 'QTY (PCS)' para ignorar contagem de volumes (Packages).
- **Pesos**: Instrução específica para extrair 'ITEM NET WEIGHT' (Peso Líquido da Linha) e 'UNIT PRICE' com maior precisão.

## 1.05.00.29 - 2025-12-28

### Added

- **Aprimoramento de Extração**: Adicionado suporte explícito para colunas rotuladas como 'QTY (PCS)' ou 'QTY(PCS)' na detecção de quantidade de itens.

## 1.05.00.28 - 2025-12-28

### Fixed

- **Aprimoramento de Extração**: Regras reforçadas para capturar Quantidade (Qty) corretamente.
- **Correção de IA**: Instruções específicas para evitar confusão entre Quantidade de Itens (Units/Pcs) e Quantidade de Volumes (Packages/Pallets).

## 1.05.00.27 - 2025-12-28

### Added

- **Extração de Part Number**: Prompt atualizado para distinguir rigorosamente Part Number (Alfanumérico/Letras) de NCM (Numérico). Evita confusão entre códigos.
- **Novo Campo**: Adicionado suporte para 'Peso Líquido Unitário' nos itens.
- **Cálculo Automático**: O Peso Líquido Total do item agora é calculado automaticamente (Qtd \* Peso Unitário) quando disponível.
- **Interface**: Nova coluna 'Unit. Líq.' na tabela de itens.

## 1.05.00.26 - 2025-12-28

### Changed

- **Aprimoramento de Extração**: Refinamento do prompt para distinguir 'Importador' (Bill To) de 'Consignee', priorizando a entidade financeira.
- **Pesos**: Instrução específica para capturar o Peso Bruto Total (G.W.) no resumo, ignorando pesos de itens individuais.
- **Países**: Regras explícitas para diferenciar País de Origem (Made in) de País de Procedência (Shipped From/Port of Loading).

## 1.05.00.25 - 2025-12-28

### Removed

- **Remoção de Consignatário**: O campo 'Consignatário' foi removido completamente para focar apenas nos campos obrigatórios do Art. 557 (Importador/Exportador).
- **Reescrita do Prompt AI**: Prompt do sistema recriado do zero com foco em 'Null-Bias' (preferir nulo a inventar) e precisão de dados mandatórios.
- **Simplificação da Interface**: Remoção de colunas e validações desnecessárias relacionadas a entidades terciárias.

## 1.05.00.24 - 2025-12-28

### Changed

- **Automação Inteligente**: A lógica de 'Consignatário = Importador' foi movida da IA para o código da aplicação (TypeScript) para garantir 100% de determinismo e evitar confusão entre Entidades.
- **Correção de IA**: Instruções simplificadas para evitar que a IA confunda Exportador e Importador ao tentar resolver referências cruzadas.
- **Post-Processing**: Detecção automática de termos como 'Same as Buyer' para preenchimento automático de campos.

## 1.05.00.23 - 2025-12-28

### Fixed

- **Protocolo Anti-Alucinação**: Implementadas regras rígidas de 'Proibido Calcular' e 'Null-Bias' no prompt do sistema.
- **Schema Hardening**: Descrições dos campos atualizadas para priorizar a extração literal de valores (especialmente Totais e Impostos) em vez de interpretação.
- **Grounding**: Instruções adicionadas para evitar a invenção de NCMs quando a coluna 'HS Code' não existe visualmente no documento.

## 1.05.00.22 - 2025-12-28

### Fixed

- **Melhoria na IA**: Refinamento das regras para distinguir 'Part Number' de 'NCM' (evita NCMs com letras).
- **Correção de Alucinação**: O campo Incoterm agora só é preenchido se um código válido (ex: EXW, FOB) for encontrado explicitamente no documento.
- **Prompt**: Instruções mais rígidas para retornar 'null' em campos não encontrados.

## 1.05.00.21 - 2025-12-28

### Added

- **Suporte a Planilhas**: Adicionada compatibilidade para upload de arquivos Excel (.xlsx, .xls) e CSV.
- **Processamento Híbrido**: Planilhas são convertidas para texto estruturado antes de serem enviadas à IA para garantir maior precisão na extração de dados tabulares.
- **Visual**: Ícone de suporte a planilhas adicionado à área de upload.

## 1.05.00.20 - 2025-12-28

### Changed

- **Prompt Engineering Dinâmico**: Introdução de prompts personalizados por modelo.
- **Otimização Gemini 2.5**: Instruções focadas em literalidade e velocidade.
- **Otimização Gemini 2.0**: Instruções focadas em raciocínio visual para documentos complexos.
- **Otimização Gemma**: Instruções focadas em concisão e extração direta.

## 1.05.00.19 - 2025-12-28

### Fixed

- **Otimização de Performance**: Desativação do 'Thinking Mode' (Raciocínio) nos modelos Gemini 2.5 para reduzir latência e custos.
- **Correção de Timeout**: Prevenção de travamentos (hang up) durante a extração de dados.

## 1.05.00.18 - 2025-12-28

### Changed

- **Melhoria UX Mobile**: O seletor de modelo AI agora está visível e acessível em dispositivos móveis na tela inicial, com layout responsivo.

## 1.05.00.17 - 2025-12-28

### Fixed

- **Melhoria na IA**: Ajuste fino no prompt para distinguir corretamente Exportador (Seller) de Importador (Buyer), evitando inversão de papeis.
- **Lógica de Consignatário**: Implementada regra de fallback automática. Se o Consignee não for explícito (ou 'Same as Buyer'), os dados do Importador são replicados.

## 1.05.00.16 - 2025-12-28

### Added

- **Melhoria de Validação**: Implementação de verificação rigorosa de NCM contra a base oficial do Siscomex.
- **Recurso**: Adicionado suporte ao código '9999.99.99' como único NCM genérico (bypass) permitido.
- **Visual**: Descrições de NCM agora são exibidas diretamente no editor de itens para feedback imediato.

## 1.05.00.15 - 2025-12-28

### Fixed

- **Correção de Bug**: Alterar a visualização para 'Original' ou 'Salva' não sobrescreve mais o rascunho atual, prevenindo perda de dados.
- **Recurso**: Adicionado botão 'Descartar' na barra de ferramentas para permitir o reset manual das alterações não salvas.
- **Melhoria de Estado**: Sincronização automática do editor quando o controle de versão alterna a fonte de dados.

## 1.05.00.14 - 2025-12-28

### Added

- **Licenciamento**: Atualização de conformidade legal. Modal 'Legal' adicionado para exibir direitos proprietários e atribuições OSS.
- **Configuração**: Criação de package.json para gerenciamento de metadados do projeto.

## 1.05.00.13 - 2025-12-28

### Added

- **Melhoria de UX**: Novo componente de Autocomplete (Combobox) para campos de validação (Países, Incoterms, Moedas).
- **Funcionalidade**: Busca inteligente por Código e Nome nas listas de seleção.
- **Visual**: Eliminação de elementos HTML nativos (datalist) em favor de dropdowns estilizados e responsivos.

## 1.05.00.12 - 2025-12-28

### Added

- **Melhoria de UX**: 'Scroll-to-Fix'. Clicar em um erro no Checklist agora rola a página suavemente até o campo afetado.
- **Novo Widget de Uso**: Design estilo Dashboard com busca de logs e filtros.
- **Funcionalidade**: Adicionado botão para limpar histórico de uso e confirmação de ação.
- **Visual**: Refinamento de sombras e bordas nos componentes de resumo e checklist.

## 1.05.00.11 - 2025-12-28

### Added

- **Atualização de Modelos AI**: Migração para versões estáveis (stable) para evitar erros 404.
- **Novo Modelo Padrão**: Gemini 2.5 Flash Lite.
- **Adição de suporte para Gemini 2.0 Flash/Lite e Gemma 3/3n com IDs limpos.**
- **Remoção de tags '-preview' e datas para garantir compatibilidade com a API de produção.**

## 1.05.00.10 - 2025-12-28

### Fixed

- **Correção Crítica**: Remoção de modelos AI inválidos/experimentais que causavam erro 404.
- **Definição de 'Gemini 2.5 Flash' como modelo padrão para garantir estabilidade.**
- **Ajuste na lista de modelos disponíveis (Gemini 2.5 Flash, 2.0 Flash, 2.0 Flash Lite, 1.5 Flash).**

## 1.05.00.09 - 2025-12-28

### Added

- **Atualização de Modelos AI**: Inclusão de Gemini 2.5 Flash Lite (Padrão), Gemini 2.0 Flash/Lite e Gemma 3/3n.
- **Ajuste de precificação no monitor de uso para os novos modelos.**

## 1.05.00.08 - 2025-12-28

### Added

- **Persistência de Logs de Uso**: Histórico de custos e tokens salvo localmente (LocalStorage).
- **Auto-Key de Sessão**: Geração automática de ID único por sessão para rastreabilidade.
- **Widget de Uso Aprimorado**: Visualização de custos da sessão atual vs. histórico total.
- **Separação de visualização de logs por sessão ou histórico completo.**

## 1.05.00.07 - 2025-12-28

### Added

- **Otimização UX/UI para Mobile, Tablet e Desktop.**
- **Novo 'Card View' para edição de itens em telas pequenas, eliminando a rolagem horizontal da tabela.**
- **Ajuste de inputs para 'text-base' em mobile (evita zoom automático no iOS).**
- **Layout responsivo refinado em todas as seções (Header, Entities, Logistics).**

## 1.05.00.06 - 2025-12-28

### Added

- **Integração com Banco Central do Brasil (PTAX) para conversão de custos.**
- **Novo Service: CurrencyService com lógica de fallback para dias não úteis.**
- **Widget de Uso atualizado para exibir custos em BRL (Reais) e USD.**

## 1.05.00.05 - 2025-12-28

### Added

- **Novo recurso: Monitor de Uso da API (Session Usage).**
- **Adicionado cálculo estimativo de custos e tokens para modelos Gemini.**
- **Novo widget no rodapé com detalhamento de latência, tokens (entrada/saída) e custo por requisição.**
- **Integração do serviço de medição no fluxo principal de extração.**

## 1.05.00.01 - 2025-12-28

### Added

- **Atualização do Sistema de Logs**: Inclusão de carimbo de data/hora formatado (human-readable) em todos os registros.
- **Melhoria no output de console para exibir a hora exata das operações em tempo real.**
- **Integração do serviço de IA (GeminiService) com o Logger centralizado para rastreio de erros temporais.**

## 1.05.00.00 - 2025-12-28

### Added

- **Migração do cache NCM para Cache Storage API (Arquivo JSON Virtual).**
- **Melhoria significativa de performance no carregamento da aplicação.**
- **Remoção de limitações de cota do LocalStorage (5MB) para a base de dados.**
- **Otimização do uso de memória através de carregamento assíncrono.**

## 1.03.00.01 - 2025-12-27

### Changed

- **Atualização da lógica de busca NCM baseada em script Python oficial.**
- **Novo endpoint da API Siscomex com perfil PUBLICO.**
- **Implementação de lógica de retentativa (Retry) nas conexões de rede.**
- **Aprimoramento do parser para suportar estrutura plana 'Nomenclaturas'.**

## 1.03.00.00 - 2025-12-27

### Added

- **Implementação do sistema de Logs e Debugging (loggerService).**
- **Integração com Portal Único Siscomex para validação de NCM.**
- **Sistema de cache para base de dados NCM (7 dias).**
- **Adição de botão 'Baixar Logs' no rodapé para diagnóstico de erros.**
- **Criação de CHANGELOG.md para documentação técnica.**

## 1.02.00.01 - 2025-12-26

### Changed

- **Melhoria na UI da Barra de Versões (VersionBar).**
- **Adição de funcionalidade de minimizar/expandir a barra de controle para economizar espaço em telas pequenas.**
- **Layout responsivo aprimorado para mobile (botões full-width) e desktop.**

## 1.02.00.00 - 2025-12-26

### Added

- **Implementação do sistema de versionamento de dados (Original, Salvo, Atual).**
- **Adição de barra de controle de versões no editor.**
- **Funcionalidade de 'Salvar Checkpoint' e 'Restaurar Versão'.**

## 1.01.00.00 - 2025-12-26

### Changed

- **Refatoração completa da arquitetura para padrão Modular/Funcional.**
- **Separação de lógica de estado e validação em Custom Hooks (useInvoiceForm, useCompliance).**
- **Criação de Camada de Serviços para manipulação de arquivos e exportação.**
- **Atomização de componentes de UI e seções do editor.**
- **Isolamento de funções puras de validação.**

## 1.00.00.02 - 2025-12-25

### Fixed

- **Correção na lógica de exibição da mensagem de conformidade para o item 'III - Mercadorias' no checklist.**
- **Atualização do controle de versão global.**

## 1.00.00.01 - 2025-12-24

### Added

- **Implementação do sistema de controle de versão global**
- **Adição de rastreamento de versão em cada arquivo individual**
- **Adição do rodapé com indicador de versão**
- **Visualização de histórico de alterações (Changelog)**

## 1.00.00.00 - 2025-12-20

### Added

- **Lançamento da versão 2.0 (AI Powered)**
- **Integração com Gemini 2.5 Flash**
- **Validação automática Art. 557**
- **Exportação para Excel e PDF**
- **Suporte a múltiplos arquivos (Invoice + Packing List)**

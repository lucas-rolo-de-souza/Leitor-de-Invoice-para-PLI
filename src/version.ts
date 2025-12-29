
// Version: 1.05.00.42

export const APP_VERSION = "1.05.00.42";

export interface ChangeLogItem {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGE_LOG: ChangeLogItem[] = [
  {
    version: "1.05.00.42",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Exportação PDF Aprimorada: Os campos 'Peso Líquido Total' e 'Peso Bruto Total' no PDF agora exibem simultaneamente os valores em Quilogramas (KG) e Libras (LB).",
      "Conversão Automática: O sistema calcula automaticamente a conversão de unidade com base na unidade original (KG ou LB) extraída do documento."
    ]
  },
  {
    version: "1.05.00.41",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Modelo Padrão: Alterado o modelo padrão de IA para 'Gemini 2.5 Flash' para garantir maior precisão e robustez na extração de dados.",
      "Configuração: A seleção padrão na tela inicial agora prioriza a versão padrão do Flash em vez da Lite."
    ]
  },
  {
    version: "1.05.00.40",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Correção de UI: Corrigido problema onde o botão 'Voltar' no cabeçalho não era clicável em algumas telas devido à sobreposição da barra de versões.",
      "Melhoria de Layout: Ajuste de Z-Index e Pointer Events no cabeçalho da aplicação para garantir acessibilidade de todos os controles."
    ]
  },
  {
    version: "1.05.00.39",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "JSON Repair V3: Implementação de um Token Balancer (State Machine) para reparar JSONs truncados com precisão cirúrgica.",
      "Correção de Erro Crítico: Resolvido 'Expected , or }' em arquivos grandes onde o corte ocorria no meio de valores ou estruturas.",
      "Fallback Inteligente: Se o reparo inteligente falhar, o sistema agora corta para o último item válido do array, garantindo que o restante dos dados seja salvo."
    ]
  },
  {
    version: "1.05.00.38",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Editor de Itens Completo: O modal de detalhes agora atua como um editor completo, permitindo acesso a TODOS os campos (Part Number, Descrição, NCM, Preços) em uma única tela.",
      "Acessibilidade Mobile: Resolvido problema onde campos obrigatórios do modelo SCUD (como Cód. Produto e Detalhe) não eram acessíveis em dispositivos móveis.",
      "Sinalização de Erro: O botão de edição agora exibe o ícone de alerta para QUALQUER campo obrigatório pendente, facilitando a identificação de itens incompletos."
    ]
  },
  {
    version: "1.05.00.37",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Checklist de Conformidade (Art. 557): Adicionada validação explícita 'IX - Detalhamento Técnico' para garantir preenchimento de Fabricante, Produto e Pesos por item.",
      "Interface de Itens: Implementado indicador visual (Ícone de Alerta) no botão de edição quando faltam dados mandatórios ocultos no modal.",
      "Validação Estendida: Reforço nas regras de obrigatoriedade para Código do Produto, Detalhe e Referência do Fabricante."
    ]
  },
  {
    version: "1.05.00.36",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Conformidade Modelo SCUD: Implementação completa dos campos obrigatórios do modelo industrial SCUD (Código Fabricante, Detalhes do Produto, Atos Legais).",
      "Modal de Detalhes Estendidos: Nova interface para edição de atributos técnicos, informações regulatórias e dados do fabricante por item.",
      "Validação Financeira Estrita: 'Condição de Pagamento' e 'Moeda' agora são campos obrigatórios com validação visual.",
      "Integridade de Cálculos: O campo Subtotal agora é somente leitura e calculado localmente a partir da soma dos itens, garantindo consistência matemática."
    ]
  },
  {
    version: "1.05.00.35",
    date: "28/05/2024",
    changes: [
      "Correção de JSON: Implementada estratégia robusta de reparo multi-passo no GeminiService para lidar com respostas truncadas.",
      "Política Anti-Alucinação: Prompt do sistema atualizado para proibir invenção de NCMs ou cálculos não explícitos.",
      "Otimização de Schema: Ordenação de propriedades adicionada para garantir que metadados críticos sejam gerados antes dos itens de linha."
    ]
  },
  {
    version: "1.05.00.34",
    date: "28/05/2024",
    changes: [
      "Bug de Cálculo: Corrigido problema onde Subtotal e Total Geral não atualizavam ao limpar campos de Quantidade ou Preço.",
      "Lógica de Formulário: Refatoração do useInvoiceForm para tratar inputs vazios como 0 durante o cálculo."
    ]
  },
  {
    version: "1.05.00.33",
    date: "28/05/2024",
    changes: [
      "Tipos de Volumes: Adicionada lista padronizada de embalagens logísticas (Ex: Pallets, Cartons, Drums).",
      "Interface: Campo 'Tipo Volume' agora conta com autocompletar inteligente para agilizar o preenchimento."
    ]
  },
  {
    version: "1.05.00.32",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Suporte a Unidades de Peso: O sistema agora reconhece e processa pesos em quilogramas (KG) ou libras (LB/LBS).",
      "Interface: Seletor de unidade adicionado à seção de logística para facilitar conversões e conferências.",
      "Obrigatoriedade Reforçada: Campos de Quantidade e Peso continuam sendo obrigatórios para validação de conformidade."
    ]
  },
  {
    version: "1.05.00.31",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Contexto de Negócio Refinado: O prompt da IA foi ajustado para assumir a persona de 'Assistente de Despachante Aduaneiro'.",
      "Definição de Stakeholders: Clarificação explícita de que o 'Importador' é o cliente final (Bill To) e não necessariamente o local de entrega (Ship To), otimizando a extração para DUIMP/DI."
    ]
  },
  {
    version: "1.05.00.30",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Extração de Itens: Definições de campo refinadas e clarificadas.",
      "Part Number: Prioridade para extração de SKU/Ref sem confundir com NCM.",
      "Quantidades: Mapeamento explícito da coluna 'QTY (PCS)' para ignorar contagem de volumes (Packages).",
      "Pesos: Instrução específica para extrair 'ITEM NET WEIGHT' (Peso Líquido da Linha) e 'UNIT PRICE' com maior precisão."
    ]
  },
  {
    version: "1.05.00.29",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Aprimoramento de Extração: Adicionado suporte explícito para colunas rotuladas como 'QTY (PCS)' ou 'QTY(PCS)' na detecção de quantidade de itens."
    ]
  },
  {
    version: "1.05.00.28",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Aprimoramento de Extração: Regras reforçadas para capturar Quantidade (Qty) corretamente.",
      "Correção de IA: Instruções específicas para evitar confusão entre Quantidade de Itens (Units/Pcs) e Quantidade de Volumes (Packages/Pallets)."
    ]
  },
  {
    version: "1.05.00.27",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Extração de Part Number: Prompt atualizado para distinguir rigorosamente Part Number (Alfanumérico/Letras) de NCM (Numérico). Evita confusão entre códigos.",
      "Novo Campo: Adicionado suporte para 'Peso Líquido Unitário' nos itens.",
      "Cálculo Automático: O Peso Líquido Total do item agora é calculado automaticamente (Qtd * Peso Unitário) quando disponível.",
      "Interface: Nova coluna 'Unit. Líq.' na tabela de itens."
    ]
  },
  {
    version: "1.05.00.26",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Aprimoramento de Extração: Refinamento do prompt para distinguir 'Importador' (Bill To) de 'Consignee', priorizando a entidade financeira.",
      "Pesos: Instrução específica para capturar o Peso Bruto Total (G.W.) no resumo, ignorando pesos de itens individuais.",
      "Países: Regras explícitas para diferenciar País de Origem (Made in) de País de Procedência (Shipped From/Port of Loading)."
    ]
  },
  {
    version: "1.05.00.25",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Remoção de Consignatário: O campo 'Consignatário' foi removido completamente para focar apenas nos campos obrigatórios do Art. 557 (Importador/Exportador).",
      "Reescrita do Prompt AI: Prompt do sistema recriado do zero com foco em 'Null-Bias' (preferir nulo a inventar) e precisão de dados mandatórios.",
      "Simplificação da Interface: Remoção de colunas e validações desnecessárias relacionadas a entidades terciárias."
    ]
  },
  {
    version: "1.05.00.24",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Automação Inteligente: A lógica de 'Consignatário = Importador' foi movida da IA para o código da aplicação (TypeScript) para garantir 100% de determinismo e evitar confusão entre Entidades.",
      "Correção de IA: Instruções simplificadas para evitar que a IA confunda Exportador e Importador ao tentar resolver referências cruzadas.",
      "Post-Processing: Detecção automática de termos como 'Same as Buyer' para preenchimento automático de campos."
    ]
  },
  {
    version: "1.05.00.23",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Protocolo Anti-Alucinação: Implementadas regras rígidas de 'Proibido Calcular' e 'Null-Bias' no prompt do sistema.",
      "Schema Hardening: Descrições dos campos atualizadas para priorizar a extração literal de valores (especialmente Totais e Impostos) em vez de interpretação.",
      "Grounding: Instruções adicionadas para evitar a invenção de NCMs quando a coluna 'HS Code' não existe visualmente no documento."
    ]
  },
  {
    version: "1.05.00.22",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Melhoria na IA: Refinamento das regras para distinguir 'Part Number' de 'NCM' (evita NCMs com letras).",
      "Correção de Alucinação: O campo Incoterm agora só é preenchido se um código válido (ex: EXW, FOB) for encontrado explicitamente no documento.",
      "Prompt: Instruções mais rígidas para retornar 'null' em campos não encontrados."
    ]
  },
  {
    version: "1.05.00.21",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Suporte a Planilhas: Adicionada compatibilidade para upload de arquivos Excel (.xlsx, .xls) e CSV.",
      "Processamento Híbrido: Planilhas são convertidas para texto estruturado antes de serem enviadas à IA para garantir maior precisão na extração de dados tabulares.",
      "Visual: Ícone de suporte a planilhas adicionado à área de upload."
    ]
  },
  {
    version: "1.05.00.20",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Prompt Engineering Dinâmico: Introdução de prompts personalizados por modelo.",
      "Otimização Gemini 2.5: Instruções focadas em literalidade e velocidade.",
      "Otimização Gemini 2.0: Instruções focadas em raciocínio visual para documentos complexos.",
      "Otimização Gemma: Instruções focadas em concisão e extração direta."
    ]
  },
  {
    version: "1.05.00.19",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Otimização de Performance: Desativação do 'Thinking Mode' (Raciocínio) nos modelos Gemini 2.5 para reduzir latência e custos.",
      "Correção de Timeout: Prevenção de travamentos (hang up) durante a extração de dados."
    ]
  },
  {
    version: "1.05.00.18",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Melhoria UX Mobile: O seletor de modelo AI agora está visível e acessível em dispositivos móveis na tela inicial, com layout responsivo.",
    ]
  },
  {
    version: "1.05.00.17",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Melhoria na IA: Ajuste fino no prompt para distinguir corretamente Exportador (Seller) de Importador (Buyer), evitando inversão de papeis.",
      "Lógica de Consignatário: Implementada regra de fallback automática. Se o Consignee não for explícito (ou 'Same as Buyer'), os dados do Importador são replicados."
    ]
  },
  {
    version: "1.05.00.16",
    date: new Date().toLocaleDateString('pt-BR'),
    changes: [
      "Melhoria de Validação: Implementação de verificação rigorosa de NCM contra a base oficial do Siscomex.",
      "Recurso: Adicionado suporte ao código '9999.99.99' como único NCM genérico (bypass) permitido.",
      "Visual: Descrições de NCM agora são exibidas diretamente no editor de itens para feedback imediato."
    ]
  },
  {
    version: "1.05.00.15",
    date: "28/05/2024",
    changes: [
      "Correção de Bug: Alterar a visualização para 'Original' ou 'Salva' não sobrescreve mais o rascunho atual, prevenindo perda de dados.",
      "Recurso: Adicionado botão 'Descartar' na barra de ferramentas para permitir o reset manual das alterações não salvas.",
      "Melhoria de Estado: Sincronização automática do editor quando o controle de versão alterna a fonte de dados."
    ]
  },
  {
    version: "1.05.00.14",
    date: "28/05/2024",
    changes: [
      "Licenciamento: Atualização de conformidade legal. Modal 'Legal' adicionado para exibir direitos proprietários e atribuições OSS.",
      "Configuração: Criação de package.json para gerenciamento de metadados do projeto."
    ]
  },
  {
    version: "1.05.00.13",
    date: "28/05/2024",
    changes: [
      "Melhoria de UX: Novo componente de Autocomplete (Combobox) para campos de validação (Países, Incoterms, Moedas).",
      "Funcionalidade: Busca inteligente por Código e Nome nas listas de seleção.",
      "Visual: Eliminação de elementos HTML nativos (datalist) em favor de dropdowns estilizados e responsivos."
    ]
  },
  {
    version: "1.05.00.12",
    date: "28/05/2024",
    changes: [
      "Melhoria de UX: 'Scroll-to-Fix'. Clicar em um erro no Checklist agora rola a página suavemente até o campo afetado.",
      "Novo Widget de Uso: Design estilo Dashboard com busca de logs e filtros.",
      "Funcionalidade: Adicionado botão para limpar histórico de uso e confirmação de ação.",
      "Visual: Refinamento de sombras e bordas nos componentes de resumo e checklist."
    ]
  },
  {
    version: "1.05.00.11",
    date: "28/05/2024",
    changes: [
      "Atualização de Modelos AI: Migração para versões estáveis (stable) para evitar erros 404.",
      "Novo Modelo Padrão: Gemini 2.5 Flash Lite.",
      "Adição de suporte para Gemini 2.0 Flash/Lite e Gemma 3/3n com IDs limpos.",
      "Remoção de tags '-preview' e datas para garantir compatibilidade com a API de produção."
    ]
  },
  {
    version: "1.05.00.10",
    date: "28/05/2024",
    changes: [
      "Correção Crítica: Remoção de modelos AI inválidos/experimentais que causavam erro 404.",
      "Definição de 'Gemini 2.5 Flash' como modelo padrão para garantir estabilidade.",
      "Ajuste na lista de modelos disponíveis (Gemini 2.5 Flash, 2.0 Flash, 2.0 Flash Lite, 1.5 Flash)."
    ]
  },
  {
    version: "1.05.00.09",
    date: "28/05/2024",
    changes: [
      "Atualização de Modelos AI: Inclusão de Gemini 2.5 Flash Lite (Padrão), Gemini 2.0 Flash/Lite e Gemma 3/3n.",
      "Ajuste de precificação no monitor de uso para os novos modelos."
    ]
  },
  {
    version: "1.05.00.08",
    date: "28/05/2024",
    changes: [
      "Persistência de Logs de Uso: Histórico de custos e tokens salvo localmente (LocalStorage).",
      "Auto-Key de Sessão: Geração automática de ID único por sessão para rastreabilidade.",
      "Widget de Uso Aprimorado: Visualização de custos da sessão atual vs. histórico total.",
      "Separação de visualização de logs por sessão ou histórico completo."
    ]
  },
  {
    version: "1.05.00.07",
    date: "28/05/2024",
    changes: [
      "Otimização UX/UI para Mobile, Tablet e Desktop.",
      "Novo 'Card View' para edição de itens em telas pequenas, eliminando a rolagem horizontal da tabela.",
      "Ajuste de inputs para 'text-base' em mobile (evita zoom automático no iOS).",
      "Layout responsivo refinado em todas as seções (Header, Entities, Logistics)."
    ]
  },
  {
    version: "1.05.00.06",
    date: "28/05/2024",
    changes: [
      "Integração com Banco Central do Brasil (PTAX) para conversão de custos.",
      "Novo Service: CurrencyService com lógica de fallback para dias não úteis.",
      "Widget de Uso atualizado para exibir custos em BRL (Reais) e USD."
    ]
  },
  {
    version: "1.05.00.05",
    date: "28/05/2024",
    changes: [
      "Novo recurso: Monitor de Uso da API (Session Usage).",
      "Adicionado cálculo estimativo de custos e tokens para modelos Gemini.",
      "Novo widget no rodapé com detalhamento de latência, tokens (entrada/saída) e custo por requisição.",
      "Integração do serviço de medição no fluxo principal de extração."
    ]
  },
  {
    version: "1.05.00.01",
    date: "28/05/2024",
    changes: [
      "Atualização do Sistema de Logs**: Inclusão de carimbo de data/hora formatado (human-readable) em todos os registros.",
      "Melhoria no output de console para exibir a hora exata das operações em tempo real.",
      "Integração do serviço de IA (GeminiService) com o Logger centralizado para rastreio de erros temporais."
    ]
  },
  {
    version: "1.05.00.00",
    date: "28/05/2024",
    changes: [
      "Migração do cache NCM para Cache Storage API (Arquivo JSON Virtual).",
      "Melhoria significativa de performance no carregamento da aplicação.",
      "Remoção de limitações de cota do LocalStorage (5MB) para a base de dados.",
      "Otimização do uso de memória através de carregamento assíncrono."
    ]
  },
  {
    version: "1.03.00.01",
    date: "27/05/2024",
    changes: [
      "Atualização da lógica de busca NCM baseada em script Python oficial.",
      "Novo endpoint da API Siscomex com perfil PUBLICO.",
      "Implementação de lógica de retentativa (Retry) nas conexões de rede.",
      "Aprimoramento do parser para suportar estrutura plana 'Nomenclaturas'."
    ]
  },
  {
    version: "1.03.00.00",
    date: "27/05/2024",
    changes: [
      "Implementação do sistema de Logs e Debugging (loggerService).",
      "Integração com Portal Único Siscomex para validação de NCM.",
      "Sistema de cache para base de dados NCM (7 dias).",
      "Adição de botão 'Baixar Logs' no rodapé para diagnóstico de erros.",
      "Criação de CHANGELOG.md para documentação técnica."
    ]
  },
  {
    version: "1.02.00.01",
    date: "26/05/2024",
    changes: [
      "Melhoria na UI da Barra de Versões (VersionBar).",
      "Adição de funcionalidade de minimizar/expandir a barra de controle para economizar espaço em telas pequenas.",
      "Layout responsivo aprimorado para mobile (botões full-width) e desktop."
    ]
  },
  {
    version: "1.02.00.00",
    date: "26/05/2024",
    changes: [
      "Implementação do sistema de versionamento de dados (Original, Salvo, Atual).",
      "Adição de barra de controle de versões no editor.",
      "Funcionalidade de 'Salvar Checkpoint' e 'Restaurar Versão'."
    ]
  },
  {
    version: "1.01.00.00",
    date: "26/05/2024",
    changes: [
      "Refatoração completa da arquitetura para padrão Modular/Funcional.",
      "Separação de lógica de estado e validação em Custom Hooks (useInvoiceForm, useCompliance).",
      "Criação de Camada de Serviços para manipulação de arquivos e exportação.",
      "Atomização de componentes de UI e seções do editor.",
      "Isolamento de funções puras de validação."
    ]
  },
  {
    version: "1.00.00.02",
    date: "25/05/2024",
    changes: [
      "Correção na lógica de exibição da mensagem de conformidade para o item 'III - Mercadorias' no checklist.",
      "Atualização do controle de versão global."
    ]
  },
  {
    version: "1.00.00.01",
    date: "24/05/2024",
    changes: [
      "Implementação do sistema de controle de versão global",
      "Adição de rastreamento de versão em cada arquivo individual",
      "Adição do rodapé com indicador de versão",
      "Visualização de histórico de alterações (Changelog)"
    ]
  },
  {
    version: "1.00.00.00",
    date: "20/05/2024",
    changes: [
      "Lançamento da versão 2.0 (AI Powered)",
      "Integração com Gemini 2.5 Flash",
      "Validação automática Art. 557",
      "Exportação para Excel e PDF",
      "Suporte a múltiplos arquivos (Invoice + Packing List)"
    ]
  }
];

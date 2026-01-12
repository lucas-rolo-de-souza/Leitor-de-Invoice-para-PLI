// Version: 1.05.00.17
import { logger } from "./loggerService";

/**
 * NCM Service
 * Responsável por buscar, processar e validar dados da Tabela NCM oficial do Siscomex.
 *
 * Estratégia de Cache Atualizada (v1.05):
 * - Utiliza a Cache API (window.caches) para armazenar o dataset processado como um arquivo JSON virtual.
 * - Isso evita o bloqueio da thread principal (comum no LocalStorage) e contorna limites de cota de 5MB.
 * - Metadados de expiração permanecem no LocalStorage para acesso rápido.
 */

export interface NcmRecord {
  code: string;
  description: string;
}

export interface NcmHierarchyItem {
  code: string;
  description: string;
  level: string;
}

// Configuração do Cache Virtual
const CACHE_NAME = "siscomex-ncm-cache-v1";
const VIRTUAL_FILE_URL = "https://internal/ncm-db.json"; // URL virtual interna para indexar o arquivo no Cache Storage
const LAST_UPDATE_KEY = "SISCOMEX_NCM_DATE";

const PRIMARY_URL =
  "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";
const SECONDARY_URL =
  "https://raw.githubusercontent.com/leogregianin/siscomex-ncm/cacd1cda19acf22e34a82e30c9b31cc508ee73e9/ncm.json";

const HEADERS = {
  Accept: "application/json",
};

const FALLBACK_NCMS: NcmRecord[] = [
  {
    code: "84713012",
    description:
      "De peso inferior a 3,5 kg, com tela de área superior a 140 cm2",
  },
  {
    code: "84713019",
    description: "Outras máquinas automáticas para processamento de dados",
  },
  { code: "85171300", description: "Telefones inteligentes (smartphones)" },
  {
    code: "85176277",
    description: "Aparelhos emissores com receptor incorporado digital",
  },
  { code: "39269090", description: "Outras obras de plásticos" },
  {
    code: "73181500",
    description:
      "Outros parafusos e pinos ou pernos, mesmo com as porcas e arruelas",
  },
  { code: "84733041", description: "Placas-mãe (motherboards)" },
  {
    code: "84733049",
    description: "Outros circuitos impressos com componentes elétricos",
  },
  {
    code: "85044021",
    description: "Retificadores, carregadores de acumuladores",
  },
  { code: "85444200", description: "Munidos de peças de conexão" },
  { code: "48211000", description: "Etiquetas de papel ou cartão, impressas" },
  {
    code: "48191000",
    description: "Caixas de papel ou cartão, ondulados (canelados)",
  },
];

class NcmService {
  private ncmMap: Map<string, string> = new Map();
  private isReady: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Explicit initialization required via init()
  }

  /**
   * Inicializa o serviço.
   * Fluxo: Memória -> Cache API (Disco) -> Rede (API)
   * Implementa Singleton Promise para evitar Race Conditions (Double Fetch em Strict Mode).
   */
  public async init(): Promise<void> {
    if (this.isReady) return;

    // Se já existe uma inicialização em andamento, retorna a mesma promise
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // 1. Tenta carregar do Cache Storage (Rápido e Offline)
        const loadedFromCache = await this.loadFromCache();

        if (loadedFromCache) {
          logger.info(
            "[NCM Service] Dados carregados do Cache Storage. Serviço pronto."
          );

          // ESTRATÉGIA "ALWAYS UPDATE":
          // Dispara atualização em background para garantir dados frescos na próxima vez (ou hot-swap).
          // Não aguardamos essa promise para não bloquear a inicialização da app.
          this.fetchAndProcess()
            .then(() => {
              logger.info(
                "[NCM Service] Atualização em background concluída com sucesso."
              );
            })
            .catch((err) => {
              logger.warn(
                "[NCM Service] Atualização em background falhou (Cache preservado).",
                err
              );
            });

          return; // Retorna imediatamente para liberar a UI
        }

        // 2. Se não tem cache, o download é OBRIGATÓRIO (Bloqueante)
        logger.info(
          "[NCM Service] Cache ausente. Iniciando download obrigatório..."
        );
        await this.fetchAndProcess();

        // 3. Se tudo falhar, carrega fallback
        if (!this.isReady) {
          logger.warn("[NCM Service] Falha na rede. Ativando modo Fallback.");
          this.processFallback();
        }
      } catch (e) {
        logger.error("[NCM Service] Erro fatal na inicialização.", e);
        // Garante que o app não quebre sem NCMs
        if (!this.isReady) this.processFallback();
      } finally {
        // Se falhou mesmo após fallback (improvável), limpamos a promise para permitir retry manual se necessário
        if (!this.isReady) {
          this.initPromise = null;
        }
      }
    })();

    return this.initPromise;
  }

  public getDescription(ncmCode: string | null): string | null {
    if (!ncmCode) return null;
    const cleanCode = ncmCode.replace(/\D/g, "");

    // Bypass Rule: 9999.99.99
    if (cleanCode === "99999999") return "NCM Genérico (Bypass de Validação)";

    if (cleanCode.length !== 8) return null;
    return this.ncmMap.get(cleanCode) || null;
  }

  public getHierarchy(ncmCode: string | null): NcmHierarchyItem[] {
    if (!ncmCode) return [];
    const clean = ncmCode.replace(/\D/g, "");

    // Bypass Rule
    if (clean === "99999999") {
      return [
        {
          code: "9999.99.99",
          description: "NCM Genérico (Bypass de Validação)",
          level: "Item",
        },
      ];
    }

    if (clean.length < 2) return [];

    const levels = [
      { len: 2, label: "Capítulo" },
      { len: 4, label: "Posição" },
      { len: 6, label: "Subposição" },
      { len: 7, label: "Item" },
      { len: 8, label: "Subitem" },
    ];

    const hierarchy: NcmHierarchyItem[] = [];

    levels.forEach((lvl) => {
      if (clean.length >= lvl.len) {
        const sub = clean.substring(0, lvl.len);
        const desc = this.ncmMap.get(sub);
        if (desc) {
          hierarchy.push({ code: sub, description: desc, level: lvl.label });
        }
      }
    });

    return hierarchy;
  }

  public getStatus() {
    return {
      totalRecords: this.ncmMap.size,
      isReady: this.isReady,
      isLoading: !!this.initPromise && !this.isReady,
    };
  }

  // --- Internals ---

  /**
   * Lê o "arquivo virtual" JSON do Cache Storage.
   */
  private async loadFromCache(): Promise<boolean> {
    if (!("caches" in window)) return false;

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(VIRTUAL_FILE_URL);

      if (response) {
        const entries = await response.json();
        // Reconstrói o Map a partir do array de entradas [key, value]
        this.ncmMap = new Map(entries);
        this.isReady = true;
        return true;
      }
    } catch (e) {
      logger.error("[NCM Service] Erro ao ler do Cache Storage", e);
    }
    return false;
  }

  /**
   * Salva o estado atual da memória como um arquivo JSON no Cache Storage.
   */
  private async saveToCache() {
    if (!("caches" in window)) return;

    try {
      const cache = await caches.open(CACHE_NAME);

      // Serializa o Map para Array de Arrays para otimização JSON
      const data = JSON.stringify(Array.from(this.ncmMap.entries()));

      // Cria um Blob (Arquivo Virtual)
      const blob = new Blob([data], { type: "application/json" });

      // Cria uma Response sintética para armazenar no Cache
      const response = new Response(blob, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": blob.size.toString(),
        },
      });

      await cache.put(VIRTUAL_FILE_URL, response);
      localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());

      logger.debug(
        `[NCM Service] Cache atualizado. Tamanho: ${(
          blob.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
    } catch (e) {
      logger.error("[NCM Service] Falha ao gravar no Cache Storage", e);
    }
  }

  private processFallback() {
    FALLBACK_NCMS.forEach((item) => {
      this.ncmMap.set(item.code, item.description);
    });
    this.isReady = true;
  }

  private async fetchWithRetry(
    url: string,
    retries: number = 3,
    timeoutMs: number = 15000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: HEADERS,
        });
        clearTimeout(timeoutId);

        if (res.ok) return res;

        logger.warn(
          `[NCM Service] Tentativa ${
            i + 1
          }/${retries} falhou para ${url}. Status: ${res.status}`
        );
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Erro Cliente (${res.status})`);
        }
      } catch (err: any) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }
    throw new Error("Falha irrecuperável na conexão.");
  }

  private async fetchAndProcess() {
    try {
      let data: any = null;
      let sourceUsed = "";

      // 1. Tentativa Direta (Oficial)
      try {
        logger.info(`[NCM Service] Tentando download direto: ${PRIMARY_URL}`);
        const res = await this.fetchWithRetry(PRIMARY_URL, 2, 10000);
        data = await res.json();
        sourceUsed = "Oficial (Direto)";
      } catch (err) {
        logger.warn(
          "[NCM Service] Falha download direto (possível CORS). Tentando Proxy...",
          err
        );
      }

      // 2. Tentativa via CORS Proxy (Oficial mas via Proxy)
      // Tenta uma lista de proxies para contornar restrições
      if (!data) {
        const proxies = [
          (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
          (url: string) =>
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        ];

        for (const proxyGen of proxies) {
          if (data) break;
          const proxyUrl = proxyGen(PRIMARY_URL);
          try {
            logger.info(`[NCM Service] Tentando via Proxy: ${proxyUrl}`);
            const res = await this.fetchWithRetry(proxyUrl, 1, 15000); // 1 retry per proxy to save time
            data = await res.json();
            sourceUsed = "Oficial (CORS Proxy)";
          } catch (err) {
            logger.warn(`[NCM Service] Proxy falhou: ${proxyUrl}`, err);
          }
        }
      }

      // 3. Fallback para Mirror (GitHub) - Último recurso
      if (!data) {
        try {
          logger.info(`[NCM Service] Tentando Mirror: ${SECONDARY_URL}`);
          const res = await this.fetchWithRetry(SECONDARY_URL, 2, 10000);
          data = await res.json();
          sourceUsed = "GitHub Mirror";
        } catch (err) {
          logger.error("[NCM Service] Todas as tentativas falharam.", err);
          throw err;
        }
      }

      if (data) {
        // Log de Metadados Oficiais (se disponível)
        if (data.Data_Ultima_Atualizacao_NCM) {
          logger.info(
            `[NCM Service] Data Base Oficial: ${
              data.Data_Ultima_Atualizacao_NCM
            } (${data.Ato || "N/A"})`
          );
        }

        const newMap = new Map<string, string>();
        let count = 0;

        // Parser para estrutura Oficial (Array "Nomenclaturas")
        if (data.Nomenclaturas && Array.isArray(data.Nomenclaturas)) {
          for (const item of data.Nomenclaturas) {
            // SISCOMEX Oficial usa "Codigo" e "Descricao"
            if (item.Codigo && item.Descricao) {
              // Remove pontos do código para normalizar (Ex: "0101.21.00" -> "01012100")
              const cleanCode = item.Codigo.replace(/\./g, "").trim();

              // Armazenamos apenas NCMs completos (8 dígitos) para validação exata,
              // ou parciais se necessário para hierarquia (mas focamos em validação)
              // O código original guardava tudo. Vamos manter tudo para a hierarquia funcionar.
              if (cleanCode) {
                newMap.set(cleanCode, item.Descricao.trim());
                count++;
              }
            }
          }
        }
        // Parser legado/mirror (Se a estrutura for diferente ou recursiva)
        else {
          // Fallback recursivo mantido para compatibilidade com mirrors antigos
          const traverse = (node: any) => {
            if (node.Codigo && typeof node.Codigo === "string") {
              const cleanCode = node.Codigo.replace(/\./g, "").trim();
              if (cleanCode) newMap.set(cleanCode, node.Descricao);
            }
            ["Secoes", "Capitulos", "Posicoes", "SubPosicoes", "Itens"].forEach(
              (key) => {
                if (node[key] && Array.isArray(node[key]))
                  node[key].forEach(traverse);
              }
            );
          };
          const root = data.Nomenclatura || data;
          if (Array.isArray(root)) root.forEach(traverse);
          count = newMap.size;
        }

        if (newMap.size > 0) {
          this.ncmMap = newMap;
          this.isReady = true;
          await this.saveToCache();
          logger.info(
            `[NCM Service] Sucesso! Fonte: ${sourceUsed}. Registros: ${count}.`
          );
        } else {
          throw new Error("JSON baixado não contém registros NCM válidos.");
        }
      }
    } catch (error) {
      logger.error(
        "[NCM Service] Erro fatal no processo de atualização.",
        error
      );
      throw error;
    }
  }
}

export const ncmService = new NcmService();


// Version: 1.05.00.17
import { logger } from './loggerService';

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
const CACHE_NAME = 'siscomex-ncm-cache-v1';
const VIRTUAL_FILE_URL = 'https://internal/ncm-db.json'; // URL virtual interna para indexar o arquivo no Cache Storage
const LAST_UPDATE_KEY = 'SISCOMEX_NCM_DATE';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

const PRIMARY_URL = 'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO';
const SECONDARY_URL = 'https://raw.githubusercontent.com/leogregianin/siscomex-ncm/cacd1cda19acf22e34a82e30c9b31cc508ee73e9/ncm.json';

const HEADERS = {
    'Accept': 'application/json'
};

const FALLBACK_NCMS: NcmRecord[] = [
  { code: '84713012', description: 'De peso inferior a 3,5 kg, com tela de área superior a 140 cm2' },
  { code: '84713019', description: 'Outras máquinas automáticas para processamento de dados' },
  { code: '85171300', description: 'Telefones inteligentes (smartphones)' },
  { code: '85176277', description: 'Aparelhos emissores com receptor incorporado digital' },
  { code: '39269090', description: 'Outras obras de plásticos' },
  { code: '73181500', description: 'Outros parafusos e pinos ou pernos, mesmo com as porcas e arruelas' },
  { code: '84733041', description: 'Placas-mãe (motherboards)' },
  { code: '84733049', description: 'Outros circuitos impressos com componentes elétricos' },
  { code: '85044021', description: 'Retificadores, carregadores de acumuladores' },
  { code: '85444200', description: 'Munidos de peças de conexão' },
  { code: '48211000', description: 'Etiquetas de papel ou cartão, impressas' },
  { code: '48191000', description: 'Caixas de papel ou cartão, ondulados (canelados)' }
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
            if (loadedFromCache && !this.isCacheExpired()) {
                logger.info('[NCM Service] Dados carregados do Cache Storage com sucesso.');
                return;
            }
            
            // 2. Se falhar ou estiver expirado, busca da Rede
            logger.info('[NCM Service] Cache ausente ou expirado. Iniciando download...');
            await this.fetchAndProcess();

            // 3. Se tudo falhar, carrega fallback
            if (!this.isReady) {
                logger.warn('[NCM Service] Falha na rede. Ativando modo Fallback.');
                this.processFallback();
            }
        } catch (e) {
            logger.error('[NCM Service] Erro fatal na inicialização.', e);
            this.processFallback();
        } finally {
            // Se falhou mesmo após fallback (improvável), limpamos a promise para permitir retry
            if (!this.isReady) {
                this.initPromise = null;
            }
        }
    })();

    return this.initPromise;
  }

  public getDescription(ncmCode: string | null): string | null {
    if (!ncmCode) return null;
    const cleanCode = ncmCode.replace(/\D/g, '');
    
    // Bypass Rule: 9999.99.99
    if (cleanCode === '99999999') return 'NCM Genérico (Bypass de Validação)';
    
    if (cleanCode.length !== 8) return null;
    return this.ncmMap.get(cleanCode) || null;
  }

  public getHierarchy(ncmCode: string | null): NcmHierarchyItem[] {
    if (!ncmCode) return [];
    const clean = ncmCode.replace(/\D/g, '');
    
    // Bypass Rule
    if (clean === '99999999') {
        return [{ code: '9999.99.99', description: 'NCM Genérico (Bypass de Validação)', level: 'Item' }];
    }

    if (clean.length < 2) return [];

    const levels = [
        { len: 2, label: 'Capítulo' },
        { len: 4, label: 'Posição' },
        { len: 6, label: 'Subposição' },
        { len: 7, label: 'Item' },
        { len: 8, label: 'Subitem' }
    ];

    const hierarchy: NcmHierarchyItem[] = [];

    levels.forEach(lvl => {
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
      isLoading: !!this.initPromise && !this.isReady
    };
  }

  // --- Internals ---

  /**
   * Lê o "arquivo virtual" JSON do Cache Storage.
   */
  private async loadFromCache(): Promise<boolean> {
    if (!('caches' in window)) return false;

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
        logger.error('[NCM Service] Erro ao ler do Cache Storage', e);
    }
    return false;
  }

  /**
   * Salva o estado atual da memória como um arquivo JSON no Cache Storage.
   */
  private async saveToCache() {
    if (!('caches' in window)) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        
        // Serializa o Map para Array de Arrays para otimização JSON
        const data = JSON.stringify(Array.from(this.ncmMap.entries()));
        
        // Cria um Blob (Arquivo Virtual)
        const blob = new Blob([data], { type: 'application/json' });
        
        // Cria uma Response sintética para armazenar no Cache
        const response = new Response(blob, {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': blob.size.toString()
            }
        });

        await cache.put(VIRTUAL_FILE_URL, response);
        localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
        
        logger.debug(`[NCM Service] Cache atualizado. Tamanho: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
        logger.error('[NCM Service] Falha ao gravar no Cache Storage', e);
    }
  }

  private isCacheExpired(): boolean {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    if (!lastUpdate) return true;
    const diff = Date.now() - parseInt(lastUpdate, 10);
    return diff > CACHE_DURATION;
  }

  private processFallback() {
    FALLBACK_NCMS.forEach(item => {
      this.ncmMap.set(item.code, item.description);
    });
    this.isReady = true;
  }

  private async fetchWithRetry(url: string, retries: number = 3, timeoutMs: number = 10000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
            clearTimeout(timeoutId);
            if (res.ok) return res;
        } catch (err) {
            if (i === retries - 1) throw err;
        }
    }
    throw new Error(`Falha após ${retries} tentativas.`);
  }

  private async fetchAndProcess() {
    try {
      let data = null;

      // Tentativa 1: Portal Único
      try {
        const res = await this.fetchWithRetry(PRIMARY_URL, 3, 15000);
        data = await res.json();
      } catch (err) {
        logger.warn('[NCM Service] Falha API Oficial, tentando mirror...');
      }

      // Tentativa 2: GitHub Mirror
      if (!data) {
        const res = await this.fetchWithRetry(SECONDARY_URL, 3, 20000);
        data = await res.json();
      }

      if (data) {
          const newMap = new Map<string, string>();
          
          // Parser otimizado para a estrutura oficial
          if (data.Nomenclaturas && Array.isArray(data.Nomenclaturas)) {
              data.Nomenclaturas.forEach((item: any) => {
                  if (item.Codigo && item.Descricao) {
                      newMap.set(item.Codigo.replace(/\./g, ''), item.Descricao);
                  }
              });
          } else {
              // Parser recursivo para estruturas antigas/hierárquicas
              const traverse = (node: any) => {
                if (node.Codigo && typeof node.Codigo === 'string') {
                    newMap.set(node.Codigo.replace(/\./g, ''), node.Descricao);
                }
                ['Secoes', 'Capitulos', 'Posicoes', 'SubPosicoes', 'Itens'].forEach(key => {
                    if (node[key] && Array.isArray(node[key])) node[key].forEach(traverse);
                });
              };
              
              const root = data.Nomenclatura || data;
              if (Array.isArray(root)) root.forEach(traverse);
          }

          if (newMap.size > 0) {
            this.ncmMap = newMap;
            this.isReady = true;
            // Salva no sistema de arquivos virtual do navegador (Cache API)
            await this.saveToCache();
            logger.info(`[NCM Service] Banco de dados atualizado: ${newMap.size} registros.`);
          } else {
            throw new Error("Dados baixados vazios ou inválidos");
          }
      }
    } catch (error) {
      logger.error('[NCM Service] Erro no processamento de download.', error);
      // Let the caller handle fallback
      throw error;
    }
  }
}

export const ncmService = new NcmService();

import { logger } from "./loggerService";

// PTAX API Endpoint (Banco Central do Brasil)
// Returns the official PTAX rate used for accounting and trade.
const BCB_API_BASE =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)";
const PTAX_CACHE_KEY = "ptax_daily_rates_v1";

class CurrencyService {
  private cache: Record<string, number> = {};
  private isLoading: boolean = false;

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const stored = localStorage.getItem(PTAX_CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (e) {
      console.error("[Currency] Failed to load PTAX cache", e);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(PTAX_CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.error("[Currency] Failed to save PTAX cache", e);
    }
  }

  /**
   * Fetches the PTAX Sell Rate (Cotação de Venda) for a specific date (or today).
   * Automatically handles weekends/holidays by looking back up to 5 days.
   * Persists the found rate for that specific day to avoid re-fetching.
   */
  public async getUSDtoBRLRate(
    date: Date = new Date()
  ): Promise<number | null> {
    const dateKey = this.formatDateForCache(date);

    // 1. Check Cache
    if (this.cache[dateKey]) {
      return this.cache[dateKey];
    }

    if (this.isLoading) return null; // Simple debounce, though ideally we'd queue promises

    this.isLoading = true;
    let rate: number | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Clone date to avoid mutating the original passed reference if we loop back
    let searchDate = new Date(date);

    while (!rate && attempts < maxAttempts) {
      try {
        const dateStr = this.formatDateForBCB(searchDate);
        const searchKey = this.formatDateForCache(searchDate);

        // Check cache for this fall-back date too before hitting API
        if (this.cache[searchKey]) {
          rate = this.cache[searchKey];
          // If we found a rate for a past date (e.g. Friday), we can potentially map the original query date (Sunday) to it?
          // For now, let's just use the rate.
          break;
        }

        const url = `${BCB_API_BASE}?@dataCotacao='${dateStr}'&$top=1&$format=json&$select=cotacaoVenda`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.value && data.value.length > 0) {
            rate = data.value[0].cotacaoVenda;
            logger.info(
              `[Currency] Taxa PTAX encontrada para ${dateStr}: R$ ${rate}`
            );

            // Cache the Found Rate for the Found Date
            if (typeof rate === "number") {
              this.cache[searchKey] = rate;
              // Also Cache it for the Original Query Date if distinct (e.g. if today is Sunday, map Sunday -> Friday's rate)
              // This prevents re-searching for Sunday every time.
              if (dateKey !== searchKey) {
                this.cache[dateKey] = rate;
              }
              this.saveCache();
            }
          }
        }
      } catch (e) {
        logger.warn(
          `[Currency] Falha ao buscar taxa para ${searchDate.toDateString()}`,
          e
        );
      }

      if (!rate) {
        // Go back 1 day
        searchDate.setDate(searchDate.getDate() - 1);
        attempts++;
      }
    }

    this.isLoading = false;
    if (!rate) {
      logger.error(
        "[Currency] Não foi possível obter a taxa de câmbio PTAX recente."
      );
    }

    return rate;
  }

  /**
   * Formats date to MM-DD-YYYY (BCB Requirement)
   */
  private formatDateForBCB(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }

  /**
   * Formats date to YYYY-MM-DD (Cache Key)
   */
  private formatDateForCache(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }
}

export const currencyService = new CurrencyService();

import { logger } from './loggerService';

// PTAX API Endpoint (Banco Central do Brasil)
// Returns the official PTAX rate used for accounting and trade.
const BCB_API_BASE = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)';

class CurrencyService {
  private cachedRate: number | null = null;
  private isLoading: boolean = false;

  /**
   * Fetches the most recent PTAX Sell Rate (Cotação de Venda).
   * Automatically handles weekends/holidays by looking back up to 4 days.
   */
  public async getUSDtoBRLRate(): Promise<number | null> {
    if (this.cachedRate) return this.cachedRate;
    if (this.isLoading) return null;

    this.isLoading = true;
    let rate: number | null = null;
    let attempts = 0;
    const maxAttempts = 5; // Look back 5 days max (covers long weekends + holidays)
    let currentDate = new Date();

    while (!rate && attempts < maxAttempts) {
      try {
        // Adjust for timezone differences to ensure we don't ask for "tomorrow" by accident
        // PTAX usually closes by 13:30 PM BRT, final bulletin around 5 PM.
        const dateStr = this.formatDateForBCB(currentDate);
        const url = `${BCB_API_BASE}?@dataCotacao='${dateStr}'&$top=1&$format=json&$select=cotacaoVenda`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.value && data.value.length > 0) {
                rate = data.value[0].cotacaoVenda;
                logger.info(`[Currency] Taxa PTAX encontrada para ${dateStr}: R$ ${rate}`);
            }
        }
      } catch (e) {
        logger.warn(`[Currency] Falha ao buscar taxa para ${currentDate.toDateString()}`, e);
      }

      if (!rate) {
        // Go back 1 day
        currentDate.setDate(currentDate.getDate() - 1);
        attempts++;
      }
    }

    this.isLoading = false;
    if (rate) {
        this.cachedRate = rate;
    } else {
        logger.error('[Currency] Não foi possível obter a taxa de câmbio PTAX recente.');
    }
    
    return rate;
  }

  /**
   * Formats date to MM-DD-YYYY (BCB Requirement)
   */
  private formatDateForBCB(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }
}

export const currencyService = new CurrencyService();

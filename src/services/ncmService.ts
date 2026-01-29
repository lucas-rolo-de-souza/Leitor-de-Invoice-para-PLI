// Version: 1.05.00.19 (Backend Connected)
import { logger } from "./loggerService";

export type NcmRecord = {
  code: string;
  description: string;
};

export type NcmHierarchyItem = {
  code: string;
  description: string;
  level: string;
};

class NcmService {
  private isReady: boolean = true;

  constructor() {}

  /**
   * Initializes the service - backend is assumed ready.
   */
  public async init(): Promise<void> {
    try {
      await fetch("/api/health");
      logger.info("[NCM Service] Backend connected.");
    } catch (e) {
      logger.error("[NCM Service] Backend health check failed.", e);
    }
  }

  public async getDescription(ncmCode: string | null): Promise<string | null> {
    if (!ncmCode) return null;
    const cleanCode = ncmCode.replace(/\D/g, "");
    if (cleanCode.length !== 8) return null;

    try {
      const res = await fetch(`/api/ncm/${cleanCode}`);
      if (res.ok) {
        const data = await res.json();
        return data.description;
      }
      return null;
    } catch (e) {
      logger.error(`Error fetching NCM ${cleanCode}`, e);
      return null;
    }
  }

  public async getHierarchy(
    ncmCode: string | null,
  ): Promise<NcmHierarchyItem[]> {
    if (!ncmCode) return [];

    const cleanCode = ncmCode.replace(/\D/g, "");
    if (cleanCode.length < 2) return [];

    try {
      const res = await fetch(`/api/ncm/${cleanCode}/hierarchy`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.error("Failed to fetch NCM hierarchy", e);
    }
    return [];
  }

  public async search(term: string): Promise<NcmRecord[]> {
    if (!term || term.length < 3) return [];
    try {
      const res = await fetch(
        `/api/ncm/search?term=${encodeURIComponent(term)}`,
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      logger.error("Search failed", e);
    }
    return [];
  }

  public getStatus() {
    return {
      totalRecords: 0,
      isReady: this.isReady,
      isLoading: false,
      lastUpdateSource: "Backend",
      lastCheckTimestamp: Date.now(),
    };
  }
}

export const ncmService = new NcmService();

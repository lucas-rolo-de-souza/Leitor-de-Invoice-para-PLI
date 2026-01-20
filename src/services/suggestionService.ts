import { logger } from "./loggerService";

/**
 * Suggestion Service (The "Memory" of the application)
 * Uses IndexedDB to store historical validations.
 *
 * If a user corrects an NCM for "PartNumber-123", this service remembers it.
 * Next time the AI sees "PartNumber-123", we overwrite the AI's guess with the user's validated data.
 */

type ProductMemory = {
  partNumber: string; // Key
  ncm: string;
  description: string;
  manufacturerCode?: string;
  material?: string;
  manufacturerRef?: string;
  manufacturerCountry?: string;
  updatedAt: number;
  useCount: number;
};

const DB_NAME = "InvoiceReader_Memory_v1";
const STORE_NAME = "products";

class SuggestionService {
  private db: IDBDatabase | null = null;
  private isReady: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open with version 2 to ensure we are ready for expanded schema if needed
      const request = indexedDB.open(DB_NAME, 2);

      request.onerror = (event) => {
        logger.error("SuggestionService DB Error", event);
        reject();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create an objectStore for products, key path is partNumber
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "partNumber" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isReady = true;
        logger.info("SuggestionService (AI Memory) Initialized");
        resolve();
      };
    });
  }

  /**
   * Learns from a validated line item.
   * Call this when the user Exports a valid invoice.
   */
  public async learnItem(item: {
    partNumber: string | null;
    ncm: string | null;
    description: string | null;
    manufacturerCode?: string | null;
    material?: string | null;
    manufacturerRef?: string | null;
    manufacturerCountry?: string | null;
  }) {
    if (!this.isReady || !this.db || !item.partNumber || !item.ncm) return;

    const cleanPN = item.partNumber.trim();
    if (cleanPN.length < 2) return; // Ignore trivial part numbers

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Get existing to update count
    const getReq = store.get(cleanPN);

    getReq.onsuccess = () => {
      const existing = getReq.result as ProductMemory;
      const newData: ProductMemory = {
        partNumber: cleanPN,
        ncm: item.ncm || "",
        description: item.description || "",
        manufacturerCode: item.manufacturerCode || "",
        material: item.material || "",
        manufacturerRef: item.manufacturerRef || "",
        manufacturerCountry: item.manufacturerCountry || "",
        updatedAt: Date.now(),
        useCount: existing ? existing.useCount + 1 : 1,
      };
      store.put(newData);
    };
  }

  /**
   * batchLearn: Learn multiple items at once (e.g. on Export)
   */
  public async learnBatch(items: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items.forEach((item) => this.learnItem(item as any));
  }

  /**
   * Retrieves a suggestion for a given Part Number.
   */
  public async getSuggestion(
    partNumber: string | null,
  ): Promise<ProductMemory | null> {
    if (!this.isReady || !this.db || !partNumber) return null;

    const cleanPN = partNumber.trim();

    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cleanPN);

      request.onsuccess = () => {
        resolve((request.result as ProductMemory) || null);
      };
      request.onerror = () => resolve(null);
    });
  }
}

export const suggestionService = new SuggestionService();

/**
 * Generic IndexedDB wrapper for managing data persistence
 */
export class KritzelDatabase<T = any> {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly version: number;

  constructor(dbName: string, storeName: string, version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Get all items from the store
   */
  async getAll(): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single item by ID
   */
  async get(id: string): Promise<T | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save or update an item
   */
  async put(item: T): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an item by ID
   */
  async delete(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from the store
   */
  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if database is initialized
   */
  get isInitialized(): boolean {
    return this.db !== null;
  }
}

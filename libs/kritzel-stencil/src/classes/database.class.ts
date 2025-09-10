export class KritzelDatabase {
  private db: IDBDatabase | null = null;

  private readonly dbName: string;
  private readonly dbVersion: number;
  private readonly isLoggingEnabled: boolean;

  constructor(dbName: string, dbVersion: number, isLoggingEnabled: boolean = false) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.isLoggingEnabled = isLoggingEnabled;
  }

  public async open(
    stores: { name: string; options?: IDBObjectStoreParameters; indices?: { name: string; keyPath: string; options?: IDBIndexParameters }[] }[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      if (this.isLoggingEnabled) {
        console.trace(`[IndexedDB] Opening database: ${this.dbName}, version: ${this.dbVersion}`);
      }
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        if (this.isLoggingEnabled) {
          console.trace(`[IndexedDB] Database opened successfully.`);
        }
        resolve();
      };

      request.onupgradeneeded = event => {
        if (this.isLoggingEnabled) {
          console.trace(`[IndexedDB] Upgrade needed for database: ${this.dbName}`);
        }
        const db = (event.target as IDBOpenDBRequest).result;
        stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            if (this.isLoggingEnabled) {
              console.trace(`[IndexedDB] Creating store: ${storeConfig.name}`);
            }
            const store = db.createObjectStore(storeConfig.name, storeConfig.options);
            if (storeConfig.indices) {
              storeConfig.indices.forEach(index => {
                if (this.isLoggingEnabled) {
                  console.trace(`[IndexedDB] Creating index: ${index.name} on store: ${storeConfig.name}`);
                }
                store.createIndex(index.name, index.keyPath, index.options);
              });
            }
          }
        });
      };
    });
  }

  public close(): void {
    if (this.db) {
      if (this.isLoggingEnabled) {
        console.trace(`[IndexedDB] Closing database: ${this.dbName}`);
      }
      this.db.close();
      this.db = null;
    }
  }

  public async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] Add:', { storeName, item });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.add(item));
  }

  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] Get:', { storeName, key });
    }
    return this.executeTransaction(storeName, 'readonly', store => store.get(key));
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] GetAll:', { storeName });
    }
    return this.executeTransaction(storeName, 'readonly', store => store.getAll());
  }

  public async update<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] Update:', { storeName, item });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.put(item));
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] Delete:', { storeName, key });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.delete(key));
  }

  public async getAllByRange<T>(storeName: string, range: IDBKeyRange): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] GetAllByRange:', { storeName, range });
    }
    return this.executeTransaction(storeName, 'readonly', store => {
      return store.getAll(range);
    });
  }

  public async getAllByIndex<T>(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] GetAllByIndex:', { storeName, indexName, query });
    }
    return this.executeTransaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      return index.getAll(query);
    });
  }

  public async transaction(storeNames: string[], mode: IDBTransactionMode, action: (...stores: IDBObjectStore[]) => void): Promise<void> {
    if (!this.db) {
      throw new Error('Database is not open.');
    }

    if (this.isLoggingEnabled) {
      console.trace('[IndexedDB] Manual transaction:', { storeNames, mode });
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, mode);
      const stores = storeNames.map(name => transaction.objectStore(name));

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      action(...stores);
    });
  }

  private async executeTransaction<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    if (!this.db) {
      throw new Error('Database is not open.');
    }

    return new Promise<T>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);
      let requestResult: T;

      transaction.oncomplete = () => {
        resolve(requestResult);
      };

      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Transaction aborted'));
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };

      request.onsuccess = () => {
        requestResult = request.result as T;
      };
    });
  }
}

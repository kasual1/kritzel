export class KritzelDatabase {

  private db: IDBDatabase | null = null;

  private readonly dbName: string;
  
  private readonly dbVersion: number;

  constructor(dbName: string, dbVersion: number) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  public async open(stores: { name: string; options?: IDBObjectStoreParameters; indices?: { name: string; keyPath: string; options?: IDBIndexParameters }[] }[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        stores.forEach(storeConfig => {
            if (!db.objectStoreNames.contains(storeConfig.name)) {
                const store = db.createObjectStore(storeConfig.name, storeConfig.options);
                if (storeConfig.indices) {
                    storeConfig.indices.forEach(index => {
                        store.createIndex(index.name, index.keyPath, index.options);
                    });
                }
            }
        });
      };
    });
  }

  public async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    return this.executeTransaction(storeName, 'readwrite', store => store.add(item));
  }

  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.executeTransaction(storeName, 'readonly', store => store.get(key));
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    return this.executeTransaction(storeName, 'readonly', store => store.getAll());
  }

  public async update<T>(storeName: string, item: T): Promise<IDBValidKey> {
    return this.executeTransaction(storeName, 'readwrite', store => store.put(item));
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', store => store.delete(key));
  }

  public async getAllByRange<T>(storeName: string, range: IDBKeyRange): Promise<T[]> {
    return this.executeTransaction(storeName, 'readonly', store => {
      return store.getAll(range);
    });
  }

  public async getAllByIndex<T>(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]> {
    return this.executeTransaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      return index.getAll(query);
    });
  }

  public async transaction(
    storeNames: string[],
    mode: IDBTransactionMode,
    action: (...stores: IDBObjectStore[]) => void,
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database is not open.');
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

  private async executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    if (!this.db) {
      throw new Error('Database is not open.');
    }

    return new Promise<T>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);

      request.onsuccess = () => {
        resolve(request.result as T);
      };

      request.onerror = () => {
        console.error('Transaction error:', request.error);
        reject(request.error);
      };
    });
  }
}
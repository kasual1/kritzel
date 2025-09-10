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
        console.log(`[IndexedDB] Opening database: ${this.dbName}, version: ${this.dbVersion}`);
      }
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        if (this.isLoggingEnabled) {
          console.log(`[IndexedDB] Database opened successfully.`);
        }
        resolve();
      };

      request.onupgradeneeded = event => {
        if (this.isLoggingEnabled) {
          console.log(`[IndexedDB] Upgrade needed for database: ${this.dbName}`);
        }
        const db = (event.target as IDBOpenDBRequest).result;
        stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            if (this.isLoggingEnabled) {
              console.log(`[IndexedDB] Creating store: ${storeConfig.name}`);
            }
            const store = db.createObjectStore(storeConfig.name, storeConfig.options);
            if (storeConfig.indices) {
              storeConfig.indices.forEach(index => {
                if (this.isLoggingEnabled) {
                  console.log(`[IndexedDB] Creating index: ${index.name} on store: ${storeConfig.name}`);
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
        console.log(`[IndexedDB] Closing database: ${this.dbName}`);
      }
      this.db.close();
      this.db = null;
    }
  }

  public async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] Add:', { storeName, item });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.add(item));
  }

  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] Get:', { storeName, key });
    }
    return this.executeTransaction(storeName, 'readonly', store => store.get(key));
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] GetAll:', { storeName });
    }
    return this.executeTransaction(storeName, 'readonly', store => store.getAll());
  }

  public async update<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] Update:', { storeName, item });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.put(item));
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] Delete:', { storeName, key });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.delete(key));
  }

  public async deleteByRange(storeName: string, range: IDBKeyRange): Promise<void> {  
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] DeleteByRange:', { storeName, range });
    }
    return this.executeTransaction(storeName, 'readwrite', store => store.delete(range));
  }

  public async getAllByRange<T>(storeName: string, range: IDBKeyRange): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] GetAllByRange:', { storeName, range });
    }
    return this.executeTransaction(storeName, 'readonly', store => {
      return store.getAll(range);
    });
  }

  public async getAllByIndex<T>(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]> {
    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] GetAllByIndex:', { storeName, indexName, query });
    }
    return this.executeTransaction(storeName, 'readonly', store => {
      const index = store.index(indexName);
      return index.getAll(query);
    });
  }

  public async batch(
    actions: ((db: Omit<KritzelDatabase, 'open' | 'close' | 'transaction' | 'batch'>) => Promise<any>)[],
  ): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database is not open.');
    }

   const storeNames = this.extractStoreNamesFromActions(actions);

    if (this.isLoggingEnabled) {
      console.log('[IndexedDB] Starting batch transaction:', { storeNames });
    }

    return new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      const results: any[] = [];
      let completedActions = 0;

      const tempDbInstance = {
        ...this,
        executeTransaction: <T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
          return new Promise<T>((resolveRequest, rejectRequest) => {
            if (this.isLoggingEnabled) {
              console.log('[IndexedDB] Executing batch action:', { storeName, mode });
            }
            const store = transaction.objectStore(storeName);
            const request = action(store);

            request.onsuccess = () => {
              if (this.isLoggingEnabled) {
                console.log('[IndexedDB] Batch action request successful:', { result: request.result });
              }
              resolveRequest(request.result as T);
            };
            request.onerror = () => {
              console.error('[IndexedDB] Batch action request error:', request.error);
              rejectRequest(request.error);
            };
          });
        },
      };

      transaction.oncomplete = () => {
        if (this.isLoggingEnabled) {
          console.log('[IndexedDB] Batch transaction complete.');
        }
        resolve(results);
      };

      transaction.onabort = () => {
        console.error('[IndexedDB] Batch transaction aborted:', transaction.error);
        reject(transaction.error ?? new Error('Transaction aborted'));
      };

      transaction.onerror = () => {
        console.error('Batch transaction error:', transaction.error);
        reject(transaction.error);
      };

      actions.forEach((action, index) => {
        action(tempDbInstance)
          .then(result => {
            results[index] = result;
            completedActions++;
          })
          .catch(err => {
            if (!transaction.error) {
              transaction.abort();
            }
            reject(err);
          });
      });
    });
  }

  private extractStoreNamesFromActions(
    actions: ((db: Omit<KritzelDatabase, 'open' | 'close' | 'transaction' | 'batch'>) => Promise<any>)[]
  ): string[] {
    // Collect store names explicitly declared on each action function via an attached `stores` property.
    // Usage example outside: const action = async db => { ... }; action.stores = ['myStore'];
    if (!actions.length) {
      return [];
    }
    const storeNamesSet = new Set<string>();
    for (const rawAction of actions) {
      const actionWithMeta = rawAction as typeof rawAction & { stores?: string[] };
      if (!actionWithMeta.stores || actionWithMeta.stores.length === 0) {
      throw new Error(
        'Batch action is missing required store metadata. Attach stores: action.stores = ["storeA","storeB"].'
      );
      }
      for (const name of actionWithMeta.stores) {
      storeNamesSet.add(name);
      }
    }
    return Array.from(storeNamesSet);
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

/**
 * IndexedDB implementation of the UOR KnowledgeBase
 * Provides browser-local persistence for UOR records
 */
import { KnowledgeBase, UORRecord } from './uorEncoder'

/**
 * IndexedDB implementation of KnowledgeBase
 * Stores UOR records in IndexedDB for persistence in browser environments
 */
export class IndexedDBKnowledgeBase implements KnowledgeBase {
  private db: IDBDatabase | null = null
  private dbName: string
  private dbVersion: number
  private dbReady: Promise<void>

  /**
   * Constructor
   * @param dbName - Name of the IndexedDB database
   * @param dbVersion - Version of the database schema, use 0 to automatically use existing version
   */
  constructor(dbName = 'uor-knowledge-base', dbVersion = 0) {
    this.dbName = dbName
    this.dbVersion = dbVersion
    this.dbReady = this.initialize()
  }

  /**
   * Initialize the database - exported publicly so it can be called explicitly
   * @returns Promise that resolves when the database is ready
   */
  async initialize(): Promise<void> {
    console.log('IndexedDBKnowledgeBase: Initializing database', this.dbName, this.dbVersion)
    
    if (this.db) {
      console.log('IndexedDBKnowledgeBase: Database already initialized')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('IndexedDBKnowledgeBase: Opening database')
        
        // If version is 0, open without version to use the existing version
        const request = this.dbVersion === 0 
          ? indexedDB.open(this.dbName) 
          : indexedDB.open(this.dbName, this.dbVersion)

        request.onerror = (event) => {
          const error = request.error
          console.error('IndexedDBKnowledgeBase: Error opening database:', error?.name, error?.message)
          
          // Special handling for version error - try to reopen with correct version
          if (error && error.name === 'VersionError') {
            console.log('IndexedDBKnowledgeBase: Detected version mismatch, attempting to recover...')
            
            // Get the correct version by opening without version
            const detectRequest = indexedDB.open(this.dbName)
            detectRequest.onsuccess = () => {
              const correctVersion = detectRequest.result.version
              detectRequest.result.close()
              
              console.log(`IndexedDBKnowledgeBase: Detected correct version: ${correctVersion}, reopening...`)
              this.dbVersion = correctVersion
              
              // Try again with correct version
              const retryRequest = indexedDB.open(this.dbName, correctVersion)
              
              retryRequest.onerror = (retryEvent) => {
                console.error('IndexedDBKnowledgeBase: Error on retry:', retryEvent)
                reject(new Error(`Could not open IndexedDB database after version recovery: ${retryRequest.error?.message}`))
              }
              
              retryRequest.onsuccess = () => {
                this.db = retryRequest.result
                console.log('IndexedDBKnowledgeBase: Database reopened successfully with correct version')
                resolve()
              }
              
              retryRequest.onupgradeneeded = (upgradeEvent) => {
                console.log('IndexedDBKnowledgeBase: Version recovery triggered upgrade')
                const db = retryRequest.result
                
                // Create metadata store if needed
                if (!db.objectStoreNames.contains('__metadata')) {
                  console.log('IndexedDBKnowledgeBase: Creating __metadata store during recovery')
                  db.createObjectStore('__metadata', { keyPath: 'id' })
                }
              }
            }
            
            detectRequest.onerror = () => {
              console.error('IndexedDBKnowledgeBase: Could not detect database version:', detectRequest.error)
              reject(new Error('Could not detect IndexedDB database version'))
            }
            
            return
          }
          
          reject(new Error(`Could not open IndexedDB database: ${error?.message || 'Unknown error'}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          
          // Set the current version if we requested version 0
          if (this.dbVersion === 0) {
            this.dbVersion = this.db.version
          }
          
          console.log(`IndexedDBKnowledgeBase: Database opened successfully (version ${this.db.version})`)
          
          // Log object stores for debugging
          const storeNames = Array.from(this.db.objectStoreNames)
          console.log('IndexedDBKnowledgeBase: Available stores:', storeNames)
          
          resolve()
        }

        request.onupgradeneeded = (event) => {
          console.log('IndexedDBKnowledgeBase: Database upgrade needed - creating metadata store')
          const db = request.result
          
          // Create a metadata store to track resource types
          if (!db.objectStoreNames.contains('__metadata')) {
            console.log('IndexedDBKnowledgeBase: Creating __metadata store')
            db.createObjectStore('__metadata', { keyPath: 'id' })
          }
        }
      } catch (err) {
        console.error('IndexedDBKnowledgeBase: Error in initialize:', err)
        reject(err)
      }
    })
  }

  /**
   * Ensure a store exists for the given resource type
   * @param resourceType - Type of resource
   * @returns Promise that resolves when the store is ready
   * @public - This method can be used to create stores for new types
   */
  async ensureStoreExists(resourceType: string): Promise<void> {
    console.log(`IndexedDBKnowledgeBase: Ensuring store exists for ${resourceType}`)
    
    try {
      // Make sure the database is initialized
      await this.dbReady
      console.log(`IndexedDBKnowledgeBase: Database ready, checking for store ${resourceType}`)

      if (!this.db) {
        console.error('IndexedDBKnowledgeBase: Database not initialized in ensureStoreExists')
        throw new Error('Database not initialized')
      }

      // Check if store exists
      const hasStore = this.db.objectStoreNames.contains(resourceType)
      console.log(`IndexedDBKnowledgeBase: Store ${resourceType} exists: ${hasStore}`)
      
      if (!hasStore) {
        // Need to close and reopen with a new version to create a new store
        const newVersion = this.dbVersion + 1
        console.log(`IndexedDBKnowledgeBase: Closing db and reopening with version ${newVersion}`)
        this.db.close()
        this.db = null

        return new Promise((resolve, reject) => {
          try {
            const request = indexedDB.open(this.dbName, newVersion)

            request.onerror = (event) => {
              const error = request.error
              console.error(`IndexedDBKnowledgeBase: Error upgrading database for ${resourceType}:`, error?.name, error?.message)
              
              // Handle version errors specifically
              if (error && error.name === 'VersionError') {
                console.log(`IndexedDBKnowledgeBase: Version mismatch during store creation, attempting recovery...`)
                
                // Try to detect correct version
                const detectRequest = indexedDB.open(this.dbName)
                
                detectRequest.onsuccess = () => {
                  const correctVersion = detectRequest.result.version
                  const newerVersion = correctVersion + 1
                  detectRequest.result.close()
                  
                  console.log(`IndexedDBKnowledgeBase: Detected version ${correctVersion}, trying with ${newerVersion}`)
                  
                  // Try with correct version + 1
                  const retryRequest = indexedDB.open(this.dbName, newerVersion)
                  
                  retryRequest.onerror = (retryEvent) => {
                    console.error(`IndexedDBKnowledgeBase: Error on store creation retry:`, retryRequest.error)
                    reject(new Error(`Could not create store after version recovery: ${retryRequest.error?.message}`))
                  }
                  
                  retryRequest.onsuccess = () => {
                    this.db = retryRequest.result
                    this.dbVersion = newerVersion
                    console.log(`IndexedDBKnowledgeBase: Database reopened with version ${newerVersion}`)
                    
                    // Need to check if the store was created
                    if (this.db.objectStoreNames.contains(resourceType)) {
                      console.log(`IndexedDBKnowledgeBase: Store ${resourceType} exists after recovery`)
                      resolve()
                    } else {
                      console.error(`IndexedDBKnowledgeBase: Store ${resourceType} still not created after recovery`)
                      reject(new Error(`Store ${resourceType} not created after recovery`))
                    }
                  }
                  
                  retryRequest.onupgradeneeded = (upgradeEvent) => {
                    console.log(`IndexedDBKnowledgeBase: Creating store ${resourceType} during recovery upgrade`)
                    const db = retryRequest.result
                    
                    if (!db.objectStoreNames.contains(resourceType)) {
                      db.createObjectStore(resourceType)
                      
                      // Update metadata if possible
                      if (db.objectStoreNames.contains('__metadata') && retryRequest.transaction) {
                        console.log(`IndexedDBKnowledgeBase: Updating metadata for ${resourceType} during recovery`)
                        const metaStore = retryRequest.transaction.objectStore('__metadata')
                        metaStore.put({ 
                          id: resourceType, 
                          created: new Date().toISOString() 
                        })
                      }
                    }
                  }
                }
                
                detectRequest.onerror = () => {
                  console.error(`IndexedDBKnowledgeBase: Could not detect version during recovery:`, detectRequest.error)
                  reject(new Error(`Could not detect database version for recovery: ${detectRequest.error?.message}`))
                }
                
                return
              }
              
              reject(new Error(`Could not upgrade IndexedDB database for ${resourceType}: ${error?.message || 'Unknown error'}`))
            }

            request.onsuccess = () => {
              this.db = request.result
              this.dbVersion = newVersion
              console.log(`IndexedDBKnowledgeBase: Store for ${resourceType} created successfully`)
              resolve()
            }

            request.onupgradeneeded = (event) => {
              console.log(`IndexedDBKnowledgeBase: Upgrade needed for ${resourceType}`)
              const db = request.result
              if (!db.objectStoreNames.contains(resourceType)) {
                console.log(`IndexedDBKnowledgeBase: Creating store for ${resourceType}`)
                db.createObjectStore(resourceType)
                
                // Also update metadata
                if (db.objectStoreNames.contains('__metadata') && request.transaction) {
                  console.log(`IndexedDBKnowledgeBase: Updating metadata for ${resourceType}`)
                  const metaStore = request.transaction.objectStore('__metadata')
                  metaStore.put({ 
                    id: resourceType, 
                    created: new Date().toISOString() 
                  })
                }
              }
            }
          } catch (err) {
            console.error(`IndexedDBKnowledgeBase: Error in ensureStoreExists for ${resourceType}:`, err)
            reject(err)
          }
        })
      }

      console.log(`IndexedDBKnowledgeBase: Store ${resourceType} already exists`)
      return Promise.resolve()
    } catch (err) {
      console.error(`IndexedDBKnowledgeBase: Error in ensureStoreExists for ${resourceType}:`, err)
      throw err
    }
  }

  /**
   * Get a record from the database
   * @param resourceTypeOrId - Type of the resource or the resource ID if called with a single parameter
   * @param resourceId - ID of the resource (optional if resourceTypeOrId is the ID)
   * @returns Promise that resolves to the record or null if not found
   */
  async get(resourceTypeOrId: string, resourceId?: string): Promise<UORRecord | null> {
    // If only one parameter is provided, assume it's the resource ID
    if (resourceId === undefined) {
      // Search all stores for this ID
      await this.dbReady
      
      if (!this.db) {
        throw new Error('Database not initialized')
      }
      
      // Get all store names
      const storeNames = Array.from(this.db.objectStoreNames)
        .filter(name => !name.startsWith('__')) // Skip internal stores
      
      // Search each store
      for (const storeName of storeNames) {
        try {
          const result = await this.getFromStore(storeName, resourceTypeOrId)
          if (result) {
            return result
          }
        } catch (err) {
          console.error(`Error searching in store ${storeName}:`, err)
        }
      }
      
      // Not found in any store
      return null
    }
    
    // Normal case - resource type and ID provided
    await this.ensureStoreExists(resourceTypeOrId)

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return this.getFromStore(resourceTypeOrId, resourceId)
  }
  
  /**
   * Helper method to get a record from a specific store
   * @param storeName - Name of the store
   * @param recordId - ID of the record
   * @returns Promise that resolves to the record or null if not found
   */
  private getFromStore(storeName: string, recordId: string): Promise<UORRecord | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(recordId)

      request.onerror = (event) => {
        console.error(`Error getting record from ${storeName}:`, event)
        reject(new Error(`Could not get record ${storeName}/${recordId}`))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * Set a record in the database
   * @param resourceType - Type of the resource
   * @param resourceId - ID of the resource
   * @param record - The record to store
   */
  async set(resourceType: string, resourceId: string, record: UORRecord): Promise<void> {
    await this.ensureStoreExists(resourceType)

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([resourceType], 'readwrite')
      const store = transaction.objectStore(resourceType)
      const request = store.put(record, resourceId)

      request.onerror = (event) => {
        console.error('Error setting record:', event)
        reject(new Error(`Could not set record ${resourceType}/${resourceId}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get all resource types stored in the database
   * @returns Promise that resolves to an array of resource types
   * @public - This method is used by the UI to display resource types
   */
  async getResourceTypes(): Promise<string[]> {
    await this.dbReady
    
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    
    // Return all object store names except the metadata store
    return Array.from(this.db.objectStoreNames)
      .filter(name => name !== '__metadata')
  }

  /**
   * Get all records of a given resource type
   * @param resourceType - Type of the resource
   * @returns Promise that resolves to an array of records
   */
  async getAllOfType(resourceType: string): Promise<{id: string, record: UORRecord}[]> {
    await this.ensureStoreExists(resourceType)

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([resourceType], 'readonly')
      const store = transaction.objectStore(resourceType)
      const request = store.getAll()

      request.onerror = (event) => {
        console.error('Error getting records:', event)
        reject(new Error(`Could not get records for ${resourceType}`))
      }

      request.onsuccess = () => {
        const records = request.result || []
        const keysRequest = store.getAllKeys()
        
        // Wait for the keys request to complete
        keysRequest.onsuccess = () => {
          const keys = keysRequest.result || []
          // Combine records with their keys
          const results = records.map((record, index) => ({
            id: keys[index] as string,
            record
          }))
          resolve(results)
        }
        
        keysRequest.onerror = (event) => {
          console.error('Error getting keys:', event)
          reject(new Error(`Could not get keys for ${resourceType}`))
        }
      }
    })
  }

  /**
   * Store type configuration
   * @param typeName - Name of the type
   * @param config - Configuration object for the type
   * @returns Promise that resolves when the configuration is stored
   */
  async storeTypeConfiguration(typeName: string, config: any): Promise<void> {
    // Store type configurations in a special metadata store
    await this.ensureStoreExists('__type_configs')

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['__type_configs'], 'readwrite')
      const store = transaction.objectStore('__type_configs')
      const request = store.put(config, typeName)

      request.onerror = (event) => {
        console.error('Error storing type configuration:', event)
        reject(new Error(`Could not store type configuration for ${typeName}`))
      }

      request.onsuccess = () => {
        console.log(`Type configuration stored for ${typeName}`)
        resolve()
      }
    })
  }

  /**
   * Get type configuration
   * @param typeName - Name of the type
   * @returns Promise that resolves to the type configuration or null if not found
   */
  async getTypeConfiguration(typeName: string): Promise<any | null> {
    // Ensure the type configs store exists
    await this.ensureStoreExists('__type_configs')

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['__type_configs'], 'readonly')
      const store = transaction.objectStore('__type_configs')
      const request = store.get(typeName)

      request.onerror = (event) => {
        console.error('Error getting type configuration:', event)
        reject(new Error(`Could not get type configuration for ${typeName}`))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * Get all type configurations
   * @returns Promise that resolves to an object with type names as keys and configurations as values
   */
  async getAllTypeConfigurations(): Promise<Record<string, any>> {
    // Ensure the type configs store exists
    await this.ensureStoreExists('__type_configs')

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['__type_configs'], 'readonly')
      const store = transaction.objectStore('__type_configs')
      const request = store.getAll()

      request.onerror = (event) => {
        console.error('Error getting type configurations:', event)
        reject(new Error('Could not get type configurations'))
      }

      request.onsuccess = () => {
        const records = request.result || []
        const keysRequest = store.getAllKeys()
        
        keysRequest.onsuccess = () => {
          const keys = keysRequest.result || []
          // Create an object with type names as keys and configurations as values
          const configs: Record<string, any> = {}
          keys.forEach((key, index) => {
            configs[key as string] = records[index]
          })
          resolve(configs)
        }
        
        keysRequest.onerror = (event) => {
          console.error('Error getting type configuration keys:', event)
          reject(new Error('Could not get type configuration keys'))
        }
      }
    })
  }

  /**
   * Delete type configuration
   * @param typeName - Name of the type to delete
   * @returns Promise that resolves when the configuration is deleted
   */
  async deleteTypeConfiguration(typeName: string): Promise<void> {
    // Ensure the type configs store exists
    await this.ensureStoreExists('__type_configs')

    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['__type_configs'], 'readwrite')
      const store = transaction.objectStore('__type_configs')
      const request = store.delete(typeName)

      request.onerror = (event) => {
        console.error('Error deleting type configuration:', event)
        reject(new Error(`Could not delete type configuration for ${typeName}`))
      }

      request.onsuccess = () => {
        console.log(`Type configuration deleted for ${typeName}`)
        resolve()
      }
    })
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
/**
 * Hash Store - Content-addressable storage for primitive values
 * 
 * Stores primitive values by their content hash, allowing multiple schemas
 * to reference the same value without duplication.
 */

import { KnowledgeBase } from './uorEncoder';

/**
 * Interface for a primitive value
 */
export interface PrimitiveValue {
  value: any;
  type: string;
  metadata?: Record<string, any>;
}

/**
 * Hash Store - Content-addressable storage system
 */
export class HashStore {
  private knowledgeBase: KnowledgeBase;
  private resourceType = 'primitives';
  
  /**
   * Create a new HashStore
   * @param knowledgeBase - The knowledge base to use for storage
   */
  constructor(knowledgeBase: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase;
  }
  
  /**
   * Store a primitive value
   * @param value - The value to store
   * @param type - The type of the value (string, number, object, etc.)
   * @param metadata - Optional metadata about the value
   * @returns The hash of the stored value
   */
  async store(value: any, type: string, metadata?: Record<string, any>): Promise<string> {
    // Generate a hash for the value
    const hash = await this.hashValue(value);
    
    // Create a primitive value object
    const primitive: PrimitiveValue = {
      value,
      type,
      metadata
    };
    
    // Store the primitive by its hash
    await this.knowledgeBase.set(this.resourceType, hash, {
      resource: primitive,
      resourceType: this.resourceType
    });
    
    return hash;
  }
  
  /**
   * Retrieve a primitive value by its hash
   * @param hash - The hash of the value
   * @returns The primitive value or null if not found
   */
  async retrieve(hash: string): Promise<PrimitiveValue | null> {
    const record = await this.knowledgeBase.get(this.resourceType, hash);
    return record ? record.resource : null;
  }
  
  /**
   * Check if a value exists in the store
   * @param value - The value to check
   * @returns True if the value exists, false otherwise
   */
  async exists(value: any): Promise<boolean> {
    const hash = await this.hashValue(value);
    const record = await this.knowledgeBase.get(this.resourceType, hash);
    return !!record;
  }
  
  /**
   * Get the hash for a value
   * @param value - The value to hash
   * @returns The hash of the value
   */
  async hashValue(value: any): Promise<string> {
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    // Use the Web Crypto API which is available in all modern browsers
    const encoder = new TextEncoder();
    const data = encoder.encode(stringValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert the hash to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  /**
   * Synchronous version of hashValue using a simple algorithm
   * This is used when async operations aren't possible
   * @param value - The value to hash
   * @returns The hash of the value
   */
  hashValueSync(value: any): string {
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    // Simple FNV-1a hash algorithm
    let h = 2166136261; // FNV offset basis
    for (let i = 0; i < stringValue.length; i++) {
      h ^= stringValue.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    
    // Return as hex string
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  
  /**
   * Store multiple primitive values
   * @param primitives - Array of primitives to store
   * @returns Array of hashes for the stored values
   */
  async storeMany(
    primitives: Array<{value: any, type: string, metadata?: Record<string, any>}>
  ): Promise<string[]> {
    const hashes: string[] = [];
    
    for (const { value, type, metadata } of primitives) {
      const hash = await this.store(value, type, metadata);
      hashes.push(hash);
    }
    
    return hashes;
  }
}
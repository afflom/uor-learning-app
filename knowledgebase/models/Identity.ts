/**
 * Identity Model
 * 
 * Fundamental anchor for resources in the UOR system.
 * Identities sign records and serve as invariant references.
 */

import { UORRecord } from '../uorEncoder';

export interface IdentityAttributes {
  id: string; // Unique identifier
  name: string; // Display name for the identity
  publicKey?: string; // Optional public key for verification
  created: string; // ISO date string of creation
  metadata: Record<string, any>; // Extensible metadata
}

export interface Identity extends IdentityAttributes {
  signRecord(record: UORRecord): Promise<UORRecord>;
  verify(record: UORRecord): Promise<boolean>;
}

export class IdentityImpl implements Identity {
  id: string;
  name: string;
  publicKey?: string;
  created: string;
  metadata: Record<string, any>;
  private secretKey?: string; // Only stored for the active identity

  constructor(attributes: IdentityAttributes, secretKey?: string) {
    this.id = attributes.id;
    this.name = attributes.name;
    this.publicKey = attributes.publicKey;
    this.created = attributes.created;
    this.metadata = attributes.metadata || {};
    this.secretKey = secretKey;
  }

  /**
   * Sign a record with this identity
   * @param record The record to sign
   * @returns The signed record
   */
  async signRecord(record: UORRecord): Promise<UORRecord> {
    if (!this.secretKey) {
      throw new Error('Cannot sign with this identity - no secret key available');
    }

    // Create a copy to avoid modifying the original
    const signedRecord = JSON.parse(JSON.stringify(record));
    
    // Add or update signatures
    if (!signedRecord.resource.__signatures) {
      signedRecord.resource.__signatures = [];
    }
    
    // Add this identity's signature
    signedRecord.resource.__signatures.push({
      identityId: this.id,
      timestamp: new Date().toISOString(),
      // In a real implementation, this would be a cryptographic signature
      signature: `signed-by-${this.id}-${Date.now()}`
    });
    
    return signedRecord;
  }

  /**
   * Verify if this record was signed by this identity
   * @param record The record to verify
   * @returns True if signed by this identity
   */
  async verify(record: UORRecord): Promise<boolean> {
    if (!record.resource.__signatures) {
      return false;
    }
    
    // Check if this identity's ID is in the signatures
    return record.resource.__signatures.some(
      (sig: any) => sig.identityId === this.id
    );
  }

  /**
   * Create a new identity
   * @param name Display name for the identity
   * @param metadata Additional metadata
   * @returns A new identity instance
   */
  static create(name: string, metadata: Record<string, any> = {}): IdentityImpl {
    // In a real implementation, would generate proper keypair
    const id = `identity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const created = new Date().toISOString();
    
    return new IdentityImpl({
      id,
      name,
      created,
      metadata,
      // Would generate real keys here
      publicKey: `public-${id}`
    }, `secret-${id}`);
  }

  /**
   * Convert to a plain object for storage
   */
  toStorageObject(): IdentityAttributes {
    return {
      id: this.id,
      name: this.name,
      publicKey: this.publicKey,
      created: this.created,
      metadata: this.metadata
    };
  }
}
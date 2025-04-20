/**
 * User Model
 * 
 * Users can have multiple identities and serve as the operational 
 * entity when interacting with the system.
 */

import { IdentityAttributes, IdentityImpl } from './Identity';

export interface UserAttributes {
  id: string; // Unique identifier
  username: string; // Username for display and reference
  displayName?: string; // Optional display name
  created: string; // ISO date string of creation
  linkedIdentities: string[]; // Array of identity IDs linked to this user
  activeIdentityId?: string; // Currently active identity ID
  settings: Record<string, any>; // User preferences and settings
  metadata: Record<string, any>; // Extensible metadata
}

export interface User extends UserAttributes {
  addIdentity(identity: IdentityAttributes): Promise<void>;
  removeIdentity(identityId: string): Promise<void>;
  setActiveIdentity(identityId: string): Promise<void>;
  hasIdentity(identityId: string): boolean;
}

export class UserImpl implements User {
  id: string;
  username: string;
  displayName?: string;
  created: string;
  linkedIdentities: string[];
  activeIdentityId?: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;

  constructor(attributes: UserAttributes) {
    this.id = attributes.id;
    this.username = attributes.username;
    this.displayName = attributes.displayName;
    this.created = attributes.created;
    this.linkedIdentities = attributes.linkedIdentities || [];
    this.activeIdentityId = attributes.activeIdentityId;
    this.settings = attributes.settings || {};
    this.metadata = attributes.metadata || {};
  }

  /**
   * Add an identity to this user
   * @param identity The identity to add
   */
  async addIdentity(identity: IdentityAttributes): Promise<void> {
    if (!this.linkedIdentities.includes(identity.id)) {
      this.linkedIdentities.push(identity.id);
      
      // If no active identity is set, make this the active one
      if (!this.activeIdentityId) {
        this.activeIdentityId = identity.id;
      }
    }
  }

  /**
   * Remove an identity from this user
   * @param identityId The ID of the identity to remove
   */
  async removeIdentity(identityId: string): Promise<void> {
    this.linkedIdentities = this.linkedIdentities.filter(id => id !== identityId);
    
    // If we removed the active identity, select another if available
    if (this.activeIdentityId === identityId) {
      this.activeIdentityId = this.linkedIdentities.length > 0 
        ? this.linkedIdentities[0] 
        : undefined;
    }
  }

  /**
   * Set the active identity for this user
   * @param identityId The ID of the identity to make active
   */
  async setActiveIdentity(identityId: string): Promise<void> {
    if (!this.linkedIdentities.includes(identityId)) {
      throw new Error(`Identity ${identityId} is not linked to this user`);
    }
    
    this.activeIdentityId = identityId;
  }

  /**
   * Check if a specific identity is linked to this user
   * @param identityId The identity ID to check
   * @returns True if the identity is linked to this user
   */
  hasIdentity(identityId: string): boolean {
    return this.linkedIdentities.includes(identityId);
  }

  /**
   * Create a new user with an initial identity
   * @param username Username for the new user
   * @param displayName Optional display name
   * @param initialIdentity Optional initial identity (will create one if not provided)
   * @returns A new user with linked identity
   */
  static async create(
    username: string, 
    displayName?: string,
    initialIdentity?: IdentityAttributes
  ): Promise<{ user: UserImpl, identity: IdentityImpl }> {
    // Create a new identity if none provided
    const identity = initialIdentity 
      ? new IdentityImpl(initialIdentity)
      : IdentityImpl.create(displayName || username);
      
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const user = new UserImpl({
      id: userId,
      username,
      displayName,
      created: new Date().toISOString(),
      linkedIdentities: [identity.id],
      activeIdentityId: identity.id,
      settings: {},
      metadata: {}
    });
    
    return { user, identity };
  }

  /**
   * Convert to a plain object for storage
   */
  toStorageObject(): UserAttributes {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      created: this.created,
      linkedIdentities: this.linkedIdentities,
      activeIdentityId: this.activeIdentityId,
      settings: this.settings,
      metadata: this.metadata
    };
  }
}
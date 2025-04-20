/**
 * Identity Provider
 * 
 * Manages user identities, authentication, and record signing within the UOR system.
 */
import { IndexedDBKnowledgeBase } from './indexedDbKnowledgeBase';
import { UOREncoder, UORRecord } from './uorEncoder';
import { IdentityImpl, IdentityAttributes } from './models/Identity';
import { UserImpl, UserAttributes } from './models/User';

// Resource types used by the identity system
const RESOURCE_TYPES = {
  IDENTITY: 'uor/Identity',
  USER: 'uor/User',
  IDENTITY_USER_LINK: 'uor/IdentityUserLink'
};

export class IdentityProvider {
  private knowledgeBase: IndexedDBKnowledgeBase;
  private encoder: UOREncoder;
  private currentUser?: UserImpl;
  private currentIdentity?: IdentityImpl;
  private identityCache: Map<string, IdentityImpl> = new Map();
  private initialized = false;
  
  /**
   * Create a new identity provider
   * @param dbName Optional name for the database
   */
  constructor(dbName = 'uor-kb') {
    this.knowledgeBase = new IndexedDBKnowledgeBase(dbName, 0);
    this.encoder = new UOREncoder(this.knowledgeBase);
  }
  
  /**
   * Initialize the identity provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Ensure stores exist for our resource types
    await this.knowledgeBase.ensureStoreExists(RESOURCE_TYPES.IDENTITY);
    await this.knowledgeBase.ensureStoreExists(RESOURCE_TYPES.USER);
    await this.knowledgeBase.ensureStoreExists(RESOURCE_TYPES.IDENTITY_USER_LINK);
    
    this.initialized = true;
  }
  
  /**
   * Register a new user with a new identity
   * @param username Username for the new user
   * @param displayName Optional display name
   * @returns The newly created user and identity
   */
  async register(username: string, displayName?: string): Promise<{ user: UserImpl, identity: IdentityImpl }> {
    await this.initialize();
    
    // Create a new user and identity
    const { user, identity } = await UserImpl.create(username, displayName);
    
    // Store the identity
    await this.storeIdentity(identity);
    
    // Store the user
    await this.storeUser(user);
    
    // Set as current user and identity
    this.currentUser = user;
    this.currentIdentity = identity;
    this.identityCache.set(identity.id, identity);
    
    return { user, identity };
  }
  
  /**
   * Log in as an existing user
   * @param userId The ID of the user to log in as
   * @returns The user and active identity
   */
  async login(userId: string): Promise<{ user: UserImpl, identity: IdentityImpl }> {
    await this.initialize();
    
    // Get the user record
    const userRecord = await this.knowledgeBase.get(RESOURCE_TYPES.USER, userId);
    if (!userRecord) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const user = new UserImpl(userRecord.resource as UserAttributes);
    
    // Get the active identity
    if (!user.activeIdentityId) {
      throw new Error(`User ${userId} has no active identity`);
    }
    
    const identity = await this.getIdentity(user.activeIdentityId);
    if (!identity) {
      throw new Error(`Active identity ${user.activeIdentityId} not found`);
    }
    
    // Set as current user and identity
    this.currentUser = user;
    this.currentIdentity = identity;
    
    return { user, identity };
  }
  
  /**
   * Log out the current user
   */
  logout(): void {
    this.currentUser = undefined;
    this.currentIdentity = undefined;
    // Clear the identity cache to prevent memory leaks
    this.identityCache.clear();
  }
  
  /**
   * Get the current logged-in user
   * @returns The current user or undefined if not logged in
   */
  getCurrentUser(): UserImpl | undefined {
    return this.currentUser;
  }
  
  /**
   * Get the current active identity
   * @returns The current identity or undefined if not logged in
   */
  getCurrentIdentity(): IdentityImpl | undefined {
    return this.currentIdentity;
  }
  
  /**
   * Switch the active identity for the current user
   * @param identityId The ID of the identity to make active
   */
  async switchIdentity(identityId: string): Promise<IdentityImpl> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Make sure this identity is linked to the user
    if (!this.currentUser.hasIdentity(identityId)) {
      throw new Error(`Identity ${identityId} is not linked to the current user`);
    }
    
    // Get the identity
    const identity = await this.getIdentity(identityId);
    if (!identity) {
      throw new Error(`Identity ${identityId} not found`);
    }
    
    // Update the user
    await this.currentUser.setActiveIdentity(identityId);
    
    // Update the stored user record
    await this.storeUser(this.currentUser);
    
    // Set as current identity
    this.currentIdentity = identity;
    
    return identity;
  }
  
  /**
   * Create a new identity for the current user
   * @param name Name for the new identity
   * @param metadata Optional metadata
   * @returns The newly created identity
   */
  async createIdentity(name: string, metadata: Record<string, any> = {}): Promise<IdentityImpl> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Create a new identity
    const identity = IdentityImpl.create(name, metadata);
    
    // Store the identity
    await this.storeIdentity(identity);
    
    // Link to the current user
    await this.currentUser.addIdentity(identity.toStorageObject());
    
    // Update the stored user record
    await this.storeUser(this.currentUser);
    
    // Add to cache
    this.identityCache.set(identity.id, identity);
    
    return identity;
  }
  
  /**
   * Remove an identity from the current user
   * @param identityId The ID of the identity to remove
   */
  async removeIdentity(identityId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Cannot remove the last identity
    if (this.currentUser.linkedIdentities.length <= 1) {
      throw new Error('Cannot remove the last identity from a user');
    }
    
    // Remove from the user
    await this.currentUser.removeIdentity(identityId);
    
    // Update the stored user record
    await this.storeUser(this.currentUser);
    
    // If this was the current identity, update it
    if (this.currentIdentity?.id === identityId) {
      this.currentIdentity = await this.getIdentity(this.currentUser.activeIdentityId!);
    }
    
    // Remove from cache
    this.identityCache.delete(identityId);
  }
  
  /**
   * Sign a record with the current identity
   * @param record The record to sign
   * @returns The signed record
   */
  async signRecord(record: UORRecord): Promise<UORRecord> {
    if (!this.currentIdentity) {
      throw new Error('No identity is currently active');
    }
    
    // Get the signed record
    const signedRecord = await this.currentIdentity.signRecord(record);
    
    // Make sure imported flag is preserved
    if (record.imported) {
      signedRecord.imported = true;
    }
    
    return signedRecord;
  }
  
  /**
   * Create a new record (not imported)
   * @param resource The resource data
   * @param resourceType The resource type
   * @returns The created record with ID
   */
  async createRecord(
    resource: any, 
    resourceType: string
  ): Promise<{ id: string, record: UORRecord }> {
    if (!this.currentIdentity) {
      throw new Error('No identity is currently active');
    }
    
    await this.initialize();
    
    // Create a record - created records are always signed
    const { UOREncoder } = await import('./uorEncoder');
    const encoder = new UOREncoder(this.knowledgeBase);
    
    const id = await encoder.encode(
      resource,
      resourceType,
      this.currentIdentity.id,
      { imported: false, signed: true }
    );
    
    // Get the record back
    const record = await this.knowledgeBase.get(resourceType, id);
    if (!record) {
      throw new Error('Failed to retrieve created record');
    }
    
    return { id, record };
  }
  
  /**
   * Import a record (externally sourced)
   * @param resource The resource data
   * @param resourceType The resource type
   * @param sign Whether to sign the imported record
   * @returns The imported record with ID
   */
  async importRecord(
    resource: any, 
    resourceType: string,
    sign = false
  ): Promise<{ id: string, record: UORRecord }> {
    await this.initialize();
    
    const { UOREncoder } = await import('./uorEncoder');
    const encoder = new UOREncoder(this.knowledgeBase);
    
    // Import the record - only sign if explicitly requested
    const id = await encoder.encode(
      resource,
      resourceType,
      this.currentIdentity?.id,
      { imported: true, signed: sign }
    );
    
    // Get the record back
    const record = await this.knowledgeBase.get(resourceType, id);
    if (!record) {
      throw new Error('Failed to retrieve imported record');
    }
    
    return { id, record };
  }
  
  /**
   * Verify if a record was signed by a specific identity
   * @param record The record to verify
   * @param identityId The ID of the identity to check
   * @returns True if signed by the specified identity
   */
  async verifyRecord(record: UORRecord, identityId?: string): Promise<boolean> {
    // If no identity ID specified, use current identity
    const idToCheck = identityId || this.currentIdentity?.id;
    if (!idToCheck) {
      throw new Error('No identity specified for verification');
    }
    
    // Get the identity if not using current
    const identity = idToCheck === this.currentIdentity?.id
      ? this.currentIdentity
      : await this.getIdentity(idToCheck);
      
    if (!identity) {
      throw new Error(`Identity ${idToCheck} not found`);
    }
    
    return identity.verify(record);
  }
  
  /**
   * Get all users in the system
   * @returns Array of user objects
   */
  async getAllUsers(): Promise<UserImpl[]> {
    await this.initialize();
    
    // @ts-ignore - Use internal getAllOfType method
    const users = await this.knowledgeBase.getAllOfType(RESOURCE_TYPES.USER);
    
    return users.map(item => new UserImpl(item.record.resource as UserAttributes));
  }
  
  /**
   * Get all identities for the current user
   * @returns Array of identity objects
   */
  async getUserIdentities(): Promise<IdentityImpl[]> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    const identities: IdentityImpl[] = [];
    
    for (const identityId of this.currentUser.linkedIdentities) {
      const identity = await this.getIdentity(identityId);
      if (identity) {
        identities.push(identity);
      }
    }
    
    return identities;
  }
  
  // Private helper methods
  
  /**
   * Store an identity in the knowledge base
   * @param identity The identity to store
   */
  private async storeIdentity(identity: IdentityImpl): Promise<void> {
    const record: UORRecord = {
      resource: identity.toStorageObject(),
      resourceType: RESOURCE_TYPES.IDENTITY
    };
    
    await this.knowledgeBase.set(RESOURCE_TYPES.IDENTITY, identity.id, record);
  }
  
  /**
   * Store a user in the knowledge base
   * @param user The user to store
   */
  private async storeUser(user: UserImpl): Promise<void> {
    const record: UORRecord = {
      resource: user.toStorageObject(),
      resourceType: RESOURCE_TYPES.USER
    };
    
    await this.knowledgeBase.set(RESOURCE_TYPES.USER, user.id, record);
  }
  
  /**
   * Get an identity by ID
   * @param identityId The ID of the identity to retrieve
   * @returns The identity or undefined if not found
   */
  private async getIdentity(identityId: string): Promise<IdentityImpl | undefined> {
    // Check cache first
    if (this.identityCache.has(identityId)) {
      return this.identityCache.get(identityId);
    }
    
    const record = await this.knowledgeBase.get(RESOURCE_TYPES.IDENTITY, identityId);
    if (!record) {
      return undefined;
    }
    
    const identity = new IdentityImpl(record.resource as IdentityAttributes);
    
    // Add to cache
    this.identityCache.set(identityId, identity);
    
    return identity;
  }
}
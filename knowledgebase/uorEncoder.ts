/**
 * UOR Encoder - Core Implementation
 * 
 * Implementation focusing on resource/resourceType model with identity support.
 */

/**
 * UOR Signature - Identity signature for a record
 */
interface UORSignature {
  identityId: string;  // Identity that signed the record
  timestamp: string;   // When the record was signed
  signature: string;   // The actual signature value
}

/**
 * UOR Record - The fundamental unit in the UOR system
 */
interface UORRecord {
  resource: any;        // The actual data
  resourceType: string; // The type identifier
  createdBy?: string;   // Identity that created the record
  signatures?: UORSignature[]; // Signatures on this record
  imported?: boolean;   // Flag indicating if this record was imported
}

/**
 * UOR Pointer - Reference to a resource
 */
interface UORPointer {
  resourceType: string; // Type of the resource being pointed to
  resourceId: string;   // Identifier of the resource
}

/**
 * Knowledge Base interface - Storage for UOR Records
 */
interface KnowledgeBase {
  get(resourceType: string, resourceId: string): Promise<UORRecord | null>;
  set(resourceType: string, resourceId: string, record: UORRecord): Promise<void>;
}

/**
 * In-memory implementation of Knowledge Base
 */
class InMemoryKnowledgeBase implements KnowledgeBase {
  private storage: Record<string, Record<string, UORRecord>> = {};

  async get(resourceType: string, resourceId: string): Promise<UORRecord | null> {
    if (!this.storage[resourceType]) return null;
    return this.storage[resourceType][resourceId] || null;
  }

  async set(resourceType: string, resourceId: string, record: UORRecord): Promise<void> {
    if (!this.storage[resourceType]) {
      this.storage[resourceType] = {};
    }
    this.storage[resourceType][resourceId] = record;
  }
}

/**
 * UOR Encoder - Core implementation
 */
class UOREncoder {
  constructor(private knowledgeBase: KnowledgeBase) {}

  /**
   * Encode a resource with its type
   * @param resource - The resource to encode
   * @param resourceType - The type of the resource
   * @param identityId - Identity ID of the creator (required for created records)
   * @param options - Additional options for encoding
   * @returns The ID of the encoded resource
   */
  async encode(
    resource: any, 
    resourceType: string, 
    identityId?: string,
    options: { 
      imported?: boolean,
      signed?: boolean 
    } = {}
  ): Promise<string> {
    // Extract or generate an ID for the resource
    const resourceId = resource.id || resource['@id'] || `${resourceType}_${Date.now()}`;
    
    // Set defaults for options
    const isImported = options.imported ?? false;
    const shouldSign = options.signed ?? !isImported; // Sign by default if not imported
    
    // Create a UOR record
    const record: UORRecord = {
      resource,
      resourceType,
      imported: isImported
    };
    
    // A record must have a creator identity unless it's imported
    if (!isImported && !identityId) {
      throw new Error('Created records must have a creator identity');
    }
    
    // Add creator identity if provided
    if (identityId) {
      record.createdBy = identityId;
      
      // Sign the record if it should be signed
      if (shouldSign) {
        if (!record.signatures) {
          record.signatures = [];
        }
        
        record.signatures.push({
          identityId,
          timestamp: new Date().toISOString(),
          signature: `signed-by-${identityId}-${Date.now()}`
        });
      }
    }
    
    // Process any references to other resources
    await this.processReferences(record);
    
    // Store the record
    await this.knowledgeBase.set(resourceType, resourceId, record);
    
    return resourceId;
  }
  
  /**
   * Sign a record with an identity
   * @param resourceType - Type of the resource
   * @param resourceId - ID of the resource
   * @param identityId - ID of the signing identity
   * @param signature - Signature value
   * @returns The updated record
   */
  async signRecord(
    resourceType: string, 
    resourceId: string, 
    identityId: string, 
    signature: string
  ): Promise<UORRecord | null> {
    // Get the record
    const record = await this.knowledgeBase.get(resourceType, resourceId);
    if (!record) return null;
    
    // Add signature
    if (!record.signatures) {
      record.signatures = [];
    }
    
    // Add the new signature
    record.signatures.push({
      identityId,
      timestamp: new Date().toISOString(),
      signature
    });
    
    // Update the record
    await this.knowledgeBase.set(resourceType, resourceId, record);
    
    return record;
  }
  
  /**
   * Check if a record is signed by a specific identity
   * @param resourceType - Type of the resource
   * @param resourceId - ID of the resource
   * @param identityId - ID of the identity to check
   * @returns True if signed by the identity
   */
  async isSignedBy(
    resourceType: string, 
    resourceId: string, 
    identityId: string
  ): Promise<boolean> {
    // Get the record
    const record = await this.knowledgeBase.get(resourceType, resourceId);
    if (!record || !record.signatures) return false;
    
    // Check if signed by the identity
    return record.signatures.some(sig => sig.identityId === identityId);
  }

  /**
   * Recursively process references in a resource
   * @param record - The UOR record to process
   */
  private async processReferences(record: UORRecord): Promise<void> {
    const resource = record.resource;
    
    // Skip if not an object
    if (!resource || typeof resource !== 'object') return;
    
    // Process arrays
    if (Array.isArray(resource)) {
      for (let i = 0; i < resource.length; i++) {
        if (resource[i] && typeof resource[i] === 'object') {
          // Check if this is a reference to another resource
          if (this.isResourceReference(resource[i])) {
            // Convert to a UOR pointer
            const pointer = await this.createPointer(resource[i]);
            resource[i] = pointer;
          } else {
            // Recursively process
            await this.processReferences({
              resource: resource[i],
              resourceType: record.resourceType
            });
          }
        }
      }
      return;
    }
    
    // Process object properties
    for (const key in resource) {
      if (resource[key] && typeof resource[key] === 'object') {
        // Check if this is a reference to another resource
        if (this.isResourceReference(resource[key])) {
          // Convert to a UOR pointer
          const pointer = await this.createPointer(resource[key]);
          resource[key] = pointer;
        } else {
          // Recursively process
          await this.processReferences({
            resource: resource[key],
            resourceType: record.resourceType
          });
        }
      }
    }
  }

  /**
   * Check if an object is a reference to another resource
   * @param obj - The object to check
   * @returns True if this is a resource reference
   */
  private isResourceReference(obj: any): boolean {
    // A resource reference must have a type indicator
    // For schema.org, this is @type
    // This could be expanded for other type systems
    return obj && typeof obj === 'object' && (
      obj['@type'] !== undefined ||
      obj['type'] !== undefined ||
      obj['resourceType'] !== undefined
    );
  }

  /**
   * Create a UOR pointer for a resource reference
   * @param reference - The resource reference
   * @returns A UOR pointer
   */
  private async createPointer(reference: any): Promise<UORPointer> {
    // Determine the resource type
    const resourceType = reference['@type'] || reference['type'] || reference['resourceType'];
    
    // Extract or generate an ID
    const resourceId = reference.id || reference['@id'] || `${resourceType}_${Date.now()}`;
    
    // Check if this resource already exists
    const existingRecord = await this.knowledgeBase.get(resourceType, resourceId);
    
    if (!existingRecord) {
      // Store the referenced resource
      const record: UORRecord = {
        resource: reference,
        resourceType
      };
      
      // Process any nested references
      await this.processReferences(record);
      
      // Store the record
      await this.knowledgeBase.set(resourceType, resourceId, record);
    }
    
    // Return a pointer
    return {
      resourceType,
      resourceId
    };
  }

  /**
   * Decode a resource from the knowledge base
   * @param resourceType - The type of the resource
   * @param resourceId - The ID of the resource
   * @returns The decoded resource
   */
  async decode(resourceType: string, resourceId: string): Promise<any> {
    // Retrieve the record
    const record = await this.knowledgeBase.get(resourceType, resourceId);
    if (!record) return null;
    
    // Create a copy to avoid modifying the stored record
    const result = JSON.parse(JSON.stringify(record.resource));
    
    // Resolve any pointers
    await this.resolvePointers(result);
    
    return result;
  }

  /**
   * Recursively resolve pointers in a resource
   * @param resource - The resource to process
   */
  private async resolvePointers(resource: any): Promise<void> {
    // Skip if not an object
    if (!resource || typeof resource !== 'object') return;
    
    // Process arrays
    if (Array.isArray(resource)) {
      for (let i = 0; i < resource.length; i++) {
        if (this.isPointer(resource[i])) {
          // Resolve pointer
          resource[i] = await this.resolvePointer(resource[i]);
        } else if (resource[i] && typeof resource[i] === 'object') {
          // Recursively process
          await this.resolvePointers(resource[i]);
        }
      }
      return;
    }
    
    // Process object properties
    for (const key in resource) {
      if (this.isPointer(resource[key])) {
        // Resolve pointer
        resource[key] = await this.resolvePointer(resource[key]);
      } else if (resource[key] && typeof resource[key] === 'object') {
        // Recursively process
        await this.resolvePointers(resource[key]);
      }
    }
  }

  /**
   * Check if an object is a UOR pointer
   * @param obj - The object to check
   * @returns True if this is a UOR pointer
   */
  private isPointer(obj: any): boolean {
    return obj && 
           typeof obj === 'object' && 
           'resourceType' in obj && 
           'resourceId' in obj;
  }

  /**
   * Resolve a UOR pointer to its resource
   * @param pointer - The UOR pointer
   * @returns The resolved resource
   */
  private async resolvePointer(pointer: UORPointer): Promise<any> {
    // Retrieve the record
    const record = await this.knowledgeBase.get(pointer.resourceType, pointer.resourceId);
    if (!record) return null;
    
    // Create a copy to avoid modifying the stored record
    const result = JSON.parse(JSON.stringify(record.resource));
    
    // Resolve any nested pointers
    await this.resolvePointers(result);
    
    return result;
  }
}

/**
 * Test function for verifying encoder/decoder synchronization
 */
async function testEncoderDecoderSync(): Promise<boolean> {
  console.log("Testing UOR encoder/decoder synchronization...");
  
  // Create a knowledge base and encoder
  const kb = new InMemoryKnowledgeBase();
  const encoder = new UOREncoder(kb);
  
  // Test 1: Simple schema.org object
  const intrinsicPrimes = {
    "@context": "https://schema.org",
    "@type": "MathematicalObject",
    "@id": "intrinsicPrimes",
    "name": "Intrinsic Primes",
    "description": "Fundamental building blocks in UOR"
  };
  
  // Encode
  const id1 = await encoder.encode(intrinsicPrimes, "schema.org/MathematicalObject");
  console.log(`Encoded with ID: ${id1}`);
  
  // Decode
  const decoded1 = await encoder.decode("schema.org/MathematicalObject", id1);
  console.log("Decoded:", decoded1);
  
  // Verify
  const test1Pass = 
    decoded1.name === intrinsicPrimes.name &&
    decoded1.description === intrinsicPrimes.description;
    
  console.log(`Test 1 (Simple object): ${test1Pass ? 'PASS' : 'FAIL'}`);
  
  // Test 2: Nested references
  // Create a related concept first
  const relatedConcept = {
    "@context": "https://schema.org",
    "@type": "MathematicalObject",
    "@id": "intrinsicPrimes-ref", // Use a different ID to avoid conflict with Test 1
    "name": "Intrinsic Primes Referenced",
    "description": "Referenced concept for testing"
  };
  
  // Encode the related concept independently first
  const relatedId = await encoder.encode(relatedConcept, "schema.org/MathematicalObject");
  console.log(`Encoded related concept with ID: ${relatedId}`);
  
  // Create an object with a reference to the related concept
  const uniqueFactorization = {
    "@context": "https://schema.org",
    "@type": "MathematicalObject",
    "@id": "uniqueFactorization",
    "name": "Unique Factorization",
    "relatedConcept": {
      "@type": "MathematicalObject",
      "@id": "intrinsicPrimes-ref", // This ID must match the one above
      "name": "Intrinsic Primes Referenced", // Should match the name above
      "description": "Referenced concept for testing" // Include description to match
    }
  };
  
  // Encode the main object
  const id2 = await encoder.encode(uniqueFactorization, "schema.org/MathematicalObject");
  console.log(`Encoded main object with ID: ${id2}`);
  
  // Decode the main object (should resolve the reference)
  const decoded2 = await encoder.decode("schema.org/MathematicalObject", id2);
  console.log("Decoded with resolved references:", JSON.stringify(decoded2, null, 2));
  
  // Verify the results
  console.log('Expected main name:', uniqueFactorization.name);
  console.log('Actual main name:', decoded2.name);
  console.log('Expected related name:', relatedConcept.name);
  console.log('Actual related name:', decoded2.relatedConcept ? decoded2.relatedConcept.name : 'undefined');
  console.log('Expected related description:', relatedConcept.description);
  console.log('Actual related description:', decoded2.relatedConcept ? decoded2.relatedConcept.description : 'undefined');
  
  const test2Pass = 
    decoded2.name === uniqueFactorization.name &&
    decoded2.relatedConcept &&
    decoded2.relatedConcept.name === relatedConcept.name &&
    decoded2.relatedConcept.description === relatedConcept.description;
    
  console.log(`Test 2 (Nested references): ${test2Pass ? 'PASS' : 'FAIL'}`);
  
  return test1Pass && test2Pass;
}

// Export
export {
  UOREncoder,
  InMemoryKnowledgeBase,
  testEncoderDecoderSync
};

// Export types
export type {
  KnowledgeBase,
  UORRecord,
  UORPointer,
  UORSignature
};

// Don't auto-run the test - we'll run it from runTest.js
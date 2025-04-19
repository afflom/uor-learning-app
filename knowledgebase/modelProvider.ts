/**
 * Model Provider - Interface and implementations for model providers
 * 
 * Model providers process content and create their own UOR records
 * that link to the underlying artifacts.
 */

import { KnowledgeBase } from './uorEncoder';
import { HashStore } from './hashStore';

/**
 * Interface for a model provider
 */
export interface ModelProvider {
  /**
   * Get the unique identifier for this model provider
   */
  getProviderId(): string;
  
  /**
   * Process content and create UOR records
   * @param content - The content to process
   * @param contentType - Type of the content
   * @param contentId - ID of the content
   * @returns The ID of the created model output record
   */
  processContent(content: any, contentType: string, contentId: string): Promise<string>;
  
  /**
   * Get model output by ID
   * @param outputId - The ID of the output to retrieve
   * @returns The model output
   */
  getOutput(outputId: string): Promise<any | null>;
  
  /**
   * Find model outputs for a given content ID
   * @param contentId - ID of the content
   * @returns Array of output IDs
   */
  findOutputsForContent(contentId: string): Promise<string[]>;
}

/**
 * Base class for model providers
 */
export abstract class BaseModelProvider implements ModelProvider {
  protected knowledgeBase: KnowledgeBase;
  protected hashStore: HashStore;
  protected resourceTypePrefix = 'model-outputs';
  
  /**
   * Create a new BaseModelProvider
   * @param knowledgeBase - The knowledge base to use
   */
  constructor(knowledgeBase: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.hashStore = new HashStore(knowledgeBase);
  }
  
  /**
   * Get the resource type for this provider's outputs
   */
  protected getResourceType(): string {
    return `${this.resourceTypePrefix}/${this.getProviderId()}`;
  }
  
  /**
   * Abstract method to get the provider ID
   */
  abstract getProviderId(): string;
  
  /**
   * Abstract method to process content
   */
  abstract processContent(content: any, contentType: string, contentId: string): Promise<string>;
  
  /**
   * Get model output by ID
   * @param outputId - The ID of the output to retrieve
   * @returns The model output
   */
  async getOutput(outputId: string): Promise<any | null> {
    try {
      const record = await this.knowledgeBase.get(this.getResourceType(), outputId);
      return record ? record.resource : null;
    } catch (err) {
      console.error(`Error getting output ${outputId}:`, err);
      return null;
    }
  }
  
  /**
   * Find model outputs for a given content ID
   * @param contentId - ID of the content
   * @returns Array of output IDs
   */
  async findOutputsForContent(contentId: string): Promise<string[]> {
    try {
      // This would normally require an index or query capability
      // For demo purposes, we'll assume the knowledge base has a special method
      // In a real implementation, this would need to be more sophisticated
      
      // @ts-ignore - Method would need to be implemented in a real system
      const records = await this.knowledgeBase.getAllOfType(this.getResourceType());
      
      // Filter records for those referencing the content ID
      const outputIds: string[] = [];
      for (const record of records) {
        if (record.resource.contentId === contentId) {
          outputIds.push(record.id);
        }
      }
      
      return outputIds;
    } catch (err) {
      console.error(`Error finding outputs for content ${contentId}:`, err);
      return [];
    }
  }
  
  /**
   * Generate a unique ID for an output
   * @param contentId - ID of the source content
   * @returns A unique ID
   */
  protected generateOutputId(contentId: string): string {
    return `${this.getProviderId()}-${contentId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

/**
 * A text embedding model provider that creates vector embeddings for text content
 */
export class TextEmbeddingProvider extends BaseModelProvider {
  private modelName: string;
  private dimensions: number;
  
  /**
   * Create a new TextEmbeddingProvider
   * @param knowledgeBase - The knowledge base to use
   * @param modelName - Name of the embedding model
   * @param dimensions - Dimensions of the embedding vectors
   */
  constructor(knowledgeBase: KnowledgeBase, modelName: string, dimensions: number) {
    super(knowledgeBase);
    this.modelName = modelName;
    this.dimensions = dimensions;
  }
  
  /**
   * Get the provider ID
   * @returns The provider ID
   */
  getProviderId(): string {
    return `text-embedding-${this.modelName}`;
  }
  
  /**
   * Process text content and create embedding
   * @param content - The text content to embed
   * @param contentType - Type of the content (should be 'text')
   * @param contentId - ID of the content
   * @returns The ID of the created embedding
   */
  async processContent(content: any, contentType: string, contentId: string): Promise<string> {
    try {
      // Verify content type
      if (contentType !== 'text' && contentType !== 'string') {
        throw new Error(`Invalid content type: ${contentType}, expected 'text' or 'string'`);
      }
      
      // Get text from content
      const text = typeof content === 'string' ? content : JSON.stringify(content);
      
      // In a real implementation, this would call an embedding model API
      // For demo purposes, we'll generate random embedding vectors
      const embedding = this.mockGenerateEmbedding(text);
      
      // Store the embedding artifact in the hash store
      const embeddingHash = await this.hashStore.store(
        embedding,
        'float32array',
        { 
          modelName: this.modelName,
          dimensions: this.dimensions,
          contentType
        }
      );
      
      // Create the model output record
      const outputId = this.generateOutputId(contentId);
      const output = {
        modelProvider: this.getProviderId(),
        contentId,
        contentType,
        embeddingHash,
        timestamp: new Date().toISOString(),
        metadata: {
          modelName: this.modelName,
          dimensions: this.dimensions
        }
      };
      
      // Store the output record
      await this.knowledgeBase.set(this.getResourceType(), outputId, {
        resource: output,
        resourceType: this.getResourceType()
      });
      
      return outputId;
    } catch (err) {
      console.error(`Error processing content for embeddings:`, err);
      throw err;
    }
  }
  
  /**
   * Mock embedding generation for demonstration
   * @param text - The text to embed
   * @returns A mock embedding vector
   */
  private mockGenerateEmbedding(text: string): number[] {
    // In a real implementation, this would call an API
    // For now, generate deterministic random values based on text
    const embedding = new Array(this.dimensions).fill(0);
    
    // Simple hash of the text to seed the random values
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Generate embedding values
    for (let i = 0; i < this.dimensions; i++) {
      // Use a simple PRNG based on the hash and index
      const value = Math.sin(hash + i) * 10000;
      embedding[i] = value - Math.floor(value);
    }
    
    return embedding;
  }
  
  /**
   * Get embedding vector for an output
   * @param outputId - The ID of the output
   * @returns The embedding vector or null if not found
   */
  async getEmbeddingVector(outputId: string): Promise<number[] | null> {
    try {
      // Get the output record
      const output = await this.getOutput(outputId);
      if (!output || !output.embeddingHash) return null;
      
      // Get the embedding from the hash store
      const primitive = await this.hashStore.retrieve(output.embeddingHash);
      return primitive ? primitive.value : null;
    } catch (err) {
      console.error(`Error getting embedding for ${outputId}:`, err);
      return null;
    }
  }
  
  /**
   * Calculate similarity between two outputs
   * @param outputId1 - ID of the first output
   * @param outputId2 - ID of the second output
   * @returns Cosine similarity (0-1) or null if error
   */
  async calculateSimilarity(outputId1: string, outputId2: string): Promise<number | null> {
    try {
      // Get the embedding vectors
      const vec1 = await this.getEmbeddingVector(outputId1);
      const vec2 = await this.getEmbeddingVector(outputId2);
      
      if (!vec1 || !vec2) return null;
      if (vec1.length !== vec2.length) return null;
      
      // Calculate cosine similarity
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
      }
      
      mag1 = Math.sqrt(mag1);
      mag2 = Math.sqrt(mag2);
      
      if (mag1 === 0 || mag2 === 0) return 0;
      
      return dotProduct / (mag1 * mag2);
    } catch (err) {
      console.error(`Error calculating similarity between ${outputId1} and ${outputId2}:`, err);
      return null;
    }
  }
}

/**
 * A digital signature provider that creates and verifies signatures for content
 */
export class DigitalSignatureProvider extends BaseModelProvider {
  private signerName: string;
  
  /**
   * Create a new DigitalSignatureProvider
   * @param knowledgeBase - The knowledge base to use
   * @param signerName - Name of the signer
   */
  constructor(knowledgeBase: KnowledgeBase, signerName: string) {
    super(knowledgeBase);
    this.signerName = signerName;
  }
  
  /**
   * Get the provider ID
   * @returns The provider ID
   */
  getProviderId(): string {
    return `digital-signature-${this.signerName}`;
  }
  
  /**
   * Process content and create a signature
   * @param content - The content to sign
   * @param contentType - Type of the content
   * @param contentId - ID of the content
   * @returns The ID of the created signature record
   */
  async processContent(content: any, contentType: string, contentId: string): Promise<string> {
    try {
      // Serialize content if not a string
      const contentToSign = typeof content === 'string' ? content : JSON.stringify(content);
      
      // Generate a hash of the content
      const contentHash = await this.hashStore.hashValue(contentToSign);
      
      // In a real implementation, this would use a real digital signature algorithm
      // For demo purposes, we'll create a mock signature
      const signature = await this.mockGenerateSignature(contentHash);
      
      // Store the signature artifact in the hash store
      const signatureHash = await this.hashStore.store(
        signature,
        'string',
        { 
          signerName: this.signerName,
          contentType,
          algorithm: 'mock-signature' // In a real system, this would be RSA, ECDSA, etc.
        }
      );
      
      // Create the signature record
      const outputId = this.generateOutputId(contentId);
      const output = {
        modelProvider: this.getProviderId(),
        contentId,
        contentType,
        contentHash,
        signatureHash,
        timestamp: new Date().toISOString(),
        metadata: {
          signerName: this.signerName,
          algorithm: 'mock-signature'
        }
      };
      
      // Store the output record
      await this.knowledgeBase.set(this.getResourceType(), outputId, {
        resource: output,
        resourceType: this.getResourceType()
      });
      
      return outputId;
    } catch (err) {
      console.error(`Error signing content:`, err);
      throw err;
    }
  }
  
  /**
   * Mock signature generation for demonstration
   * @param contentHash - Hash of the content to sign
   * @returns A mock signature
   */
  private async mockGenerateSignature(contentHash: string): Promise<string> {
    // In a real implementation, this would use a private key
    // For demo purposes, create a simple mock signature
    const signatureBase = `${this.signerName}:${contentHash}:${Date.now()}`;
    const signatureHash = await this.hashStore.hashValue(signatureBase);
    return `SIG-${signatureHash}`;
  }
  
  /**
   * Verify a signature
   * @param outputId - ID of the signature record
   * @param content - The content to verify
   * @returns True if valid, false otherwise
   */
  async verifySignature(outputId: string, content: any): Promise<boolean> {
    try {
      // Get the signature record
      const signatureRecord = await this.getOutput(outputId);
      if (!signatureRecord) return false;
      
      // Get content hash
      const contentToVerify = typeof content === 'string' ? content : JSON.stringify(content);
      const contentHash = await this.hashStore.hashValue(contentToVerify);
      
      // Check if the content hash matches
      if (contentHash !== signatureRecord.contentHash) {
        return false;
      }
      
      // In a real implementation, we would verify the signature cryptographically
      // For demo purposes, we'll just check that the signature exists
      const signaturePrimitive = await this.hashStore.retrieve(signatureRecord.signatureHash);
      return !!signaturePrimitive && !!signaturePrimitive.value;
    } catch (err) {
      console.error(`Error verifying signature ${outputId}:`, err);
      return false;
    }
  }
}
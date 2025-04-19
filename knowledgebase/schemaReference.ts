/**
 * Schema Reference - Links schemas to hashed primitive values
 * 
 * Allows multiple schemas to reference the same primitive values
 * without duplicating the values themselves.
 */

import { KnowledgeBase, UOREncoder } from './uorEncoder';
import { HashStore } from './hashStore';

/**
 * Interface for a schema reference
 */
export interface SchemaReference {
  schemaType: string;  // The type of schema (e.g., "DefinedTerm", "Article")
  schemaId: string;    // Unique ID for this schema instance
  references: Record<string, string>;  // Map of property names to value hashes
  relationships: Array<{  // Explicit relationships to other schemas
    type: string;
    targetSchemaType: string;
    targetSchemaId: string;
  }>;
  metadata?: Record<string, any>;  // Optional metadata
}

/**
 * Schema Reference Manager
 */
export class SchemaReferenceManager {
  private knowledgeBase: KnowledgeBase;
  private hashStore: HashStore;
  private encoder: UOREncoder;
  private resourceType = 'schemas';
  
  /**
   * Create a new SchemaReferenceManager
   * @param knowledgeBase - The knowledge base to use
   */
  constructor(knowledgeBase: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.hashStore = new HashStore(knowledgeBase);
    this.encoder = new UOREncoder(knowledgeBase);
  }
  
  /**
   * Create a schema reference
   * @param schemaType - The type of schema
   * @param schemaId - The ID for this schema
   * @param properties - Map of property names to values
   * @param relationships - Optional relationships to other schemas
   * @param metadata - Optional metadata
   * @returns The ID of the created schema reference
   */
  async createSchema(
    schemaType: string,
    schemaId: string,
    properties: Record<string, any>,
    relationships: Array<{
      type: string;
      targetSchemaType: string;
      targetSchemaId: string;
    }> = [],
    metadata?: Record<string, any>
  ): Promise<string> {
    // Store all property values in the hash store
    const references: Record<string, string> = {};
    
    for (const [propName, propValue] of Object.entries(properties)) {
      if (propValue !== undefined && propValue !== null) {
        // Store the property value and get its hash
        const hash = await this.hashStore.store(
          propValue,
          typeof propValue,
          { originProperty: propName, originSchema: schemaType }
        );
        
        // Add the hash reference
        references[propName] = hash;
      }
    }
    
    // Create the schema reference
    const schemaRef: SchemaReference = {
      schemaType,
      schemaId,
      references,
      relationships,
      metadata
    };
    
    // Store the schema reference
    await this.encoder.encode(schemaRef, `${this.resourceType}/${schemaType}`);
    
    return schemaId;
  }
  
  /**
   * Get a schema with its referenced values
   * @param schemaType - The type of schema
   * @param schemaId - The ID of the schema
   * @returns The fully assembled schema with values
   */
  async getSchema(schemaType: string, schemaId: string): Promise<any | null> {
    try {
      // Get the schema reference
      const schemaRef = await this.encoder.decode(
        `${this.resourceType}/${schemaType}`,
        schemaId
      );
      
      if (!schemaRef) return null;
      
      // Assemble the result object
      const result: any = {
        '@type': schemaType,
        '@id': schemaId
      };
      
      // Fetch and populate all referenced values
      for (const [propName, valueHash] of Object.entries(schemaRef.references)) {
        const primitive = await this.hashStore.retrieve(valueHash as string);
        if (primitive) {
          result[propName] = primitive.value;
        }
      }
      
      // Add relationship info
      result.relationships = schemaRef.relationships;
      
      // Add metadata if present
      if (schemaRef.metadata) {
        result.metadata = schemaRef.metadata;
      }
      
      return result;
    } catch (err) {
      console.error(`Error getting schema ${schemaType}/${schemaId}:`, err);
      return null;
    }
  }
  
  /**
   * Get all schemas of a specific type
   * @param schemaType - The type of schema to retrieve
   * @returns Array of assembled schemas
   */
  async getAllSchemasOfType(schemaType: string): Promise<any[]> {
    try {
      // @ts-ignore - Method exists on our implementation
      const schemas = await this.knowledgeBase.getAllOfType(`${this.resourceType}/${schemaType}`);
      
      // Assemble each schema
      const results = [];
      for (const schema of schemas) {
        const assembled = await this.getSchema(schemaType, schema.id);
        if (assembled) {
          results.push(assembled);
        }
      }
      
      return results;
    } catch (err) {
      console.error(`Error getting schemas of type ${schemaType}:`, err);
      return [];
    }
  }
  
  /**
   * Get schemas related to a specific schema
   * @param schemaType - The type of the source schema
   * @param schemaId - The ID of the source schema
   * @param relationshipType - Optional relationship type to filter by
   * @returns Array of related schemas
   */
  async getRelatedSchemas(
    schemaType: string,
    schemaId: string,
    relationshipType?: string
  ): Promise<any[]> {
    try {
      // Get the schema reference
      const schemaRef = await this.encoder.decode(
        `${this.resourceType}/${schemaType}`,
        schemaId
      );
      
      if (!schemaRef || !schemaRef.relationships) return [];
      
      // Filter relationships by type if specified
      const filteredRelationships = relationshipType
        ? schemaRef.relationships.filter((rel: {type: string}) => rel.type === relationshipType)
        : schemaRef.relationships;
      
      // Fetch each related schema
      const relatedSchemas = [];
      for (const rel of filteredRelationships) {
        const related = await this.getSchema(rel.targetSchemaType, rel.targetSchemaId as string);
        if (related) {
          // Add the relationship type to the result
          related.relationshipType = rel.type;
          relatedSchemas.push(related);
        }
      }
      
      return relatedSchemas;
    } catch (err) {
      console.error(`Error getting related schemas for ${schemaType}/${schemaId}:`, err);
      return [];
    }
  }
  
  /**
   * Add a relationship between two schemas
   * @param sourceType - The type of the source schema
   * @param sourceId - The ID of the source schema
   * @param relationshipType - The type of relationship
   * @param targetType - The type of the target schema
   * @param targetId - The ID of the target schema
   * @returns True if successful, false otherwise
   */
  async addRelationship(
    sourceType: string,
    sourceId: string,
    relationshipType: string,
    targetType: string,
    targetId: string
  ): Promise<boolean> {
    try {
      // Get the source schema
      const sourceSchema = await this.encoder.decode(
        `${this.resourceType}/${sourceType}`,
        sourceId
      );
      
      if (!sourceSchema) return false;
      
      // Initialize relationships array if it doesn't exist
      if (!sourceSchema.relationships) {
        sourceSchema.relationships = [];
      }
      
      // Check if relationship already exists
      const relationshipExists = sourceSchema.relationships.some(
        (rel: any) => 
          rel.type === relationshipType &&
          rel.targetSchemaType === targetType &&
          rel.targetSchemaId === targetId
      );
      
      if (!relationshipExists) {
        // Add the new relationship
        sourceSchema.relationships.push({
          type: relationshipType,
          targetSchemaType: targetType,
          targetSchemaId: targetId
        });
        
        // Update the schema
        await this.encoder.encode(
          sourceSchema,
          `${this.resourceType}/${sourceType}`
        );
      }
      
      return true;
    } catch (err) {
      console.error(`Error adding relationship from ${sourceType}/${sourceId} to ${targetType}/${targetId}:`, err);
      return false;
    }
  }
  
  /**
   * Generate a unique ID for a schema
   * @param schemaType - The type of schema
   * @param baseName - Optional base name to include in the ID
   * @returns A unique ID
   */
  generateId(schemaType: string, baseName?: string): string {
    const base = baseName 
      ? baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : schemaType.toLowerCase();
    
    return `${base}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
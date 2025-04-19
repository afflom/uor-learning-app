/**
 * Content Importer - Import existing app content into the UOR knowledge base
 * 
 * Converts MDX content and section data into the hashed primitive structure
 * with schema references.
 */

import fs from 'fs';
import path from 'path';
import { IndexedDBKnowledgeBase } from './indexedDbKnowledgeBase';
import { SchemaReferenceManager } from './schemaReference';
import { HashStore } from './hashStore';

// Mock fs.promises for browser environment if needed
const fsPromises = fs.promises || {
  readFile: (path: string) => Promise.reject(new Error('File system not available in browser'))
};

/**
 * Interface for a section in the app
 */
interface AppSection {
  id: string;
  title: string;
  description?: string;
  subsections?: Array<{
    id: string;
    title: string;
  }>;
}

/**
 * Content Importer
 */
export class ContentImporter {
  private schemaManager: SchemaReferenceManager;
  private hashStore: HashStore;
  
  /**
   * Create a new ContentImporter
   * @param knowledgeBase - The knowledge base to use
   */
  constructor(knowledgeBase: IndexedDBKnowledgeBase) {
    this.schemaManager = new SchemaReferenceManager(knowledgeBase);
    this.hashStore = new HashStore(knowledgeBase);
  }
  
  /**
   * Import a section and its subsections
   * @param section - The section to import
   * @param contentBasePath - Base path to the content files
   * @returns The ID of the created section schema
   */
  async importSection(
    section: AppSection,
    contentBasePath: string
  ): Promise<string> {
    try {
      // Create the section schema
      const sectionId = this.schemaManager.generateId('Section', section.id);
      
      await this.schemaManager.createSchema(
        'Section',
        sectionId,
        {
          name: section.title,
          description: section.description || '',
          originalId: section.id
        }
      );
      
      // Import subsections if any
      if (section.subsections && section.subsections.length > 0) {
        for (const subsection of section.subsections) {
          await this.importSubsection(
            subsection,
            sectionId,
            contentBasePath
          );
        }
      }
      
      return sectionId;
    } catch (err) {
      console.error(`Error importing section ${section.id}:`, err);
      throw err;
    }
  }
  
  /**
   * Import a subsection
   * @param subsection - The subsection to import
   * @param parentSectionId - The ID of the parent section
   * @param contentBasePath - Base path to the content files
   * @returns The ID of the created subsection schema
   */
  private async importSubsection(
    subsection: { id: string; title: string },
    parentSectionId: string,
    contentBasePath: string
  ): Promise<string> {
    try {
      // Try to read the subsection content
      let content = '';
      try {
        const filePath = path.join(
          contentBasePath,
          `${subsection.id}.mdx`
        );
        content = await fsPromises.readFile(filePath, 'utf-8');
      } catch (fileErr) {
        console.warn(`Could not read content file for ${subsection.id}:`, fileErr);
        // Continue without content
      }
      
      // Create the subsection schema
      const subsectionId = this.schemaManager.generateId('Subsection', subsection.id);
      
      await this.schemaManager.createSchema(
        'Subsection',
        subsectionId,
        {
          name: subsection.title,
          originalId: subsection.id,
          content: content
        }
      );
      
      // Create relationship to parent section
      await this.schemaManager.addRelationship(
        'Section',
        parentSectionId,
        'hasPart',
        'Subsection',
        subsectionId
      );
      
      // Create reverse relationship
      await this.schemaManager.addRelationship(
        'Subsection',
        subsectionId,
        'isPartOf',
        'Section',
        parentSectionId
      );
      
      return subsectionId;
    } catch (err) {
      console.error(`Error importing subsection ${subsection.id}:`, err);
      throw err;
    }
  }
  
  /**
   * Import all sections from the app
   * @param sectionsData - Array of sections from the app
   * @param contentBasePath - Base path to the content files
   * @returns Array of created section IDs
   */
  async importAllSections(
    sectionsData: AppSection[],
    contentBasePath: string
  ): Promise<string[]> {
    const sectionIds: string[] = [];
    
    for (const section of sectionsData) {
      const sectionId = await this.importSection(section, contentBasePath);
      sectionIds.push(sectionId);
    }
    
    return sectionIds;
  }
  
  /**
   * Import a mathematical object
   * @param id - The ID of the object
   * @param name - The name of the object
   * @param description - The description of the object
   * @param relatedTopics - Optional related topic IDs
   * @returns The ID of the created mathematical object schema
   */
  async importMathObject(
    id: string,
    name: string,
    description: string,
    relatedTopics?: string[]
  ): Promise<string> {
    try {
      // Create the math object schema
      const mathObjectId = this.schemaManager.generateId('MathematicalObject', id);
      
      await this.schemaManager.createSchema(
        'MathematicalObject',
        mathObjectId,
        {
          name,
          description,
          originalId: id
        }
      );
      
      // Create relationships to related topics if any
      if (relatedTopics && relatedTopics.length > 0) {
        for (const topicId of relatedTopics) {
          await this.schemaManager.addRelationship(
            'MathematicalObject',
            mathObjectId,
            'about',
            'Section',
            topicId
          );
        }
      }
      
      return mathObjectId;
    } catch (err) {
      console.error(`Error importing mathematical object ${id}:`, err);
      throw err;
    }
  }
  
  /**
   * Create schema.org compliant DefinedTerm
   * @param id - The ID of the term
   * @param name - The name of the term
   * @param description - The description of the term
   * @param termSet - The term set this term belongs to
   * @returns The ID of the created term schema
   */
  async createDefinedTerm(
    id: string,
    name: string,
    description: string,
    termSet: string = "UORKnowledgeBase"
  ): Promise<string> {
    try {
      // Create the defined term schema
      const termId = this.schemaManager.generateId('DefinedTerm', id);
      
      await this.schemaManager.createSchema(
        'DefinedTerm',
        termId,
        {
          name,
          description,
          termSet,
          originalId: id
        }
      );
      
      return termId;
    } catch (err) {
      console.error(`Error creating defined term ${id}:`, err);
      throw err;
    }
  }
  
  /**
   * Create schema.org compliant Article
   * @param id - The ID of the article
   * @param name - The name of the article
   * @param content - The content of the article
   * @param description - Optional description
   * @returns The ID of the created article schema
   */
  async createArticle(
    id: string,
    name: string,
    content: string,
    description?: string
  ): Promise<string> {
    try {
      // Create the article schema
      const articleId = this.schemaManager.generateId('Article', id);
      
      await this.schemaManager.createSchema(
        'Article',
        articleId,
        {
          name,
          content,
          description: description || '',
          datePublished: new Date().toISOString(),
          originalId: id
        }
      );
      
      return articleId;
    } catch (err) {
      console.error(`Error creating article ${id}:`, err);
      throw err;
    }
  }
  
  /**
   * Import sample content to demonstrate the system
   * @returns Object with the IDs of created entities
   */
  async importSampleContent(): Promise<Record<string, string>> {
    const ids: Record<string, string> = {};
    
    // Create mathematical objects
    ids.intrinsicPrimes = await this.importMathObject(
      'intrinsic-primes',
      'Intrinsic Primes',
      'Fundamental building blocks in the Universal Object Reference framework that cannot be decomposed further and serve as the basis for all representable structures.'
    );
    
    ids.uniqueFactorization = await this.importMathObject(
      'unique-factorization',
      'Unique Factorization',
      'The principle that every object in a well-defined domain can be uniquely decomposed into a product of prime elements, up to ordering and equivalence.'
    );
    
    ids.primeCoordinates = await this.importMathObject(
      'prime-coordinates',
      'Prime Coordinates',
      'The representation of objects as vectors of exponents in a prime basis, enabling a direct mapping between objects and their prime decomposition.'
    );
    
    ids.coherenceNorm = await this.importMathObject(
      'coherence-norm',
      'Coherence Norm',
      'A measure of representational complexity defined on prime coordinates, providing a metric for the "simplicity" or "coherence" of structures.'
    );
    
    // Create topic terms
    ids.uorTopic = await this.createDefinedTerm(
      'uor',
      'Universal Object Reference',
      'Foundations of the Prime Framework and Universal Object Reference.'
    );
    
    ids.foundations = await this.createDefinedTerm(
      'foundations',
      'Prime Foundations',
      'Intrinsic primes, unique factorization, and canonical representations.'
    );
    
    // Create relationships between topics
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.uorTopic,
      'relatedTo',
      'DefinedTerm',
      ids.foundations
    );
    
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.foundations,
      'relatedTo',
      'DefinedTerm',
      ids.uorTopic
    );
    
    // Link math objects to topics
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.foundations,
      'mainEntityOfPage',
      'MathematicalObject',
      ids.intrinsicPrimes
    );
    
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.foundations,
      'mainEntityOfPage',
      'MathematicalObject',
      ids.uniqueFactorization
    );
    
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.foundations,
      'mainEntityOfPage',
      'MathematicalObject',
      ids.primeCoordinates
    );
    
    await this.schemaManager.addRelationship(
      'DefinedTerm',
      ids.foundations,
      'mainEntityOfPage',
      'MathematicalObject',
      ids.coherenceNorm
    );
    
    return ids;
  }
}
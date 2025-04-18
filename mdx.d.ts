/// <reference types="react" />
/**
 * Type declaration for MDX files.
 */
declare module '*.mdx' {
  import * as React from 'react';
  const MDXComponent: React.ComponentType<any>;
  export default MDXComponent;
}
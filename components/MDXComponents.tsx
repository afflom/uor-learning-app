import React, { ReactNode } from 'react';
import { MathJax } from 'better-react-mathjax';

type WrapperProps = {
  children?: ReactNode;
} & Record<string, unknown>;

// Custom code component that handles math
const Code = (props: any) => {
  const { className, children } = props;
  // Check if this is a math code block
  if (className === 'language-math' || className?.includes('math-inline') || className?.includes('math-display')) {
    return <MathJax>{children}</MathJax>;
  }
  // Regular code block
  return <code {...props} />;
};

// Wrapper component that processes inline math in paragraphs and other text
const MathContentWrapper = ({ children }: { children: ReactNode }) => {
  // If children is not a string, we can't process it for math content
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  // Check if the string contains math delimiters
  if (children.includes('$') || children.includes('\\(') || children.includes('\\[')) {
    return <MathJax>{children}</MathJax>;
  }

  return <>{children}</>;
};

// Define custom MDX components
const MDXComponents = {
  // Add custom components for MDX rendering
  wrapper: (props: WrapperProps) => <div className="mdx-content" {...props} />,
  // Process math in code blocks
  code: Code,
  // Handle inline code that might contain math
  inlineCode: (props: any) => <Code {...props} />,
  // Process math in paragraphs
  p: (props: any) => <p {...props}><MathContentWrapper>{props.children}</MathContentWrapper></p>,
  // Process math in list items
  li: (props: any) => <li {...props}><MathContentWrapper>{props.children}</MathContentWrapper></li>,
  // Process math in headings
  h1: (props: any) => <h1 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h1>,
  h2: (props: any) => <h2 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h2>,
  h3: (props: any) => <h3 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h3>,
  h4: (props: any) => <h4 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h4>,
  h5: (props: any) => <h5 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h5>,
  h6: (props: any) => <h6 {...props}><MathContentWrapper>{props.children}</MathContentWrapper></h6>,
};

export default MDXComponents;
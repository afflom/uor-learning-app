import React, { ReactNode } from 'react';

type WrapperProps = {
  children?: ReactNode;
} & Record<string, unknown>;

// Define custom MDX components if needed
const MDXComponents = {
  // Add any custom components for MDX rendering here
  wrapper: (props: WrapperProps) => <div className="mdx-content" {...props} />,
};

export default MDXComponents;
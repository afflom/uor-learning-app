import React, { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className="app">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}
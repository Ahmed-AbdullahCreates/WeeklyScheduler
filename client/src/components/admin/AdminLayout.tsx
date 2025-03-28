import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  return (
    <div className="admin-layout">
      <Header title={title} />
      <div className="admin-content">
        <Sidebar />
        <main className="admin-main">
          <h1 className="admin-page-title">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

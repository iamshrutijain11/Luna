import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-luna-ivory relative flex overflow-x-hidden selection:bg-luna-halo selection:text-luna-charcoal">
      {/* Continuous Architectural Moonlit Background Canvas (visible across all 7 screens) */}
      <div className="luna-architectural-canvas" aria-hidden="true" />

      {/* Glassmorphic Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[17.5rem] relative z-10 transition-all duration-200">
        {/* Sticky Frosted Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Canvas Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsMobileOpen(true);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 shadow-xl">
          <Sidebar setMobileOpen={setIsMobileOpen} />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="h-8 w-1.5 bg-gradient-to-b from-primary to-indigo-600 rounded-full mr-3"></div>
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            </div>
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}

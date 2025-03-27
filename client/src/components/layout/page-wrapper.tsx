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
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar setMobileOpen={setIsMobileOpen} />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          {children}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}

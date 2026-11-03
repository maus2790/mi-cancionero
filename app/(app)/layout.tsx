'use client';

import { useState, useEffect } from 'react';
import { TitleProvider } from '@/lib/TitleContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname } from 'next/navigation';
import { ThemeColorUpdater } from '@/components/ThemeColorUpdater';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Cargar preferencia guardada de sidebar en PC
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved !== null) {
        setIsDesktopSidebarCollapsed(saved === 'true');
      }
    } catch { }
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsDesktopSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch { }
        return next;
      });
    }
  };

  // Ocultar sidebar en páginas específicas si quieres
  const hideSidebar = false;
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    const main = document.getElementById('main-scroll-container');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return (
    <TitleProvider>
      <ThemeColorUpdater />
      <div className="h-[100dvh] flex flex-col bg-app overflow-hidden">
        <Header onToggleSidebar={handleToggleSidebar} />
        <div className="flex flex-1 overflow-hidden relative">
          {!isMobile && !hideSidebar && (
            <Sidebar
              isOpen={true}
              isCollapsed={isDesktopSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          )}
          {isMobile && isMobileSidebarOpen && isAdminRoute && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="z-50 h-full">
                <Sidebar isOpen={true} />
              </div>
            </>
          )}
          <main
            id="main-scroll-container"
            className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? (isDesktopSidebarCollapsed ? 'ml-16' : 'ml-64') : ''
              }`}
          >
            {children}
          </main>
        </div>
        {isMobile && <BottomNav />}
      </div>
    </TitleProvider>
  );
}

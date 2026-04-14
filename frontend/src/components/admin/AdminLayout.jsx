/**
 * PLATFORM ADMIN LAYOUT
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ChevronLeft, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_NAV } from '@/config/adminNav.registry';

export function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="platform-admin-layout">
      <header className="bg-white h-14 flex items-center px-4 sticky top-0 z-20 border-b border-gray-200">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-lg">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
        
        <div className="flex items-center gap-2 ml-6">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
      </header>
      
      <div className="flex">
        <aside className={cn(
          'w-64 bg-white border-r min-h-[calc(100vh-3.5rem)]',
          'fixed lg:static z-10',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
            {ADMIN_NAV.filter(item => item.path).map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                  data-testid={`admin-nav-${item.id}`}
                >
                  {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-gray-400')} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

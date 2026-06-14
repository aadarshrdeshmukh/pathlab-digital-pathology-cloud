'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

/**
 * ContextSidebar — A contextual in-page sidebar card.
 * Each page passes its own sidebar items.
 * 
 * @param {Array} items - Array of { name, icon: LucideIcon, id, onClick? }
 * @param {string} activeId - Currently active item ID
 * @param {function} onSelect - Callback when item is selected
 * @param {boolean} showLogout - Whether to show logout at bottom
 */
export default function Sidebar({ items = [], activeId, onSelect, showLogout = true }) {
  const router = useRouter();
  const pathname = usePathname();

  // Hide sidebar on login and landing pages
  if (pathname === '/login' || pathname === '/') return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <aside className="context-sidebar" aria-label="Page Navigation">
      <nav className="flex flex-col" aria-label="Contextual Navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (onSelect) {
                  onSelect(item.id);
                }
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              {Icon && <Icon />}
              <span>{item.name}</span>
            </button>
          );
        })}

        {showLogout && (
          <>
            <div className="sidebar-divider" />
            <button
              className="sidebar-item logout"
              onClick={handleLogout}
              aria-label="Sign out"
            >
              <LogOut />
              <span>Log out</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Explore', icon: '◆' },
  { href: '/booking-history', label: 'Tickets', icon: '◈' },
  { href: '/faq', label: 'FAQ', icon: '◇' },
  { href: '/about', label: 'About', icon: '○' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname === '/signin') return null;

  return (
    <nav className='sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#09090b]/95 backdrop-blur-md border-t border-[rgba(167,139,250,0.12)] flex items-center justify-around z-50'>
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
              active ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className='text-lg leading-none'>{item.icon}</span>
            <span className='text-[10px] font-medium'>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/scenarios', label: 'Scenarios', icon: '🎭' },
  { href: '/tone', label: 'Tone', icon: '🎨' },
  { href: '/chats', label: 'Chats', icon: '💬' },
  { href: '/rules', label: 'Rules', icon: '📋' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 md:relative md:border-t-0 md:border-r md:h-screen md:w-64">
      <div className="flex md:flex-col justify-around md:justify-start md:p-4 md:gap-2">
        <div className="hidden md:block mb-6 px-2">
          <h1 className="text-xl font-bold text-white">Kyle Bot</h1>
          <p className="text-sm text-gray-400">Controller</p>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col md:flex-row items-center md:gap-3 p-3 md:px-4 md:py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs md:text-sm mt-1 md:mt-0">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

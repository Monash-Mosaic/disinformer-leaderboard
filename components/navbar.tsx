'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">D</span>
                        </div>
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">Disinformer</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/"
                            className={`transition-colors font-medium ${isActive('/')
                                ? 'text-cyan-500 dark:text-cyan-400'
                                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`transition-colors font-medium ${isActive('/leaderboard')
                                ? 'text-cyan-500 dark:text-cyan-400'
                                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            Leaderboard
                        </Link>
                    </div>

                    {/* Right side (placeholder for user menu or other items) */}
                    <div className="w-8" />
                </div>
            </div>
        </nav>
    );
}

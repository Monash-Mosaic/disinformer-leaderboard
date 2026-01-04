'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#ffffef] border-b border-[#2d4143]/10 shadow-sm py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo and Brand */}
                    <Link href="/" className="flex items-center">
                        <div className="flex items-center relative">
                            <span 
                                className="text-4xl font-['Bungee_Shade'] text-[#2d4143]" 
                                style={{ letterSpacing: '0.48px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                            >
                                D
                            </span>
                            <div className="relative w-16 h-16 -mx-1 inline-block" style={{ top: '2px' }}>
                                <img src="/assets/search-icon.png" alt="" className="w-full h-full rotate-[314deg]" />
                            </div>
                            <span 
                                className="text-4xl font-['Bungee_Shade'] text-[#2d4143]" 
                                style={{ letterSpacing: '0.48px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                            >
                                sInformeR
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-16">
                        <Link
                            href="/"
                            className={`transition-colors font-['Play'] font-bold text-[28px] ${isActive('/')
                                ? 'text-[#ff4805]'
                                : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                            style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        >
                            Home
                        </Link>
                        <Link
                            href="/leaderboard-offsetbased"
                            className={`transition-colors font-['Play'] font-bold text-[28px] ${isActive('/leaderboard') || isActive('/leaderboard-cursorbased') || isActive('/leaderboard-offsetbased')
                                ? 'text-[#ff4805]'
                                : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                            style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        >
                            Leaderboard
                        </Link>
                    </div>

                    {/* Right side spacer */}
                    <div className="w-16" />
                </div>
            </div>
        </nav>
    );
}

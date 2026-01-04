'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#ffffef] border-b border-[#2d4143]/10 shadow-sm py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo and Brand */}
                    <Link href="/" className="shrink-0 pb-10">
                        <Image src="/assets/logo.png" alt="Logo" width={500} height={500} />
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
                            href="/leaderboard"
                            className={`transition-colors font-['Play'] font-bold text-[28px] ${isActive('/leaderboard')
                                ? 'text-[#ff4805]'
                                : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                            style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            href="/leaderboard-cursorbased"
                            className={`transition-colors font-['Play'] font-bold text-[28px] ${isActive('/leaderboard-cursorbased')
                                ? 'text-[#ff4805]'
                                : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                            style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        >
                            Leaderboard (Cursor-Based)
                        </Link>
                        <Link
                            href="/leaderboard-offsetbased"
                            className={`transition-colors font-['Play'] font-bold text-[28px] ${isActive('/leaderboard-offsetbased')
                                ? 'text-[#ff4805]'
                                : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                            style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        >
                            Leaderboard (Offset-Based)
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

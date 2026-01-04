'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#ffffef] border-b border-[#2d4143]/10 shadow-sm py-4 md:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo and Brand */}
                    <Link href="/" className="shrink-0 pb-4 md:pb-10">
                        <Image src="/assets/logo.png" alt="Logo" width={300} height={300}/>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden z-50 p-2"
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <span className={`w-full h-0.5 bg-[#2d4143] transition-all ${
                                mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                            }`} />
                            <span className={`w-full h-0.5 bg-[#2d4143] transition-all ${
                                mobileMenuOpen ? 'opacity-0' : ''
                            }`} />
                            <span className={`w-full h-0.5 bg-[#2d4143] transition-all ${
                                mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                            }`} />
                        </div>
                    </button>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-4 xl:gap-16">
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

                {/* Mobile Menu Section - Appears below logo when hamburger is clicked */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 border-t border-[#2d4143]/10 pt-4">
                        <div className="flex flex-col space-y-2">
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`py-2 px-4 transition-colors font-['Play'] font-bold text-xl sm:text-2xl flex items-center gap-2 ${
                                    isActive('/') ? 'text-[#ff4805]' : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                                style={{ letterSpacing: '0.28px' }}
                            >
                                {isActive('/') && <span className="text-[#4ecaca]"><ChevronRight /></span>}
                                Home
                            </Link>
                            <Link
                                href="/leaderboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`py-2 px-4 transition-colors font-['Play'] font-bold text-xl sm:text-2xl flex items-center gap-2 ${
                                    isActive('/leaderboard') ? 'text-[#ff4805]' : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                                style={{ letterSpacing: '0.28px' }}
                            >
                                {isActive('/leaderboard') && <span className="text-[#4ecaca]"><ChevronRight /></span>}
                                Leaderboard
                            </Link>
                            <Link
                                href="/leaderboard-cursorbased"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`py-2 px-4 transition-colors font-['Play'] font-bold text-xl sm:text-2xl flex items-center gap-2 ${
                                    isActive('/leaderboard-cursorbased') ? 'text-[#ff4805]' : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                                style={{ letterSpacing: '0.28px' }}
                            >
                                {isActive('/leaderboard-cursorbased') && <span className="text-[#4ecaca]"><ChevronRight /></span>}
                                Leaderboard (Cursor-Based)
                            </Link>
                            <Link
                                href="/leaderboard-offsetbased"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`py-2 px-4 transition-colors font-['Play'] font-bold text-xl sm:text-2xl flex items-center gap-2 ${
                                    isActive('/leaderboard-offsetbased') ? 'text-[#ff4805]' : 'text-[#2d4143] hover:text-[#317070]'
                                }`}
                                style={{ letterSpacing: '0.28px' }}
                            >
                                {isActive('/leaderboard-offsetbased') && <span className="text-[#4ecaca]"><ChevronRight /></span>}
                                Leaderboard (Offset-Based)
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

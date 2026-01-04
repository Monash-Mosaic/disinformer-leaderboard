"use client";
import Link from 'next/link';
export default function Footer() {
    return (
        <footer className="bg-[#2d4143] py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Monash x Mosaic Logo */}
                        <Link href="https://mosaic-ai-for-social-imp-5uoq4jm.gamma.site" target="_blank" rel="noopener noreferrer">
                    <div className="w-[320px] h-[76px]">
                        <img 
                            src="/assets/monash-mosaic-logo.png" 
                            alt="Monash x Mosaic" 
                            className="w-full h-full object-contain"
                            />
                    </div>
                            </Link>

                    {/* Social Icons */}
                    <div className="flex items-center gap-8">
                        {/* Email */}
                        <a 
                            href="mailto:contact@mosaic.monash" 
                            className="w-[47px] h-[38px] hover:opacity-80 transition-opacity"
                            aria-label="Email"
                        >
                            <img 
                                src="/assets/email-icon.png" 
                                alt="Email" 
                                className="w-full h-full object-contain"
                            />
                        </a>

                        {/* Instagram */}
                        <a 
                            href="https://www.instagram.com/mosaic.monash/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-[45px] h-11 hover:opacity-80 transition-opacity"
                            aria-label="Instagram"
                        >
                            <img 
                                src="/assets/instagram-icon.png" 
                                alt="Instagram" 
                                className="w-full h-full object-contain"
                            />
                        </a>

                        {/* LinkedIn */}
                        <a 
                            href="https://www.linkedin.com/company/mosaic-monash-student-team/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-11 h-11 hover:opacity-80 transition-opacity"
                            aria-label="LinkedIn"
                        >
                            <img 
                                src="/assets/linkedin-icon.png" 
                                alt="LinkedIn" 
                                className="w-full h-full object-contain"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

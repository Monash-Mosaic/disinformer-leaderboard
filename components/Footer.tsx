"use client";
import Link from 'next/link';
export default function Footer() {
    return (
        <footer className="bg-[#2d4143] py-6 sm:py-8 mt-8 sm:mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    {/* Monash x Mosaic Logo */}
                    <Link href="https://mosaic-ai-for-social-imp-5uoq4jm.gamma.site" target="_blank" rel="noopener noreferrer">
                        <div className="w-[200px] h-12 sm:w-[280px] sm:h-[67px] md:w-[320px] md:h-[76px]">
                            <img 
                                src="/assets/monash-mosaic-logo.png" 
                                alt="Monash x Mosaic" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </Link>

                    {/* Social Icons */}
                    <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                        {/* Email */}
                        <a 
                            href="mailto:contact@mosaic.monash" 
                            className="w-8 h-7 sm:w-10 sm:h-8 md:w-[47px] md:h-[38px] hover:opacity-80 transition-opacity"
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
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-[45px] md:h-11 hover:opacity-80 transition-opacity"
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
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 hover:opacity-80 transition-opacity"
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

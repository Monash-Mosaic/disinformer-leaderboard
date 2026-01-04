"use client";

interface SearchBarProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    onSubmit: (term: string) => void;
    disabled?: boolean;
}

export default function SearchBar({ inputValue, setInputValue, onSubmit, disabled = false }: SearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!disabled) {
            onSubmit(inputValue);
        }
    };

    const handleClear = () => {
        setInputValue('');
        if (!disabled) {
            onSubmit('');
        }
    };

    return (
        <div className="mb-6 sm:mb-8 flex justify-center px-2 sm:px-4">
            <form onSubmit={handleSubmit} className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl">
                <div className="relative flex items-center">
                    {/* Left search icon */}
                    <div className="absolute left-2 sm:left-3 w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] md:w-[45px] md:h-[45px] pointer-events-none">
                        <img 
                            src="/assets/search-icon.png" 
                            alt="" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <input
                        type="text"
                        placeholder="Find username..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={disabled}
                        className={`w-full px-[45px] sm:px-[52px] md:px-[60px] py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl border-2 sm:border-3 md:border-4 border-[#2d4143] bg-transparent text-[#2d4143] text-base sm:text-lg md:text-[24px] font-['Play'] font-bold focus:outline-none focus:border-[#317070] placeholder:text-[#2d4143] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                    />
                    
                    {/* Vertical divider */}
                    <div className="absolute right-[45px] sm:right-[52px] md:right-[60px] h-[30px] sm:h-[38px] md:h-[45px] w-px bg-[#2d4143]" />
                    
                    {/* Clear button (X) - shows when input has text */}
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={disabled}
                            className={`absolute right-[52px] sm:right-[60px] md:right-[72px] text-[#2d4143] font-bold text-xl sm:text-2xl md:text-3xl ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#ff4805] transition-opacity'}`}
                        >
                            ×
                        </button>
                    )}
                    
                    {/* Right search button/icon */}
                    <button
                        type="submit"
                        disabled={disabled}
                        className={`absolute right-2 sm:right-3 w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] md:w-[45px] md:h-[45px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 transition-opacity'}`}
                    >
                        <img 
                            src="/assets/search-icon.png" 
                            alt="Search" 
                            className="w-full h-full object-cover"
                        />
                    </button>
                </div>
            </form>
        </div>
    );
}
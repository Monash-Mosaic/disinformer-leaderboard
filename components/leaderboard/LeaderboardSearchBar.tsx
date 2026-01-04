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

    return (
        <div className="mb-8 flex justify-center">
            <form onSubmit={handleSubmit} className="relative w-full max-w-[750px]">
                <div className="relative flex items-center">
                    {/* Left search icon */}
                    <div className="absolute left-3 w-[45px] h-[45px] pointer-events-none">
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
                        className={`w-full px-[60px] py-3 rounded-2xl border-4 border-[#2d4143] bg-transparent text-[#2d4143] text-[24px] font-['Play'] font-bold focus:outline-none focus:border-[#317070] placeholder:text-[#2d4143] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                    />
                    
                    {/* Vertical divider */}
                    <div className="absolute right-[60px] h-[45px] w-px bg-[#2d4143]" />
                    
                    {/* Right search button/icon */}
                    <button
                        type="submit"
                        disabled={disabled}
                        className={`absolute right-3 w-[45px] h-[45px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 transition-opacity'}`}
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
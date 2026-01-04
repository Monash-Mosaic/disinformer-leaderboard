"use client";

interface ToggleButtonProps {
    onClick: () => void;
    disabled?: boolean;
    text: string;
    mode?: 'disinformer' | 'netizen';
}

export default function ToggleButton({ onClick, disabled = false, text, mode = 'disinformer' }: ToggleButtonProps) {
    const isDisinformerActive = mode === 'disinformer';
    
    return (
        <div className="mb-4 sm:mb-6 flex justify-center items-center gap-2 sm:gap-3 md:gap-4">
            {/* Disinformer label */}
            <span 
                className="font-['Play'] font-bold text-sm sm:text-lg md:text-[24px] text-[#317070]"
                style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
            >
                Disinformer
            </span>
            
            {/* Toggle button */}
            <button
                onClick={onClick}
                disabled={disabled}
                className={`relative w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12 rounded-lg transition-all ${
                    isDisinformerActive ? 'bg-[#317070]' : 'bg-[#ff4805]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            >
                <div 
                    className={`absolute top-1 sm:top-1.5 w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 bg-[#ffffef] rounded-lg transition-all duration-300 ${
                        isDisinformerActive ? 'left-1 sm:left-1.5 md:left-2' : 'left-9 sm:left-11 md:left-[52px]'
                    }`}
                />
            </button>
            
            {/* Netizen label */}
            <span 
                className="font-['Play'] font-bold text-sm sm:text-lg md:text-[24px] text-[#ff4805]"
                style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
            >
                Netizen
            </span>
        </div>
    );
}
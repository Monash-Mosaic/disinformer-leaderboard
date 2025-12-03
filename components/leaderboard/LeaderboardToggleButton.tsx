"use client";

interface ToggleButtonProps {
    onClick: () => void;
    disabled?: boolean;
    text: string;
}

export default function ToggleButton({ onClick, disabled = false, text }: ToggleButtonProps) {
    return (
        <div className="mb-4 flex justify-center">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`px-4 py-2 bg-blue-500 text-white rounded transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
            >
                {text}
            </button>
        </div>
    );
}
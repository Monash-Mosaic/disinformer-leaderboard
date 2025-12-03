"use client";

interface SearchBarProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    onSubmit: (term: string) => void;
}

export default function SearchBar({ inputValue, setInputValue, onSubmit }: SearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(inputValue);
    };

    return (
        <div className="mb-8 flex justify-center">
            <form onSubmit={handleSubmit} className="flex w-full max-w-md">
                <input
                    type="text"
                    placeholder="Find user"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-l-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                >
                    Search
                </button>
            </form>
        </div>
    );
}
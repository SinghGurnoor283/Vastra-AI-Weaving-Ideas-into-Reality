import React, { useState } from 'react';
const ColorSwatch = ({ color }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (hex) => {
        navigator.clipboard.writeText(hex); //Web API for interacting with the system clipboard.
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); 
    };

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center shadow-md rounded-md">
                <div style={{ backgroundColor: color.tint }} className="w-5 h-8 rounded-l-md"></div>
                <div style={{ backgroundColor: color.original }} className="w-8 h-8 z-10 rounded-md border-2 border-black/20"></div>
                <div style={{ backgroundColor: color.shade }} className="w-5 h-8 rounded-r-md"></div>
            </div>
            <button
                onClick={() => handleCopy(color.original)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded-full bg-black/20"
                title={`Copy ${color.original}`}
            >
                {copied ? 'Copied!' : color.original}
            </button>
        </div>
    );
};

export default ColorSwatch;
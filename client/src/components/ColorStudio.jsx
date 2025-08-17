import React from 'react';
import ColorSwatch from './ColorSwatch'; 
 
const ColorStudio = ({ analysis, isLoading, onBaseColorSelect, selectedImageUrl }) => {
    if (isLoading && !analysis) { 
        return <div className="text-center text-gray-400 p-4 mt-4">Analyzing colors...</div>;
    }

    if (!analysis || !analysis.dominantPalette || !analysis.suggestedPalettes) {
        return null;
    }

    return (
        <div className="bg-zinc-800/80 backdrop-blur-md p-5 rounded-xl mt-4 w-full max-w-2xl">
           
            <div>
                <h3 className="font-semibold text-white py-3 text-lg">Dominant Palette</h3>
                <div className="flex flex-wrap gap-3">
                    {analysis.dominantPalette.map((color, i) => (
                        <div
                            key={i}
                            onClick={() => onBaseColorSelect(selectedImageUrl, color)}
                            title={`Set ${color} as base color`}
                            className={`w-12 h-12 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center
                                ${analysis.baseColor.toLowerCase() === color.toLowerCase()
                                    ? 'border-4 border-white shadow-lg scale-110'
                                    : 'border-2 border-white/20'
                                }`}
                            style={{ backgroundColor: color }}
                        >
                          {isLoading && analysis.baseColor.toLowerCase() === color.toLowerCase() && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                    ))}
                </div>
                <p className="text-sm py-3 text-gray-400 mb-3">Your selected image's main colors are shown above. Tap one to explore matching schemes.</p>
            </div>

            <hr className="my-4 border-white/10" />

            
            <div>
                <h3 className="font-semibold text-white text-lg">Suggested Palettes</h3>
                <p className="text-sm text-gray-400 mb-4">Based on <span className="font-bold" style={{color: analysis.baseColor}}>{analysis.baseColor}</span></p>
                <div className="space-y-5">
                    {Object.entries(analysis.suggestedPalettes).map(([harmony, colors]) => ( // Object into array of key value pairs
                      colors.length > 0 && (
                        <div key={harmony}>
                          <h4 className="text-sm font-semibold text-gray-300 capitalize mb-3">{harmony.replace('_', ' ')}</h4>
                          <div className="flex flex-wrap gap-x-6 gap-y-4">
                              {colors.map((colorObj, i) => (
                                  <ColorSwatch key={`${harmony}-${i}`} color={colorObj} />
                              ))}
                          </div>
                        </div>
                      )
                    ))}
                </div>
            </div>
            {/* Eg - analysis.suggestedPalettes = {
                    analogous: [
                        { name: "red", hex: "#FF0000" },
                        { name: "orange", hex: "#FFA500" }
                    ],
                    triadic: [
                        { name: "blue", hex: "#0000FF" },
                        { name: "yellow", hex: "#FFFF00" },
                        { name: "red", hex: "#FF0000" }
                    ]
                    };
                 */}
        </div>
    );
};

export default ColorStudio;
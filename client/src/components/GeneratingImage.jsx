import React from 'react';

const GeneratingImage = () => {
  return (
    <div>
      <div className="flex flex-col justify-center items-center gap-4">
        
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-white"></div>
        
        <p className="ml-3 text-white text-lg font-semibold">Generating your image...</p>
      </div>
    </div>
  );
};

export default GeneratingImage;
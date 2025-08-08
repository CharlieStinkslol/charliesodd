import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Loading CharliesOdds</h2>
        <p className="text-gray-400 mb-6">Setting up your gaming environment...</p>
        
        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">Demo Casino Platform</h3>
          <p className="text-gray-300 text-sm mb-4">
            CharliesOdds is a fully client-side demo casino. All your data is stored locally in your browser.
          </p>
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-3">
            <p className="text-blue-200 text-xs">
              No external database required - everything runs in your browser for maximum privacy and speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
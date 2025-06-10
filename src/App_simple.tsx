import React from 'react';

/**
 * Application ultra simple pour tester le rendu React
 * Sans routing, sans state complexe, sans appels API
 */
function App_simple() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          Test de Rendu React
        </h1>
        
        <div className="space-y-4 mb-8">
          <p className="text-center">
            Si vous voyez cette page, React fonctionne correctement.
          </p>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Informations de base :</h2>
            <p><span className="font-medium text-gray-300">Date :</span> {new Date().toLocaleDateString()}</p>
            <p><span className="font-medium text-gray-300">Heure :</span> {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={() => alert('Le JavaScript fonctionne !')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cliquez-moi
          </button>
        </div>
      </div>
    </div>
  );
}

export default App_simple;

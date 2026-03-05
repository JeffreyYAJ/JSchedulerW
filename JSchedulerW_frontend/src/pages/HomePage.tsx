import React from 'react';
// On importe le composant Modal que tu as créé précédemment
import WasteScannerModal from '../components/WasteScannerModal';

const MainDashboard: React.FC = () => {

  // --- LOGIQUE DE TRAITEMENT DE L'IMAGE ---
  // Cette fonction sera exécutée quand l'utilisateur cliquera sur "Analyser" dans le modal
  const handleAnalyzeImage = async (file: File): Promise<void> => {
    console.log("L'image est prête à être envoyée :", file.name);
    

    return new Promise((resolve) => {
      setTimeout(() => {
        alert("✅ Analyse IA terminée ! Le déchet a été géolocalisé et ajouté à la Marketplace.");
        resolve(); // Ferme l'état de chargement dans le modal
      }, 2000);
    });
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden font-sans">
      
      

      <div className="absolute inset-0 z-0 bg-green-50/30 flex flex-col items-center justify-center">
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: "radial-gradient(#22c55e 2px, transparent 2px)", backgroundSize: "30px 30px" }}>
         </div>
         
         
      </div>

      {/* --- BOUTON D'APPEL DU MODAL --- */}
      {/* On le positionne en bas, au centre, au-dessus de tout le reste (z-20) */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center px-4">
         
         {/* L'appel à ton composant Modal. 
             Le bouton est géré À L'INTÉRIEUR du composant WasteScannerModal */}
         <WasteScannerModal onAnalyze={handleAnalyzeImage} />
         
      </div>

    </div>
  );
};

export default MainDashboard;
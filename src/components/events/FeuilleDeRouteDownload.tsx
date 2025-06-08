import React, { useState } from 'react';
import { Download, FileText, Users, Wrench, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningItem {
  id: string;
  heure: string;
  intitule: string;
  groupe: 'artistes' | 'techniques';
}

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu?: string;
}

interface FeuilleDeRouteDownloadProps {
  event: Event;
  planningItems: PlanningItem[];
}

type FilterOption = 'artistes' | 'techniques' | 'tous';

export const FeuilleDeRouteDownload: React.FC<FeuilleDeRouteDownloadProps> = ({
  event,
  planningItems,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('tous');
  const [isPrinting, setIsPrinting] = useState(false);

  const filteredItems = planningItems
    .filter((item) => {
      if (selectedFilter === 'tous') return true;
      return item.groupe === selectedFilter;
    })
    .sort((a, b) => {
      // Trie par heure
      return a.heure.localeCompare(b.heure);
    });

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Timeout pour permettre au rendu de se terminer
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setIsModalOpen(false);
    }, 100);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP à HH:mm', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Composant pour l'impression
  const PrintableContent = () => (
    <div className="print-content">
      <div className="print-header">
        <div className="print-logo">STAGE PLANNER</div>
        <h1>{event.nom_evenement}</h1>
        <div className="print-dates">
          <p>Du {formatDate(event.date_debut)}</p>
          <p>Au {formatDate(event.date_fin)}</p>
          {event.lieu && <p>Lieu : {event.lieu}</p>}
        </div>
        <div className="print-filter-type">
          <h2>
            Feuille de route
            {selectedFilter === 'artistes' && ' - Artistes'}
            {selectedFilter === 'techniques' && ' - Équipe technique'}
          </h2>
        </div>
      </div>
      
      <div className="print-items">
        {filteredItems.length === 0 ? (
          <p className="print-no-items">Aucun élément à afficher pour ce filtre</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="print-item">
              <div className="print-item-time">{item.heure}</div>
              <div className="print-item-content">
                <p>{item.intitule}</p>
                <span className={`print-item-group print-item-group-${item.groupe}`}>
                  {item.groupe === 'artistes' ? 'Artistes' : 'Techniques'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="print-footer">
        <p>Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })}</p>
        <p>PLANNER Suite - Tous droits réservés</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton de téléchargement avec design moderne */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all shadow-lg hover:shadow-primary/20"
      >
        <Download size={18} />
        <span>Télécharger la feuille de route</span>
      </button>

      {/* Modale avec animation */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Télécharger la feuille de route</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-300 mb-6">
                Sélectionnez le type de feuille de route que vous souhaitez télécharger :
              </p>

              <div className="space-y-3 mb-8">
                {/* Option Artistes */}
                <button
                  onClick={() => setSelectedFilter('artistes')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedFilter === 'artistes'
                      ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} className={selectedFilter === 'artistes' ? 'text-primary' : ''} />
                    <span>Artistes uniquement</span>
                  </div>
                  {selectedFilter === 'artistes' && <Check size={18} className="text-primary" />}
                </button>

                {/* Option Techniques */}
                <button
                  onClick={() => setSelectedFilter('techniques')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedFilter === 'techniques'
                      ? 'bg-secondary/20 border-secondary shadow-lg shadow-secondary/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench size={20} className={selectedFilter === 'techniques' ? 'text-secondary' : ''} />
                    <span>Équipe technique uniquement</span>
                  </div>
                  {selectedFilter === 'techniques' && <Check size={18} className="text-secondary" />}
                </button>

                {/* Option Les deux */}
                <button
                  onClick={() => setSelectedFilter('tous')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedFilter === 'tous'
                      ? 'bg-white/20 border-white/40 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className={selectedFilter === 'tous' ? 'text-white' : ''} />
                    <span>Feuille de route complète</span>
                  </div>
                  {selectedFilter === 'tous' && <Check size={18} />}
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                  <Download size={18} />
                  <span>Télécharger</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu pour l'impression - caché en mode normal */}
      <div className={`print-only ${isPrinting ? '' : 'hidden'}`}>
        <PrintableContent />
      </div>

      {/* Styles CSS pour l'impression */}
      <style jsx global>{`
        /* Styles pour l'impression uniquement */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Styles du document imprimé */
          .print-content {
            padding: 20px;
            font-family: 'Arial', sans-serif;
            color: #000;
            background-color: white;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .print-logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          
          .print-header h1 {
            font-size: 28px;
            margin: 10px 0;
          }
          
          .print-dates {
            font-size: 14px;
            margin: 10px 0;
          }
          
          .print-filter-type h2 {
            font-size: 18px;
            margin-top: 15px;
            font-weight: bold;
          }
          
          .print-items {
            margin-top: 20px;
          }
          
          .print-item {
            display: flex;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .print-item-time {
            width: 80px;
            font-weight: bold;
            padding-right: 15px;
          }
          
          .print-item-content {
            flex: 1;
            border-left: 1px solid #ccc;
            padding-left: 15px;
            position: relative;
          }
          
          .print-item-group {
            position: absolute;
            right: 0;
            top: 0;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
          }
          
          .print-item-group-artistes {
            background-color: #e6f7ff;
            color: #0066cc;
          }
          
          .print-item-group-techniques {
            background-color: #fff1e6;
            color: #cc6600;
          }
          
          .print-no-items {
            text-align: center;
            font-style: italic;
            color: #666;
            margin: 30px 0;
          }
          
          .print-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
        }
      `}</style>
    </>
  );
};

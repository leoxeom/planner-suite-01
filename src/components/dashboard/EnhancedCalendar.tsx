import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Copy, Trash2, X, AlertTriangle, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../../store/themeStore';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/Button';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  className?: string;
  resource?: any;
}

interface EnhancedCalendarProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onEventDuplicate?: (event: CalendarEvent, startDate: Date) => void;
  onEventDelete?: (eventId: string) => void;
  onEventEdit?: (eventId: string) => void;
  onSlotSelect?: (start: Date, end: Date) => void;
}

export const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
  events,
  onEventClick,
  onEventDuplicate,
  onEventDelete,
  onEventEdit,
  onSlotSelect,
}) => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [tooltipEvent, setTooltipEvent] = useState<{event: CalendarEvent, position: {x: number, y: number}} | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  // Style personnalisé pour les événements du calendrier
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const isPastEvent = moment(event.end).isBefore(moment());
    const isDraggingThis = isDragging && draggedEvent?.id === event.id;
    
    const baseStyle = {
      backgroundColor: isPastEvent ? 'rgba(100, 100, 100, 0.7)' : colors.primary,
      borderRadius: '8px',
      opacity: isDraggingThis ? 0.5 : 1,
      border: `1px solid ${isPastEvent ? 'rgba(120, 120, 120, 0.7)' : colors.primary}`,
      color: 'white',
      transition: 'all 0.2s ease',
    };
    
    if (event.className) {
      return { className: event.className, style: baseStyle };
    }
    
    return { style: baseStyle };
  }, [colors, isDragging, draggedEvent]);

  // Gestionnaire pour le début du drag
  const handleEventDragStart = useCallback((event: CalendarEvent) => {
    setIsDragging(true);
    setDraggedEvent(event);
    setHoveredEvent(null); // Fermer le menu contextuel
    
    // Créer une image fantôme pour le drag
    const ghostElement = document.createElement('div');
    ghostElement.innerText = event.title;
    ghostElement.style.position = 'absolute';
    ghostElement.style.left = '-1000px';
    document.body.appendChild(ghostElement);
    
    return ghostElement;
  }, []);

  // Gestionnaire pour le drop
  const handleEventDrop = useCallback((dropResult: any) => {
    setIsDragging(false);
    
    if (draggedEvent && dropResult.start) {
      // Calculer la différence entre la date d'origine et la nouvelle date
      const originalStart = moment(draggedEvent.start);
      const newStart = moment(dropResult.start);
      const daysDiff = newStart.diff(originalStart, 'days');
      
      // Créer une nouvelle date de début en ajoutant la différence
      const newEventStart = moment(draggedEvent.start).add(daysDiff, 'days').toDate();
      const newEventEnd = moment(draggedEvent.end).add(daysDiff, 'days').toDate();
      
      // Appeler la fonction de duplication avec les nouvelles dates
      if (onEventDuplicate) {
        const duplicatedEvent = {
          ...draggedEvent,
          start: newEventStart,
          end: newEventEnd
        };
        onEventDuplicate(duplicatedEvent, newEventStart);
        
        toast.success(`Événement dupliqué pour le ${moment(newEventStart).format('LL')}`, {
          icon: <Copy size={18} />,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    }
    
    setDraggedEvent(null);
    setDragOverDate(null);
  }, [draggedEvent, onEventDuplicate]);

  // Gestionnaire pour le survol d'un événement
  const handleEventHover = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    if (isDragging) return; // Ne pas afficher le menu pendant le drag
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredEvent(event);
    setMenuPosition({
      x: rect.right,
      y: rect.top
    });
  }, [isDragging]);

  // Gestionnaire pour quitter le survol d'un événement
  const handleEventLeave = useCallback(() => {
    // Petit délai pour permettre de cliquer sur le menu
    setTimeout(() => {
      const menuElement = document.querySelector('.event-context-menu');
      const isHoveringMenu = menuElement && (menuElement as HTMLElement).matches(':hover');
      
      if (!isHoveringMenu) {
        setHoveredEvent(null);
      }
    }, 100);
  }, []);

  // Gestionnaire pour le clic sur un événement
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event.id);
    }
  }, [onEventClick]);

  // Gestionnaire pour la sélection d'un créneau
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    if (onSlotSelect) {
      onSlotSelect(start, end);
    }
  }, [onSlotSelect]);

  // Gestionnaire pour l'édition d'un événement
  const handleEditEvent = useCallback((eventId: string) => {
    setHoveredEvent(null);
    if (onEventEdit) {
      onEventEdit(eventId);
    }
  }, [onEventEdit]);

  // Gestionnaire pour la duplication d'un événement
  const handleDuplicateEvent = useCallback((event: CalendarEvent) => {
    setHoveredEvent(null);
    if (onEventDuplicate) {
      onEventDuplicate(event, event.start);
      toast.success(`Événement dupliqué`, {
        icon: <Copy size={18} />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  }, [onEventDuplicate]);

  // Gestionnaire pour la suppression d'un événement
  const handleDeleteEvent = useCallback((eventId: string) => {
    setHoveredEvent(null);
    setEventToDelete(eventId);
    setShowDeleteConfirm(true);
  }, []);

  // Gestionnaire pour confirmer la suppression
  const confirmDeleteEvent = useCallback(() => {
    if (eventToDelete && onEventDelete) {
      onEventDelete(eventToDelete);
      toast.success('Événement supprimé', {
        icon: <Check size={18} />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  }, [eventToDelete, onEventDelete]);

  // Gestionnaire pour le survol d'une cellule pendant le drag
  const handleDragOverCell = useCallback((date: Date) => {
    if (isDragging) {
      setDragOverDate(date);
    }
  }, [isDragging]);

  // Composant personnalisé pour l'événement
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    return (
      <div
        className="rbc-event-content custom-event"
        draggable
        onDragStart={(e) => {
          const ghost = handleEventDragStart(event);
          if (e.dataTransfer && ghost) {
            e.dataTransfer.setDragImage(ghost, 0, 0);
            e.dataTransfer.effectAllowed = 'copy';
          }
        }}
        onMouseEnter={(e) => handleEventHover(event, e)}
        onMouseLeave={handleEventLeave}
        onClick={() => handleEventClick(event)}
        onMouseMove={(e) => {
          // Afficher le tooltip après un petit délai pour éviter les déclenchements accidentels
          if (!tooltipEvent || tooltipEvent.event.id !== event.id) {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setTooltipEvent({
              event,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top - 10
              }
            });
          }
        }}
        onMouseOut={() => setTooltipEvent(null)}
      >
        <div className="event-title">{event.title}</div>
      </div>
    );
  }, [handleEventDragStart, handleEventHover, handleEventLeave, handleEventClick]);

  // Formats personnalisés pour le calendrier
  const formats = useMemo(() => ({
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd D MMMM',
    dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) => 
      `${moment(start).format('D')} - ${moment(end).format('D MMMM YYYY')}`,
  }), []);

  return (
    <div className="enhanced-calendar-container relative">
      <div 
        ref={calendarRef}
        className="calendar-wrapper bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg"
        onDragOver={(e) => {
          e.preventDefault();
          if (isDragging && e.target instanceof HTMLElement) {
            // Trouver la cellule du calendrier sous le curseur
            const cell = e.target.closest('.rbc-day-bg');
            if (cell) {
              const dateAttr = cell.getAttribute('data-date');
              if (dateAttr) {
                handleDragOverCell(new Date(dateAttr));
              }
            }
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (isDragging && dragOverDate) {
            handleEventDrop({ start: dragOverDate });
          }
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          popup={true}
          formats={formats}
          components={{
            event: EventComponent as any
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          messages={{
            today: "Aujourd'hui",
            previous: "Précédent",
            next: "Suivant",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun événement sur cette période",
            showMore: (total) => `+ ${total} autres`,
          }}
          className={`${isDragging ? 'dragging-active' : ''}`}
        />
        
        {/* Indicateur de zone de drop pendant le drag */}
        {isDragging && dragOverDate && (
          <div className="drop-indicator absolute inset-0 pointer-events-none">
            <div className="text-center bg-primary/20 backdrop-blur-sm py-2 px-4 rounded-lg border border-primary/30 shadow-lg inline-block">
              <p className="text-sm font-medium">Déposer pour dupliquer l'événement le {moment(dragOverDate).format('LL')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu contextuel au survol */}
      <AnimatePresence>
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="event-context-menu absolute bg-white/15 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-xl z-50"
            style={{
              top: `${menuPosition.y}px`,
              left: `${menuPosition.x + 10}px`,
            }}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleEditEvent(hoveredEvent.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Edit size={16} className="text-blue-400" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => handleDuplicateEvent(hoveredEvent)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Copy size={16} className="text-green-400" />
                <span>Dupliquer</span>
              </button>
              <button
                onClick={() => handleDeleteEvent(hoveredEvent.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-red-400"
              >
                <Trash2 size={16} />
                <span>Supprimer</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip d'information */}
      <AnimatePresence>
        {tooltipEvent && !hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="tooltip absolute bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg shadow-lg z-50 text-sm pointer-events-none"
            style={{
              top: `${tooltipEvent.position.y - 40}px`,
              left: `${tooltipEvent.position.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-2">
              <Info size={14} />
              <span>Cliquez pour voir les détails ou survolez pour plus d'options</span>
            </div>
            <div className="tooltip-arrow absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80" 
              style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale de confirmation de suppression */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-900/20">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold">Confirmer la suppression</h3>
              </div>
              
              <p className="mb-6 text-gray-300">
                Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
              </p>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <X size={18} className="mr-2" />
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteEvent}
                >
                  <Trash2 size={18} className="mr-2" />
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles personnalisés */}
      <style jsx global>{`
        .enhanced-calendar-container .rbc-calendar {
          font-family: 'Inter', sans-serif;
        }
        
        .enhanced-calendar-container .rbc-header {
          padding: 12px 3px;
          font-weight: 600;
          text-transform: capitalize;
          background-color: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .enhanced-calendar-container .rbc-month-view {
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .enhanced-calendar-container .rbc-day-bg {
          transition: background-color 0.2s ease;
        }
        
        .enhanced-calendar-container .rbc-day-bg:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .enhanced-calendar-container .rbc-off-range-bg {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .enhanced-calendar-container .rbc-today {
          background-color: rgba(var(--color-primary-rgb), 0.1);
        }
        
        .enhanced-calendar-container .rbc-event {
          padding: 4px 8px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .enhanced-calendar-container .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        
        .enhanced-calendar-container .custom-event {
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .enhanced-calendar-container .rbc-toolbar {
          margin-bottom: 20px;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .enhanced-calendar-container .rbc-toolbar button {
          padding: 8px 12px;
          border-radius: 8px;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        
        .enhanced-calendar-container .rbc-toolbar button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .enhanced-calendar-container .rbc-toolbar button.rbc-active {
          background-color: rgba(var(--color-primary-rgb), 0.2);
          border-color: rgba(var(--color-primary-rgb), 0.3);
        }
        
        .enhanced-calendar-container .rbc-toolbar button.rbc-active:hover {
          background-color: rgba(var(--color-primary-rgb), 0.3);
        }
        
        .enhanced-calendar-container.dragging-active .rbc-day-bg {
          cursor: copy;
        }
        
        .enhanced-calendar-container.dragging-active .rbc-day-bg:hover {
          background-color: rgba(var(--color-primary-rgb), 0.1);
          border: 2px dashed var(--color-primary);
        }
        
        .drop-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

import React from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr': fr,
};

type ViewType = 'month' | 'week' | 'day';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  className?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ events = [], onEventClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentView, setCurrentView] = useState<ViewType>('month');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create gradient orbs
    const orbs = [
      { x: 0.3, y: 0.3, color: '#007FFF', size: 0.4 }, // Bleu Électrique
      { x: 0.7, y: 0.7, color: '#F72798', size: 0.35 }, // Magenta
      { x: 0.5, y: 0.4, color: '#4A0D6A', size: 0.45 }, // Violet
    ];

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.002;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb, i) => {
        const x = canvas.width * (orb.x + Math.sin(time + i) * 0.05);
        const y = canvas.height * (orb.y + Math.cos(time + i) * 0.05);
        const gradient = ctx.createRadialGradient(
          x, y, 0,
          x, y, Math.max(canvas.width, canvas.height) * orb.size
        );

        gradient.addColorStop(0, `${orb.color}30`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  return (
    <div className="relative h-[600px]">
      {/* Dynamic background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Calendar container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative h-full rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(35, 38, 58, 0.55)',
          backdropFilter: 'blur(20px) saturate(170%)',
          border: '1px solid rgba(200, 220, 255, 0.15)',
          boxShadow: '0px 12px 35px 5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="h-full p-4">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={currentView}
            onView={(view) => setCurrentView(view as ViewType)}
            views={['month', 'week', 'day']}
            messages={{
              next: 'Suivant',
              previous: 'Précédent',
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Événement',
            }}
            onSelectEvent={(event: CalendarEvent) => {
              if (onEventClick) {
                onEventClick(event.id);
              }
            }}
            className="calendar-custom"
          />
        </div>
      </motion.div>

      <style>{`
        /* Calendar Header Styles */
        .calendar-custom .rbc-toolbar {
          @apply mb-4 flex-wrap gap-4 font-heading;
        }

        .calendar-custom .rbc-toolbar-label {
          @apply font-display text-xl text-white order-1 flex-grow text-center;
        }

        /* Calendar Grid Styles */
        .calendar-custom .rbc-month-view {
          @apply rounded-xl overflow-hidden border-0 p-1;
          background: rgba(40, 45, 70, 0.15);
        }

        .calendar-custom .rbc-month-row {
          @apply border-0 gap-1;
        }

        .calendar-custom .rbc-day-bg {
          @apply transition-all duration-300 rounded-xl;
          background: rgba(40, 45, 70, 0.3);
          box-shadow: inset 0 0 0 1px rgba(0, 127, 255, 0.1),
                      inset 0 2px 4px rgba(0, 0, 0, 0.1);
          transform-origin: center;
        }

        .calendar-custom .rbc-off-range-bg {
          background: rgba(40, 45, 70, 0.15);
        }

        .calendar-custom .rbc-off-range {
          @apply opacity-30;
        }

        .calendar-custom .rbc-date-cell {
          @apply font-heading text-sm text-gray-400 p-3;
        }

        .calendar-custom .rbc-today {
          background: rgba(0, 127, 255, 0.15);
          box-shadow: inset 0 0 0 1px rgba(0, 127, 255, 0.2),
                      inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Event Styles */
        .calendar-custom .rbc-event {
          @apply rounded-lg transition-all duration-300;
          background: linear-gradient(135deg, rgba(0, 127, 255, 0.7), rgba(51, 153, 255, 0.5));
          border: 1px solid rgba(173, 216, 230, 0.4);
          box-shadow: 0 0 10px 2px rgba(0, 127, 255, 0.3),
                      0 0 25px 8px rgba(0, 127, 255, 0.15);
          margin: 2px;
        }

        .calendar-custom .rbc-event:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 0 15px 4px rgba(0, 127, 255, 0.4),
                      0 0 30px 12px rgba(0, 127, 255, 0.2);
          z-index: 2;
        }

        .calendar-custom .rbc-event-content {
          @apply font-heading font-medium text-sm text-white p-2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* Show More Link */
        .calendar-custom .rbc-show-more {
          @apply font-heading text-xs text-primary-400 hover:text-primary-300 transition-all;
          background: rgba(40, 45, 70, 0.6);
          backdrop-filter: blur(8px);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(0, 127, 255, 0.2);
          margin: 2px;
        }

        /* Header Cells */
        .calendar-custom .rbc-header {
          @apply font-heading text-sm text-gray-400 py-3;
          border-bottom: 1px solid rgba(0, 127, 255, 0.15);
        }

        .calendar-custom .rbc-btn-group {
          @apply flex gap-2 order-2;
        }

        .calendar-custom .rbc-btn-group button {
          @apply px-4 py-2 rounded-lg font-heading text-sm;
          @apply bg-[rgba(50,55,80,0.6)] backdrop-blur-[8px] saturate-[120%];
          @apply border border-[rgba(200,220,255,0.1)];
          @apply text-[#A0A8C0] transition-all duration-300;
          @apply relative overflow-hidden;
        }

        /* Glass reflection effect */
        .calendar-custom .rbc-btn-group button::before {
          content: '';
          @apply absolute inset-0;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 60%
          );
          @apply opacity-0 transition-opacity duration-300;
        }

        .calendar-custom .rbc-btn-group button:hover::before {
          @apply opacity-100;
        }

        /* Active button state */
        .calendar-custom .rbc-btn-group button.rbc-active {
          @apply bg-[rgba(0,127,255,0.15)] text-primary-400;
          box-shadow: 0 0 10px rgba(0, 127, 255, 0.1);
        }

        .calendar-custom .rbc-btn-group button:hover {
          @apply bg-[rgba(50,55,80,0.8)] text-white;
        }

        .calendar-custom .rbc-btn-group button.rbc-active:hover {
          @apply bg-[rgba(0,127,255,0.2)];
        }

        /* Remove default button styles */
        .calendar-custom .rbc-btn-group button:focus {
          @apply outline-none;
        }

        .calendar-custom .rbc-btn-group button:first-child {
          @apply rounded-lg border-[rgba(200,220,255,0.1)];
        }

        .calendar-custom .rbc-btn-group button:last-child {
          @apply rounded-lg border-[rgba(200,220,255,0.1)];
        }

        /* Event Styles */
        .calendar-custom .rbc-event {
          @apply bg-gradient-to-r from-primary-DEFAULT/60 to-primary-DEFAULT/40;
          @apply shadow-[0_0_15px_rgba(0,127,255,0.15)];
          @apply hover:shadow-[0_0_20px_rgba(0,127,255,0.25)];
          @apply hover:-translate-y-0.5;
        }

        /* Status-specific styles */
        .calendar-custom .event-draft {
          background: linear-gradient(135deg, rgba(68, 68, 68, 0.7), rgba(51, 51, 51, 0.5));
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 10px 2px rgba(100, 100, 100, 0.3),
                      0 0 25px 8px rgba(100, 100, 100, 0.15);
        }

        .calendar-custom .event-published {
          background: linear-gradient(135deg, rgba(0, 127, 255, 0.7), rgba(0, 102, 255, 0.5));
          border: 1px solid rgba(173, 216, 230, 0.4);
          box-shadow: 0 0 10px 2px rgba(0, 127, 255, 0.3),
                      0 0 25px 8px rgba(0, 127, 255, 0.15);
        }

        .calendar-custom .event-complete {
          background: linear-gradient(135deg, rgba(102, 187, 106, 0.7), rgba(76, 175, 80, 0.5));
          border: 1px solid rgba(144, 238, 144, 0.4);
          box-shadow: 0 0 10px 2px rgba(102, 187, 106, 0.3),
                      0 0 25px 8px rgba(102, 187, 106, 0.15);
        }

        .calendar-custom .event-canceled {
          background: linear-gradient(135deg, rgba(239, 83, 80, 0.7), rgba(229, 57, 53, 0.5));
          border: 1px solid rgba(255, 205, 210, 0.4);
          box-shadow: 0 0 10px 2px rgba(239, 83, 80, 0.3),
                      0 0 25px 8px rgba(239, 83, 80, 0.15);
        }
      `}</style>
    </div>
  );
};
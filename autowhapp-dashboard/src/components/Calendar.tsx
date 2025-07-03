import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CalendarEvent } from '../types';

interface CalendarComponentProps {
  events: CalendarEvent[];
  onEventClick: (event: any) => void;
}

const Calendar: React.FC<CalendarComponentProps> = ({ events, onEventClick }) => {
  const fcEvents = events.map(e => {
    // Asegurar que las fechas se mantengan en la zona horaria local
    const startDate = e.start instanceof Date ? e.start : new Date(e.start);
    const endDate = e.end instanceof Date ? e.end : new Date(e.end);
    
    return {
      id: e.id,
      title: e.title,
      start: startDate,
      end: endDate,
      backgroundColor: e.backgroundColor || '#3788d8',
      borderColor: e.backgroundColor || '#3788d8',
      extendedProps: {
        cliente: e.cliente,
        telefono: e.telefono,
        descripcion: e.descripcion,
      }
    };
  });

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={fcEvents}
      eventClick={({ event }) => onEventClick({ event })}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      slotLabelFormat={{
        hour: 'numeric',
        minute: '2-digit',
        omitZeroMinute: false,
        meridiem: false,
      }}
      height="auto"
      locale={esLocale}
      eventTextColor="white"
      allDaySlot={false}
      nowIndicator={true}
      weekends={true}
      eventDisplay="block"
      dayMaxEvents={false}
    />
  );
};

export default Calendar;

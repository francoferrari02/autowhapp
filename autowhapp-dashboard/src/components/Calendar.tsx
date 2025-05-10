import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es'
import { CalendarEvent } from '../types';

interface CalendarComponentProps {
  events: CalendarEvent[];
  onEventClick: (event: any) => void;
}

const Calendar: React.FC<CalendarComponentProps> = ({ events, onEventClick }) => {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events}
      eventClick={(info) => onEventClick(info)}
      slotMinTime="00:00:00"
      slotMaxTime="24:00:00"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      slotLabelFormat={{
        hour: 'numeric',
        minute: '2-digit',
        omitZeroMinute: true,
        meridiem: 'short',
      }}
      height="auto"
      locale={esLocale}
      timeZone="America/Argentina/Buenos_Aires"
      eventTextColor="white"
      allDaySlot={false}
    />
  );
};

export default Calendar;
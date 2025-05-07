import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '../types';

interface CalendarComponentProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: any) => void;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ events, onDateClick, onEventClick }) => {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events.map(event => ({
        ...event,
        start: event.start,
        end: event.end,
      }))}
      
      dateClick={(info) => onDateClick(info.date)}
      eventClick={(info) => onEventClick(info)}
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      height="auto"
      locale="es"
      timeZone="America/Argentina/Buenos_Aires"
      eventTextColor="white"
      allDaySlot={false}
    />
  );
};

export default CalendarComponent;
import { useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { EventModalDemo } from './EventModalDemo';
import { CalendarSidebarDemo } from './CalendarSidebarDemo';
import { Calendar, Event } from '../../types/database';

// Demo data with updated colors
const DEMO_CALENDARS: Calendar[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Personal',
    color: '#B45309',
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Work',
    color: '#059669',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const today = new Date();
const DEMO_EVENTS: Event[] = [
  {
    id: '1',
    calendar_id: '1',
    title: 'Morning Yoga',
    description: 'Start the day with some stretching',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString(),
    all_day: false,
    location: 'Home',
    is_recurring: false,
    rrule: null,
    recurring_event_id: null,
    is_exception: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    calendar_id: '2',
    title: 'Team Standup',
    description: 'Daily sync with the team',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(),
    all_day: false,
    location: 'Zoom',
    is_recurring: false,
    rrule: null,
    recurring_event_id: null,
    is_exception: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    calendar_id: '2',
    title: 'Project Review',
    description: 'Q1 planning session',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0).toISOString(),
    all_day: false,
    location: 'Conference Room A',
    is_recurring: false,
    rrule: null,
    recurring_event_id: null,
    is_exception: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    calendar_id: '1',
    title: 'Weekend Trip',
    description: 'Mountain getaway',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 0, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59).toISOString(),
    all_day: true,
    location: null,
    is_recurring: false,
    rrule: null,
    recurring_event_id: null,
    is_exception: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function CalendarViewDemo() {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendars, setCalendars] = useState<Calendar[]>(DEMO_CALENDARS);
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(
    DEMO_CALENDARS.map((c) => c.id)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: Date;
    end: Date;
    allDay: boolean;
  } | null>(null);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setSelectedDateRange({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay,
    });
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDateRange(null);
      setModalOpen(true);
    }
  }, [events]);

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    const eventId = dropInfo.event.id;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              start_time: dropInfo.event.start!.toISOString(),
              end_time: (dropInfo.event.end || dropInfo.event.start!).toISOString(),
            }
          : e
      )
    );
  }, []);

  const handleToggleCalendar = useCallback((calendarId: string) => {
    setVisibleCalendarIds((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedDateRange(null);
  }, []);

  const handleSaveEvent = useCallback(
    (eventData: Partial<Event> & { calendar_id: string }) => {
      if (selectedEvent) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id ? { ...e, ...eventData } : e
          )
        );
      } else {
        const newEvent: Event = {
          id: String(Date.now()),
          calendar_id: eventData.calendar_id,
          title: eventData.title || 'Untitled Event',
          description: eventData.description || null,
          start_time: eventData.start_time!,
          end_time: eventData.end_time!,
          all_day: eventData.all_day || false,
          location: eventData.location || null,
          is_recurring: eventData.is_recurring || false,
          rrule: eventData.rrule || null,
          recurring_event_id: null,
          is_exception: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEvents((prev) => [...prev, newEvent]);
      }
      handleCloseModal();
    },
    [selectedEvent, handleCloseModal]
  );

  const handleDeleteEvent = useCallback(() => {
    if (selectedEvent) {
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      handleCloseModal();
    }
  }, [selectedEvent, handleCloseModal]);

  const handleCreateCalendar = useCallback((name: string, color: string) => {
    const newCalendar: Calendar = {
      id: String(Date.now()),
      user_id: 'demo',
      name,
      color,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCalendars((prev) => [...prev, newCalendar]);
    setVisibleCalendarIds((prev) => [...prev, newCalendar.id]);
  }, []);

  const handleUpdateCalendar = useCallback((id: string, name: string, color: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, color } : c))
    );
  }, []);

  const handleDeleteCalendar = useCallback((id: string) => {
    setCalendars((prev) => prev.filter((c) => c.id !== id));
    setEvents((prev) => prev.filter((e) => e.calendar_id !== id));
    setVisibleCalendarIds((prev) => prev.filter((cid) => cid !== id));
  }, []);

  // Filter events by visible calendars
  const visibleEvents = events.filter((e) =>
    visibleCalendarIds.includes(e.calendar_id)
  );

  // Get calendar color map
  const calendarColorMap = calendars.reduce(
    (acc, cal) => {
      acc[cal.id] = cal.color;
      return acc;
    },
    {} as Record<string, string>
  );

  // Transform events for FullCalendar
  const fcEvents = visibleEvents.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    allDay: event.all_day,
    backgroundColor: calendarColorMap[event.calendar_id] || '#B45309',
    borderColor: calendarColorMap[event.calendar_id] || '#B45309',
  }));

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <CalendarSidebarDemo
        calendars={calendars}
        visibleCalendarIds={visibleCalendarIds}
        onToggleCalendar={handleToggleCalendar}
        onCreateCalendar={handleCreateCalendar}
        onUpdateCalendar={handleUpdateCalendar}
        onDeleteCalendar={handleDeleteCalendar}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto h-full animate-fade-in">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={fcEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            editable={true}
            eventStartEditable={true}
            eventDurationEditable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="100%"
            dayHeaderFormat={{ weekday: 'short' }}
          />
        </div>
      </div>

      <EventModalDemo
        open={modalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        dateRange={selectedDateRange}
        calendars={calendars}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}

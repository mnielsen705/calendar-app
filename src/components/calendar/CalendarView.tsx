import { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { DateSelectArg, EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core';
import { useEvents, EventOccurrence } from '../../hooks/useEvents';
import { useCalendars } from '../../hooks/useCalendars';
import { EventModal } from './EventModal';
import { CalendarSidebar } from './CalendarSidebar';
import { Calendar, Event as EventType } from '../../types/database';

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { calendars } = useCalendars();
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(
    visibleCalendarIds,
    dateRange
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventOccurrence | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: Date;
    end: Date;
    allDay: boolean;
  } | null>(null);

  // Initialize visible calendars
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendarIds.length === 0) {
      setVisibleCalendarIds(calendars.map((c) => c.id));
    }
  }, [calendars, visibleCalendarIds.length]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end });
  }, []);

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
    const eventData = clickInfo.event.extendedProps as EventOccurrence;
    setSelectedEvent({
      ...eventData,
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start_time: clickInfo.event.start!,
      end_time: clickInfo.event.end || clickInfo.event.start!,
    });
    setSelectedDateRange(null);
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const event = dropInfo.event;
      const eventData = event.extendedProps as EventOccurrence;

      if (eventData.isOccurrence) {
        // For recurring event occurrences, we'd need to handle exceptions
        // For now, revert the change
        dropInfo.revert();
        return;
      }

      try {
        await updateEvent.mutateAsync({
          id: event.id,
          start_time: event.start!.toISOString(),
          end_time: (event.end || event.start!).toISOString(),
        });
      } catch {
        dropInfo.revert();
      }
    },
    [updateEvent]
  );

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
    async (eventData: Partial<EventType> & { calendar_id: string }) => {
      if (selectedEvent) {
        await updateEvent.mutateAsync({
          id: selectedEvent.id,
          ...eventData,
        });
      } else {
        await createEvent.mutateAsync({
          ...eventData,
          title: eventData.title || 'Untitled Event',
          start_time: eventData.start_time!,
          end_time: eventData.end_time!,
        });
      }
      handleCloseModal();
    },
    [selectedEvent, createEvent, updateEvent, handleCloseModal]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (selectedEvent) {
      await deleteEvent.mutateAsync(selectedEvent.id);
      handleCloseModal();
    }
  }, [selectedEvent, deleteEvent, handleCloseModal]);

  // Get calendar color map
  const calendarColorMap = calendars.reduce(
    (acc, cal) => {
      acc[cal.id] = cal.color;
      return acc;
    },
    {} as Record<string, string>
  );

  // Transform events for FullCalendar
  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    allDay: event.all_day,
    backgroundColor: calendarColorMap[event.calendar_id] || '#3b82f6',
    borderColor: calendarColorMap[event.calendar_id] || '#3b82f6',
    extendedProps: event,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <CalendarSidebar
        calendars={calendars}
        visibleCalendarIds={visibleCalendarIds}
        onToggleCalendar={handleToggleCalendar}
      />
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow p-4 h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={fcEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            editable={true}
            eventStartEditable={true}
            eventDurationEditable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            datesSet={handleDatesSet}
            height="100%"
          />
        </div>
      </div>

      <EventModal
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

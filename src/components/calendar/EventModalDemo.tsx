import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPin, AlignLeft, Clock, CalendarDays } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Calendar, Event } from '../../types/database';

interface EventModalDemoProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
  dateRange: { start: Date; end: Date; allDay: boolean } | null;
  calendars: Calendar[];
  onSave: (event: Partial<Event> & { calendar_id: string }) => void;
  onDelete: () => void;
}

export function EventModalDemo({
  open,
  onClose,
  event,
  dateRange,
  calendars,
  onSave,
  onDelete,
}: EventModalDemoProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartDate(format(new Date(event.start_time), 'yyyy-MM-dd'));
      setStartTime(format(new Date(event.start_time), 'HH:mm'));
      setEndDate(format(new Date(event.end_time), 'yyyy-MM-dd'));
      setEndTime(format(new Date(event.end_time), 'HH:mm'));
      setAllDay(event.all_day);
      setCalendarId(event.calendar_id);
    } else if (dateRange) {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(format(dateRange.start, 'yyyy-MM-dd'));
      setStartTime(format(dateRange.start, 'HH:mm'));
      setEndDate(format(dateRange.end, 'yyyy-MM-dd'));
      setEndTime(format(dateRange.end, 'HH:mm'));
      setAllDay(dateRange.allDay);
      setCalendarId(calendars[0]?.id || '');
    }
  }, [event, dateRange, calendars]);

  const handleSubmit = () => {
    if (!title.trim() || !calendarId) return;

    const startDateTime = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);
    const endDateTime = allDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}`);

    onSave({
      calendar_id: calendarId,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      all_day: allDay,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event?')) {
      onDelete();
    }
  };

  const calendarOptions = calendars.map((cal) => ({
    value: cal.id,
    label: cal.name,
  }));

  const selectedCalendar = calendars.find((c) => c.id === calendarId);

  return (
    <Modal
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title={event ? 'Edit Event' : 'New Event'}
    >
      <div className="space-y-5">
        {/* Title with calendar color indicator */}
        <div className="relative">
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full text-xl font-medium border-0 border-b-2 border-stone-200 pb-3 focus:outline-none focus:border-stone-400 transition-colors bg-transparent placeholder:text-stone-300"
            style={{ fontFamily: 'var(--font-display)' }}
          />
          {selectedCalendar && (
            <div
              className="absolute right-0 top-1 w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCalendar.color }}
            />
          )}
        </div>

        {/* Calendar selector */}
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-stone-400" />
          <div className="flex-1">
            <Select
              value={calendarId}
              onValueChange={setCalendarId}
              options={calendarOptions}
              placeholder="Select calendar"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-stone-400 mt-3" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="allDay" className="text-sm text-stone-600">
                All day
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-stone-400" />
          <input
            type="text"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 px-0 py-2 border-0 border-b border-stone-200 focus:outline-none focus:border-stone-400 transition-colors bg-transparent placeholder:text-stone-400 text-sm"
          />
        </div>

        {/* Description */}
        <div className="flex items-start gap-3">
          <AlignLeft size={18} className="text-stone-400 mt-2" />
          <textarea
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 px-0 py-2 border-0 border-b border-stone-200 focus:outline-none focus:border-stone-400 transition-colors bg-transparent placeholder:text-stone-400 text-sm resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-stone-100">
          {event ? (
            <Button variant="danger" onClick={handleDelete}>
              Delete Event
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

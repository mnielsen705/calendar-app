import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { RecurringEventForm } from './RecurringEventForm';
import { Calendar, Event as EventType } from '../../types/database';
import { EventOccurrence } from '../../hooks/useEvents';
import { RecurrenceConfig, createRRule, parseRRule } from '../../lib/rrule-utils';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event: EventOccurrence | null;
  dateRange: { start: Date; end: Date; allDay: boolean } | null;
  calendars: Calendar[];
  onSave: (event: Partial<EventType> & { calendar_id: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function EventModal({
  open,
  onClose,
  event,
  dateRange,
  calendars,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
    frequency: 'weekly',
    interval: 1,
    endType: 'never',
  });
  const [saving, setSaving] = useState(false);

  // Initialize form when opening
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartDate(format(event.start_time, 'yyyy-MM-dd'));
      setStartTime(format(event.start_time, 'HH:mm'));
      setEndDate(format(event.end_time, 'yyyy-MM-dd'));
      setEndTime(format(event.end_time, 'HH:mm'));
      setAllDay(event.all_day);
      setCalendarId(event.calendar_id);
      setIsRecurring(event.is_recurring);
      if (event.rrule) {
        const parsed = parseRRule(event.rrule);
        if (parsed) setRecurrenceConfig(parsed);
      }
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
      setIsRecurring(false);
      setRecurrenceConfig({
        frequency: 'weekly',
        interval: 1,
        endType: 'never',
      });
    }
  }, [event, dateRange, calendars]);

  const handleSubmit = async () => {
    if (!title.trim() || !calendarId) return;

    setSaving(true);

    const startDateTime = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);
    const endDateTime = allDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}`);

    const eventData: Partial<EventType> & { calendar_id: string } = {
      calendar_id: calendarId,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      all_day: allDay,
      is_recurring: isRecurring,
      rrule: isRecurring ? createRRule(startDateTime, recurrenceConfig) : null,
    };

    try {
      await onSave(eventData);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event?')) {
      setSaving(true);
      try {
        await onDelete();
      } finally {
        setSaving(false);
      }
    }
  };

  const calendarOptions = calendars.map((cal) => ({
    value: cal.id,
    label: cal.name,
  }));

  return (
    <Modal
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title={event ? 'Edit Event' : 'New Event'}
    >
      <div className="space-y-4">
        <Input
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <Select
          label="Calendar"
          value={calendarId}
          onValueChange={setCalendarId}
          options={calendarOptions}
          placeholder="Select a calendar"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allDay" className="text-sm text-gray-700">
            All day
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            label="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {!allDay && (
            <Input
              type="time"
              label="Start time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            label="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {!allDay && (
            <Input
              type="time"
              label="End time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          )}
        </div>

        <Input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="recurring" className="text-sm text-gray-700">
            Repeat
          </label>
        </div>

        {isRecurring && (
          <RecurringEventForm config={recurrenceConfig} onChange={setRecurrenceConfig} />
        )}

        <div className="flex justify-between pt-4">
          {event ? (
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

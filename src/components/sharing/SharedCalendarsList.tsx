import { CalendarWithPermission } from '../../types/database';

interface SharedCalendarsListProps {
  calendars: CalendarWithPermission[];
  visibleCalendarIds: string[];
  onToggleCalendar: (calendarId: string) => void;
}

export function SharedCalendarsList({
  calendars,
  visibleCalendarIds,
  onToggleCalendar,
}: SharedCalendarsListProps) {
  const sharedCalendars = calendars.filter((c) => c.permission !== 'owner');

  if (sharedCalendars.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Shared with me</h3>
      <div className="space-y-1">
        {sharedCalendars.map((calendar) => (
          <div
            key={calendar.id}
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={visibleCalendarIds.includes(calendar.id)}
              onChange={() => onToggleCalendar(calendar.id)}
              className="rounded"
              style={{ accentColor: calendar.color }}
            />
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: calendar.color }}
            />
            <span className="text-sm text-gray-700 flex-1 truncate">{calendar.name}</span>
            <span className="text-xs text-gray-400 capitalize">{calendar.permission}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

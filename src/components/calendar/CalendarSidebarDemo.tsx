import { useState } from 'react';
import { Plus, Settings, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { Calendar as CalendarType } from '../../types/database';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface CalendarSidebarDemoProps {
  calendars: CalendarType[];
  visibleCalendarIds: string[];
  onToggleCalendar: (calendarId: string) => void;
  onCreateCalendar: (name: string, color: string) => void;
  onUpdateCalendar: (id: string, name: string, color: string) => void;
  onDeleteCalendar: (id: string) => void;
}

const CALENDAR_COLORS = [
  { value: '#B45309', name: 'Amber' },
  { value: '#059669', name: 'Emerald' },
  { value: '#7C3AED', name: 'Violet' },
  { value: '#DB2777', name: 'Pink' },
  { value: '#2563EB', name: 'Blue' },
  { value: '#DC2626', name: 'Red' },
  { value: '#0891B2', name: 'Cyan' },
  { value: '#4F46E5', name: 'Indigo' },
];

export function CalendarSidebarDemo({
  calendars,
  visibleCalendarIds,
  onToggleCalendar,
  onCreateCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
}: CalendarSidebarDemoProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(null);
  const [calendarName, setCalendarName] = useState('');
  const [calendarColor, setCalendarColor] = useState(CALENDAR_COLORS[0].value);

  const handleCreateCalendar = () => {
    if (!calendarName.trim()) return;
    onCreateCalendar(calendarName.trim(), calendarColor);
    setShowCreateModal(false);
    setCalendarName('');
    setCalendarColor(CALENDAR_COLORS[0].value);
  };

  const handleEditCalendar = (calendar: CalendarType) => {
    setSelectedCalendar(calendar);
    setCalendarName(calendar.name);
    setCalendarColor(calendar.color);
    setShowEditModal(true);
  };

  const handleUpdateCalendar = () => {
    if (!selectedCalendar || !calendarName.trim()) return;
    onUpdateCalendar(selectedCalendar.id, calendarName.trim(), calendarColor);
    setShowEditModal(false);
    setSelectedCalendar(null);
  };

  const handleDeleteCalendar = () => {
    if (!selectedCalendar) return;
    if (selectedCalendar.is_default) {
      alert('Cannot delete the default calendar');
      return;
    }
    if (confirm(`Are you sure you want to delete "${selectedCalendar.name}"?`)) {
      onDeleteCalendar(selectedCalendar.id);
      setShowEditModal(false);
      setSelectedCalendar(null);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="w-72 flex flex-col h-full"
      style={{
        background: 'linear-gradient(180deg, #1C1917 0%, #292524 100%)',
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' }}
          >
            <Calendar size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
          >
            Calendar
          </h1>
        </div>
        <p className="text-stone-500 text-sm mt-3">{formattedDate}</p>
      </div>

      {/* Calendars List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            My Calendars
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-1">
          {calendars.map((calendar, index) => (
            <div
              key={calendar.id}
              className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-800/50 transition-all cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onToggleCalendar(calendar.id)}
            >
              <div className="relative">
                <div
                  className="w-4 h-4 rounded-full transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: calendar.color,
                    boxShadow: visibleCalendarIds.includes(calendar.id)
                      ? `0 0 12px ${calendar.color}60`
                      : 'none'
                  }}
                />
                {!visibleCalendarIds.includes(calendar.id) && (
                  <div className="absolute inset-0 rounded-full bg-stone-900/60" />
                )}
              </div>
              <span
                className={`text-sm flex-1 transition-colors ${
                  visibleCalendarIds.includes(calendar.id)
                    ? 'text-stone-200'
                    : 'text-stone-500'
                }`}
              >
                {calendar.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCalendar(calendar);
                }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 transition-all"
              >
                <Settings size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="p-6 pt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-700 to-transparent mb-4" />
        <div className="flex items-center gap-2 text-stone-600 text-xs">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono text-xs">C</kbd>
          <span>to create event</span>
        </div>
      </div>

      {/* Create Calendar Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Calendar"
      >
        <div className="space-y-5">
          <Input
            label="Calendar name"
            placeholder="Work, Personal, etc."
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-3">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setCalendarColor(color.value)}
                  className={`h-12 rounded-xl transition-all flex items-center justify-center ${
                    calendarColor === color.value
                      ? 'ring-2 ring-offset-2 ring-stone-900 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {calendarColor === color.value && (
                    <ChevronRight size={16} className="text-white rotate-90" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!calendarName.trim()}>
              Create Calendar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Calendar Modal */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Calendar Settings"
      >
        <div className="space-y-5">
          <Input
            label="Calendar name"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-3">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setCalendarColor(color.value)}
                  className={`h-12 rounded-xl transition-all flex items-center justify-center ${
                    calendarColor === color.value
                      ? 'ring-2 ring-offset-2 ring-stone-900 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {calendarColor === color.value && (
                    <ChevronRight size={16} className="text-white rotate-90" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            {!selectedCalendar?.is_default && (
              <Button variant="danger" onClick={handleDeleteCalendar}>
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCalendar}
                disabled={!calendarName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

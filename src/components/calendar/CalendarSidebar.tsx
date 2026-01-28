import { useState } from 'react';
import { Plus, Settings, Share2, Trash2, LogOut } from 'lucide-react';
import { CalendarWithPermission } from '../../types/database';
import { useCalendars } from '../../hooks/useCalendars';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { ShareCalendarModal } from '../sharing/ShareCalendarModal';

interface CalendarSidebarProps {
  calendars: CalendarWithPermission[];
  visibleCalendarIds: string[];
  onToggleCalendar: (calendarId: string) => void;
}

const CALENDAR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function CalendarSidebar({
  calendars,
  visibleCalendarIds,
  onToggleCalendar,
}: CalendarSidebarProps) {
  const { signOut, user } = useAuth();
  const { createCalendar, updateCalendar, deleteCalendar } = useCalendars();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarWithPermission | null>(null);

  const [calendarName, setCalendarName] = useState('');
  const [calendarColor, setCalendarColor] = useState(CALENDAR_COLORS[0]);

  const ownCalendars = calendars.filter((c) => c.permission === 'owner');
  const sharedCalendars = calendars.filter((c) => c.permission !== 'owner');

  const handleCreateCalendar = async () => {
    if (!calendarName.trim()) return;
    await createCalendar.mutateAsync({
      name: calendarName.trim(),
      color: calendarColor,
    });
    setShowCreateModal(false);
    setCalendarName('');
    setCalendarColor(CALENDAR_COLORS[0]);
  };

  const handleEditCalendar = (calendar: CalendarWithPermission) => {
    setSelectedCalendar(calendar);
    setCalendarName(calendar.name);
    setCalendarColor(calendar.color);
    setShowEditModal(true);
  };

  const handleUpdateCalendar = async () => {
    if (!selectedCalendar || !calendarName.trim()) return;
    await updateCalendar.mutateAsync({
      id: selectedCalendar.id,
      name: calendarName.trim(),
      color: calendarColor,
    });
    setShowEditModal(false);
    setSelectedCalendar(null);
  };

  const handleDeleteCalendar = async () => {
    if (!selectedCalendar) return;
    if (selectedCalendar.is_default) {
      alert('Cannot delete the default calendar');
      return;
    }
    if (confirm(`Are you sure you want to delete "${selectedCalendar.name}"?`)) {
      await deleteCalendar.mutateAsync(selectedCalendar.id);
      setShowEditModal(false);
      setSelectedCalendar(null);
    }
  };

  const handleShareCalendar = (calendar: CalendarWithPermission) => {
    setSelectedCalendar(calendar);
    setShowShareModal(true);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">My Calendars</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-1 mb-6">
          {ownCalendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 group"
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
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={() => handleShareCalendar(calendar)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Share"
                >
                  <Share2 size={14} />
                </button>
                <button
                  onClick={() => handleEditCalendar(calendar)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Settings"
                >
                  <Settings size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {sharedCalendars.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Shared with me</h2>
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
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
          <LogOut size={16} className="mr-2" />
          Sign out
        </Button>
      </div>

      {/* Create Calendar Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Calendar"
      >
        <div className="space-y-4">
          <Input
            label="Calendar name"
            placeholder="My Calendar"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCalendarColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    calendarColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!calendarName.trim()}>
              Create
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
        <div className="space-y-4">
          <Input
            label="Calendar name"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCalendarColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    calendarColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            {!selectedCalendar?.is_default && (
              <Button variant="danger" onClick={handleDeleteCalendar}>
                <Trash2 size={16} className="mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCalendar} disabled={!calendarName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Share Calendar Modal */}
      {selectedCalendar && (
        <ShareCalendarModal
          open={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedCalendar(null);
          }}
          calendar={selectedCalendar}
        />
      )}
    </div>
  );
}

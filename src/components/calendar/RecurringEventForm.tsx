import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { RecurrenceConfig } from '../../lib/rrule-utils';

interface RecurringEventFormProps {
  config: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const END_TYPE_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'count', label: 'After' },
  { value: 'until', label: 'On date' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurringEventForm({ config, onChange }: RecurringEventFormProps) {
  const handleFrequencyChange = (frequency: string) => {
    onChange({
      ...config,
      frequency: frequency as RecurrenceConfig['frequency'],
      weekdays: frequency === 'weekly' ? config.weekdays || [] : undefined,
    });
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value, 10);
    if (interval > 0) {
      onChange({ ...config, interval });
    }
  };

  const handleWeekdayToggle = (day: number) => {
    const weekdays = config.weekdays || [];
    const newWeekdays = weekdays.includes(day)
      ? weekdays.filter((d) => d !== day)
      : [...weekdays, day].sort();
    onChange({ ...config, weekdays: newWeekdays });
  };

  const handleEndTypeChange = (endType: string) => {
    onChange({
      ...config,
      endType: endType as RecurrenceConfig['endType'],
      count: endType === 'count' ? config.count || 10 : undefined,
      until: endType === 'until' ? config.until || new Date() : undefined,
    });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (count > 0) {
      onChange({ ...config, count });
    }
  };

  const handleUntilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, until: new Date(e.target.value) });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Repeat every</span>
        <input
          type="number"
          min="1"
          value={config.interval}
          onChange={handleIntervalChange}
          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
        />
        <div className="w-32">
          <Select
            value={config.frequency}
            onValueChange={handleFrequencyChange}
            options={FREQUENCY_OPTIONS}
          />
        </div>
      </div>

      {config.frequency === 'weekly' && (
        <div>
          <span className="text-sm text-gray-700 block mb-2">Repeat on</span>
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => handleWeekdayToggle(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  config.weekdays?.includes(index)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Ends</span>
        <div className="w-28">
          <Select
            value={config.endType}
            onValueChange={handleEndTypeChange}
            options={END_TYPE_OPTIONS}
          />
        </div>
        {config.endType === 'count' && (
          <>
            <input
              type="number"
              min="1"
              value={config.count || 10}
              onChange={handleCountChange}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-sm text-gray-700">occurrences</span>
          </>
        )}
        {config.endType === 'until' && (
          <Input
            type="date"
            value={config.until ? config.until.toISOString().split('T')[0] : ''}
            onChange={handleUntilChange}
            className="w-40"
          />
        )}
      </div>
    </div>
  );
}

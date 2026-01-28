import { RRule, Frequency, Weekday } from 'rrule';

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  weekdays?: number[]; // 0-6 for Sun-Sat
  endType: 'never' | 'count' | 'until';
  count?: number;
  until?: Date;
}

const FREQUENCY_MAP: Record<RecurrenceConfig['frequency'], Frequency> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
};

export function createRRule(startDate: Date, config: RecurrenceConfig): string {
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: FREQUENCY_MAP[config.frequency],
    interval: config.interval,
    dtstart: startDate,
  };

  if (config.frequency === 'weekly' && config.weekdays && config.weekdays.length > 0) {
    const weekdayMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    options.byweekday = config.weekdays.map((d) => weekdayMap[d]);
  }

  if (config.endType === 'count' && config.count) {
    options.count = config.count;
  } else if (config.endType === 'until' && config.until) {
    options.until = config.until;
  }

  const rule = new RRule(options);
  return rule.toString();
}

export function parseRRule(rruleString: string): RecurrenceConfig | null {
  try {
    const rule = RRule.fromString(rruleString);
    const options = rule.options;

    const frequencyReverseMap: Record<Frequency, RecurrenceConfig['frequency']> = {
      [RRule.DAILY]: 'daily',
      [RRule.WEEKLY]: 'weekly',
      [RRule.MONTHLY]: 'monthly',
      [RRule.YEARLY]: 'yearly',
      [RRule.HOURLY]: 'daily',
      [RRule.MINUTELY]: 'daily',
      [RRule.SECONDLY]: 'daily',
    };

    const config: RecurrenceConfig = {
      frequency: frequencyReverseMap[options.freq] || 'daily',
      interval: options.interval || 1,
      endType: 'never',
    };

    if (options.byweekday && options.byweekday.length > 0) {
      config.weekdays = options.byweekday.map((wd: number | Weekday) => {
        if (typeof wd === 'number') return wd;
        return (wd as Weekday).weekday;
      });
    }

    if (options.count) {
      config.endType = 'count';
      config.count = options.count;
    } else if (options.until) {
      config.endType = 'until';
      config.until = options.until;
    }

    return config;
  } catch {
    return null;
  }
}

export function getOccurrences(
  rruleString: string,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    return rule.between(rangeStart, rangeEnd, true);
  } catch {
    return [];
  }
}

export function getHumanReadableRRule(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString);
    return rule.toText();
  } catch {
    return 'Invalid recurrence rule';
  }
}

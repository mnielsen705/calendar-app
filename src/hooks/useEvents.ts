import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Event, EventInsert, EventUpdate } from '../types/database';
import { useAuth } from './useAuth';
import { getOccurrences } from '../lib/rrule-utils';

export interface EventOccurrence extends Omit<Event, 'start_time' | 'end_time'> {
  start_time: Date;
  end_time: Date;
  originalStart?: Date;
  isOccurrence?: boolean;
}

export function useEvents(calendarIds: string[], dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['events', calendarIds, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async (): Promise<EventOccurrence[]> => {
      if (!user || calendarIds.length === 0) return [];

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('calendar_id', calendarIds)
        .order('start_time');

      if (error) throw error;

      const expandedEvents: EventOccurrence[] = [];

      for (const event of (events || []) as Event[]) {
        if (event.is_recurring && event.rrule && dateRange) {
          // Expand recurring events
          const occurrences = getOccurrences(event.rrule, dateRange.start, dateRange.end);
          const duration =
            new Date(event.end_time).getTime() - new Date(event.start_time).getTime();

          for (const occurrence of occurrences) {
            expandedEvents.push({
              ...event,
              start_time: occurrence,
              end_time: new Date(occurrence.getTime() + duration),
              originalStart: new Date(event.start_time),
              isOccurrence: true,
            });
          }
        } else {
          expandedEvents.push({
            ...event,
            start_time: new Date(event.start_time),
            end_time: new Date(event.end_time),
          });
        }
      }

      return expandedEvents;
    },
    enabled: !!user && calendarIds.length > 0,
  });

  const createEvent = useMutation({
    mutationFn: async (data: EventInsert) => {
      const { data: event, error } = await supabase
        .from('events')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return event as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...data }: EventUpdate & { id: string }) => {
      const { data: event, error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return event as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const createException = useMutation({
    mutationFn: async (data: {
      parentEventId: string;
      originalDate: Date;
      changes: Partial<EventInsert>;
    }) => {
      // Create an exception event for a single occurrence of a recurring event
      const { data: parentEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', data.parentEventId)
        .single();

      if (fetchError) throw fetchError;

      const parent = parentEvent as Event;

      const exceptionEvent: EventInsert = {
        calendar_id: parent.calendar_id,
        title: data.changes.title || parent.title,
        description: data.changes.description ?? parent.description,
        start_time: data.changes.start_time || data.originalDate.toISOString(),
        end_time: data.changes.end_time || new Date(
          data.originalDate.getTime() +
            (new Date(parent.end_time).getTime() - new Date(parent.start_time).getTime())
        ).toISOString(),
        all_day: data.changes.all_day ?? parent.all_day,
        location: data.changes.location ?? parent.location,
        is_recurring: false,
        recurring_event_id: data.parentEventId,
        is_exception: true,
      };

      const { data: event, error } = await supabase
        .from('events')
        .insert(exceptionEvent)
        .select()
        .single();

      if (error) throw error;
      return event as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent,
    updateEvent,
    deleteEvent,
    createException,
  };
}

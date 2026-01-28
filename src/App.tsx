import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarViewDemo } from './components/calendar/CalendarViewDemo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarViewDemo />
    </QueryClientProvider>
  );
}

export default App;

import type { ReactNode } from 'react';
import { queryClient } from '@/shared/api/query-client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/shared/lib/queryPersister';



interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: queryPersister,
    maxAge: 1000 * 60 * 60 * 24,  // 24 hours
    buster: import.meta.env.VITE_APP_VERSION ?? 'v1', // cache buster on new deploy
  }}
>
  {children}
</PersistQueryClientProvider>
  );
}

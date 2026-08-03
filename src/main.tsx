import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import { persistor, store } from './redux/store.ts'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5000 * 100,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </PersistGate>
    </Provider>{' '}
  </StrictMode>,
)

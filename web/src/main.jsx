import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './api/client';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import { ScrollToTop } from './components/ScrollToTop';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/status.css';
import './styles/components.css';
import './styles/auth.css';
import './styles/pages.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 4xx (404, 400, 401) nggak ada gunanya diulang; error jaringan/5xx dicoba sekali lagi
      retry: (count, err) => count < 1 && (!(err instanceof ApiError) || err.isNetwork || err.status >= 500),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

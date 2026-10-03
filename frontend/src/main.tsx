import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import ScrollToTop from "./component/ScrolltoTop.tsx";
import { Provider } from "./components/ui/provider.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: 0,
      refetchInterval: 60000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Provider>
        <BrowserRouter>
          <ScrollToTop />
          <App />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);

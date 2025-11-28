import "@/index.css";
import "katex/dist/katex.min.css";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppProps } from "next/app";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import superjson from "superjson";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Router } from "wouter";
import Head from "next/head";
import { APP_LOGO, APP_TITLE } from "@/const";

const createStaticLocationHook = (path: string) => () => {
  const [location] = useState(path);
  useEffect(() => {}, []);
  const navigate = useCallback(() => {}, []);
  return [location, navigate] as [string, (to: string, options?: { replace?: boolean }) => void];
};

const useNextLocation = () => {
  const nextRouter = useRouter();
  const [path, setPath] = useState(() => nextRouter.asPath || "/");

  useEffect(() => {
    setPath(nextRouter.asPath || "/");
  }, [nextRouter.asPath]);

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const method = options?.replace ? nextRouter.replace : nextRouter.push;
      void method(to);
    },
    [nextRouter]
  );

  return [path, navigate] as [string, (to: string, options?: { replace?: boolean }) => void];
};

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const nextRouter = useRouter();
  const ssrLocationHook = useMemo(
    () => (typeof window === "undefined" ? createStaticLocationHook(nextRouter.asPath || "/") : undefined),
    [nextRouter.asPath]
  );
  const locationHook = ssrLocationHook ?? useNextLocation;

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
          },
        }),
      ],
    })
  );

  return (
    <>
      <Head>
        <title>{APP_TITLE}</title>
        <meta name="description" content="StepNavi - 就活の企業管理・タスク管理・研究メモをまとめて扱えるダッシュボード" />
        <link rel="icon" href={APP_LOGO} />
        <link rel="apple-touch-icon" href={APP_LOGO} />
      </Head>
      <Router hook={locationHook}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <ThemeProvider defaultTheme="dark">
                <TooltipProvider>
                  <Toaster />
                  <Component {...pageProps} />
                </TooltipProvider>
              </ThemeProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </trpc.Provider>
      </Router>
    </>
  );
}

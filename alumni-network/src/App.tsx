import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { setGetTokenFn } from "@workspace/api-client-react";

import LandingPage from "@/pages/landing-page";
import FeedPage from "@/pages/feed-page";
import ProfilePage from "@/pages/profile-page";
import SearchPage from "@/pages/search-page";
import MessagesPage from "@/pages/messages-page";
import CareersPage from "@/pages/careers-page";
import JobDetailPage from "@/pages/job-detail-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(0 0% 9%)",
    colorForeground: "hsl(0 0% 9%)",
    colorMutedForeground: "hsl(0 0% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(0 0% 9%)",
    colorNeutral: "hsl(0 0% 90%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-md w-[440px] max-w-full overflow-hidden border border-border shadow-sm",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    footerActionLink: "text-primary font-medium hover:underline underline-offset-4",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs text-muted-foreground uppercase",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-sm font-medium text-green-600",
    alertText: "text-sm font-medium text-destructive",
    logoBox: "h-12 flex justify-center",
    logoImage: "h-8 object-contain",
    socialButtonsBlockButton: "h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    formButtonPrimary: "h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "flex items-center justify-center gap-1",
    dividerLine: "bg-border h-px",
    alert: "bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3",
    otpCodeFieldInput: "border border-input rounded-md",
    formFieldRow: "space-y-1",
    main: "gap-4 flex flex-col",
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/feed" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function ClerkTokenInjector() {
  const { getToken } = useAuth();
  useEffect(() => {
    setGetTokenFn(() => getToken());
  }, [getToken]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkTokenInjector />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/feed" component={FeedPage} />
            <Route path="/profile/me" component={() => <ProfilePage isMe={true} />} />
            <Route path="/profile/:userId">
              {(params) => <ProfilePage userId={params?.userId ?? ""} />}
            </Route>
            <Route path="/search" component={SearchPage} />
            <Route path="/messages" component={MessagesPage} />
            <Route path="/careers" component={CareersPage} />
            <Route path="/careers/jobs/:jobId">
              {(params) => <JobDetailPage jobId={params?.jobId ?? ""} />}
            </Route>
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
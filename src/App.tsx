import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/dashboard";
import Companies from "./pages/companies";
import CompanyDetail from "./pages/CompanyDetail";
import Tasks from "./pages/tasks";
import { SignInPage, SignUpPage } from "./pages/Auth";
import CompanyResearch from "./pages/CompanyResearch";
import CompanyResearchDetail from "./pages/CompanyResearchDetail";
import CompanyResearchWizard from "./pages/CompanyResearchWizard";
import Events from "./pages/events";
import StatusPage from "./pages/status";

function Router() {
  return (
    <Switch>
      {/* 公開ページ */}
      <Route path="/" component={Landing} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignUpPage} />
      
      {/* ダッシュボード（認証必要） */}
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/companies">
        <DashboardLayout>
          <Companies />
        </DashboardLayout>
      </Route>
      <Route path="/companies/:id">
        <DashboardLayout>
          <CompanyDetail />
        </DashboardLayout>
      </Route>
      <Route path="/research/new">
        <DashboardLayout>
          <CompanyResearchWizard />
        </DashboardLayout>
      </Route>
      <Route path="/research/:id/edit">
        <DashboardLayout>
          <CompanyResearchWizard />
        </DashboardLayout>
      </Route>
      <Route path="/research/:id">
        <DashboardLayout>
          <CompanyResearchDetail />
        </DashboardLayout>
      </Route>
      <Route path="/research">
        <DashboardLayout>
          <CompanyResearch />
        </DashboardLayout>
      </Route>
      <Route path="/tasks">
        <DashboardLayout>
          <Tasks />
        </DashboardLayout>
      </Route>
      <Route path="/events">
        <DashboardLayout>
          <Events />
        </DashboardLayout>
      </Route>
      <Route path="/status">
        <DashboardLayout>
          <StatusPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

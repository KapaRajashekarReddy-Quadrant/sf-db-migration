//17/02
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import companyLogo from '../public/Quadrant_logo.png'
import { MigrationHubPage } from "./pages/MigrationHubPage";
import SnowflakeIndex from "./pages/SnowflakeToDatabricks/SnowflakeIndex";
const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  console.log('[AppRoutes] Rendering with auth state:', { isAuthenticated, isLoading, user });

  // Wait for auth to finish loading before checking auth
  if (isLoading) {
    console.log('[AppRoutes] Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleLogout = () => {
    console.log('[AppRoutes] Logout triggered');
    logout();
  };

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <>
          <AppHeader
            userName={user?.name || "User"}
            onLogout={handleLogout}
            onProfileClick={() => {
              console.log('[AppRoutes] Profile clicked');
              setShowProfile(true);
            }}
          />
          {showProfile && (
            <UserProfileModal
              open={showProfile}
              onOpenChange={setShowProfile}
              user={user}
            />
          )}
        </>
      )}
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <>
                {console.log('[AppRoutes] Redirecting from /login to /fabricjobshome (already authenticated)')}
                <Navigate to="/hub" replace />
              </>
            ) : (
              <>
                {console.log('[AppRoutes] Showing LoginPage')}
                <LoginPage />
              </>
            )
          }
        />

        <Route
          path="/hub"
          element={
            isAuthenticated ? (
              <MigrationHubPage userName={user?.name || "User"} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/fabricjobshome"
          element={
            isAuthenticated ? <Index /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/synapse-workspace"
          element={
            isAuthenticated ? <Index /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/databricks-workspace"
          element={
            isAuthenticated ? <Index /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/synapse-report"
          element={
            isAuthenticated ? <Index /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/databricks-report"
          element={
            isAuthenticated ? <Index /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/databricks-hub"
          element={
            isAuthenticated ? <SnowflakeIndex /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/snowflake-workspace"
          element={
            isAuthenticated ? <SnowflakeIndex /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/snowflake-report"
          element={
            isAuthenticated ? <SnowflakeIndex /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <>
                {console.log('[AppRoutes] Redirecting to /fabricjobshome from root')}
                <Navigate to="/hub" replace />
              </>
            ) : (
              <>
                {console.log('[AppRoutes] Redirecting to /login (not authenticated)')}
                <Navigate to="/login" replace />
              </>
            )
          }
        />

        {/* Keep your Index route if needed */}
        <Route
          path="/index"
          element={
            isAuthenticated ? (
              <>
                {console.log('[AppRoutes] Showing Index page (authenticated)')}
                <Index />
              </>
            ) : (
              <>
                {console.log('[AppRoutes] Redirecting to /login (not authenticated)')}
                <Navigate to="/login" replace />
              </>
            )
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <div className="fixed bottom-4 right-4 z-50">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="h-5 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
        />
      </div>
    </BrowserRouter>
  );
}

const App = () => {
  console.log('[App] Initializing application');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

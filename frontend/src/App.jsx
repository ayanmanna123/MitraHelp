import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateEmergency from "./pages/CreateEmergency";
import EmergencyTracking from "./pages/EmergencyTracking";
import VolunteerProfile from "./pages/VolunteerProfile";
import VolunteerSignup from "./pages/VolunteerSignup";
import AdminPanel from "./pages/AdminPanel";
import { SocketProvider } from "./context/SocketContext"; // Import SocketProvider

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Toaster position="top-center" />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency/create"
                element={
                  <ProtectedRoute>
                    <CreateEmergency />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency/:id"
                element={
                  <ProtectedRoute>
                    <EmergencyTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer-profile"
                element={
                  <ProtectedRoute>
                    <VolunteerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer-signup"
                element={
                  <ProtectedRoute>
                    <VolunteerSignup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

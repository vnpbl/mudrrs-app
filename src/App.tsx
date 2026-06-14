import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Homepage from "./pages/Homepage";
import BookingPage from "./pages/BookingPage";
import ReservationsPage from "./pages/ReservationsPage";
import { StaffDashboard } from "./pages/StaffDashboard";

function App() {
  const userRole = 'staff';
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Homepage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/dashboard-staff" element={<StaffDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
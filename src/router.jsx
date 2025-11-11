import { Route, Routes, Navigate } from "react-router-dom"
import Addworker from "../pages/Addworker"
import Viewattendance from "../pages/ViewAttendace"
import Markattendance from "../pages/MarkAttendance"

function AppRouter() {
  return (
    <Routes>
      <Route path="/add-worker" element={<Addworker />} />
      <Route path="/view-attendance" element={<Viewattendance />} />
      <Route path="/mark-attendance" element={<Markattendance />} /> {/* New Route */}
      <Route path="/" element={<Navigate to="/add-worker" replace />} />
    </Routes>
  )
}

export default AppRouter

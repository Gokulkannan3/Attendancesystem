import { Route, Routes, Navigate } from "react-router-dom"
import AddWorker from "./pages/addWorker.jsx"
import ViewAttendance from "./pages/ViewAttendace.jsx"
import MarkAttendance from "./pages/MarkAttendance.jsx"

function AppRouter() {
  return (
    <Routes>
      <Route path="/add-worker" element={<AddWorker />} />
      <Route path="/view-attendance" element={<ViewAttendance />} />
      <Route path="/mark-attendance" element={<MarkAttendance />} /> {/* New Route */}
      <Route path="/" element={<Navigate to="/add-worker" replace />} />
    </Routes>
  )
}

export default AppRouter

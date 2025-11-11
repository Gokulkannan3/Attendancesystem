import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? "font-semibold text-primary" : ""

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo / Title */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Attendance System
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/add-worker" className={`nav-link ${isActive("/add-worker")}`}>
              Add Worker
            </Link>
            <Link to="/view-attendance" className={`nav-link ${isActive("/view-attendance")}`}>
              View Attendance
            </Link>
            <Link to="/mark-attendance" className={`nav-link ${isActive("/mark-attendance")}`}>
              Mark Attendance
            </Link>
          </div>

          {/* Hamburger Button (mobile) */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/add-worker"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-base ${isActive("/add-worker")}`}
            >
              Add Worker
            </Link>
            <Link
              to="/view-attendance"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-base ${isActive("/view-attendance")}`}
            >
              View Attendance
            </Link>
            <Link
              to="/mark-attendance"
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-base ${isActive("/mark-attendance")}`}
            >
              Mark Attendance
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
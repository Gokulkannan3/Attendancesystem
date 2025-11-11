import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config"

function Viewattendance() {
  const [workers, setWorkers] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchWorkers()
  }, [selectedMonth, selectedYear])

  const fetchWorkers = async () => {
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/workers`)
      const text = await response.text()
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
      if (!text.trim().startsWith("[") && !text.trim().startsWith("{")) {
        throw new Error("Invalid response from server (expected JSON)")
      }
      const data = JSON.parse(text)
      setWorkers(data)
    } catch (error) {
      console.error("Error fetching workers:", error)
      setMessage(
        error.message.includes("JSON")
          ? "Server returned HTML instead of data. Check if backend is running."
          : `Error: ${error.message}`
      )
      setMessageType("error")
      setWorkers([])
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalDays = (worker) => {
    return worker.attendance?.filter((dateString) => {
      const d = new Date(dateString)
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
    }).length || 0
  }

  const calculateTotalSalary = (worker) => {
    const days = calculateTotalDays(worker)
    return days * (worker.per_day_salary || 0)
  }

  const handleDownloadExcel = async () => {
    setMessage("Generating Excel report...")
    setMessageType("")
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/download-excel?month=${selectedMonth}&year=${selectedYear}`
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_report_${selectedMonth}-${selectedYear}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      setMessage("Excel report downloaded!")
      setMessageType("success")
    } catch (error) {
      console.error("Download failed:", error)
      setMessage(`Error: ${error.message}`)
      setMessageType("error")
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="mobile:w-full mobile:max-w-none card-container">
      <div className="card-header">
        <h2 className="card-title">Worker Attendance</h2>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-input text-sm"
              disabled={loading}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-input text-sm"
              disabled={loading}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDownloadExcel}
            disabled={loading}
            className="btn btn-green text-sm whitespace-nowrap"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>
      </div>

      <div className="card-content">
        {message && (
          <div className={`message ${messageType} mb-4`}>{message}</div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading workers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Village</th>
                  <th className="px-4 py-3 text-left">Salary/Day</th>
                  <th className="px-4 py-3 text-center">
                    Days ({selectedMonth}/{selectedYear})
                  </th>
                  <th className="px-4 py-3 text-right">Total Salary</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No workers found. Add workers to see attendance.
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{worker.id}</td>
                      <td className="px-4 py-3 font-medium">{worker.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{worker.phone}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{worker.village}</td>
                      <td className="px-4 py-3">₹{worker.per_day_salary}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {calculateTotalDays(worker)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        ₹{calculateTotalSalary(worker)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Viewattendance
import { useState, useEffect } from "react"
import { API_BASE_URL } from "../src/config"

function Viewattendance() {
  const [workers, setWorkers] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    village: "",
    per_day_salary: 0,
    images: [],
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchWorkers()
    setCurrentPage(1)
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
    return (
      worker.attendance?.filter((dateString) => {
        const d = new Date(dateString)
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
      }).length || 0
    )
  }

  const calculateTotalSalary = (worker, salaryOverride) => {
    const days = calculateTotalDays(worker)
    const salary = salaryOverride ?? worker.per_day_salary ?? 0
    return days * salary
  }

  const startEdit = (worker) => {
    setEditingId(worker.id)
    setEditForm({
      name: worker.name,
      phone: worker.phone,
      village: worker.village,
      per_day_salary: worker.per_day_salary,
      images: worker.images || [],
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: "", phone: "", village: "", per_day_salary: 0, images: [] })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/workers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const updated = await res.json()
      setWorkers((prev) =>
        prev.map((w) => (w.id === editingId ? updated : w))
      )
      setMessage("Worker updated successfully!")
      setMessageType("success")
      cancelEdit()
    } catch (e) {
      setMessage(`Update failed: ${e.message}`)
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const deleteWorker = async (id) => {
    if (!window.confirm("Delete this worker? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/workers/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setWorkers((prev) => prev.filter((w) => w.id !== id))
      setMessage("Worker deleted.")
      setMessageType("success")
    } catch (e) {
      setMessage(`Delete failed: ${e.message}`)
      setMessageType("error")
    } finally {
      setLoading(false)
    }
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

  const totalPages = Math.ceil(workers.length / itemsPerPage)
  const paginatedWorkers = workers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="">
      <div className="py-6 flex justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-800">Worker Attendance</h2>
      </div>

      <div className="py-3 bg-gray-50 border-b flex justify-center">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-4 hundred:w-5xl mobile:w-full">
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-md border border-gray-300 py-1 text-sm"
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
              className="rounded-md border border-gray-300 py-1 text-sm"
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
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Download Excel"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`px-4 py-2 mt-2 text-center rounded-md ${
            messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">Loading workers...</div>
      ) : (
        <div className="mt-5">
          <div className="overflow-x-auto">
            <table className="w-full text-md border-collapse border border-gray-300">
              <thead className="bg-gray-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-center border border-gray-300">ID</th>
                  <th className="px-4 py-3 text-center border border-gray-300">Name</th>
                  <th className="px-4 py-3 text-center border border-gray-300 hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-center border border-gray-300 hidden sm:table-cell">Village</th>
                  <th className="px-4 py-3 text-center border border-gray-300">Salary/Day</th>
                  <th className="px-4 py-3 text-center border border-gray-300">
                    Days ({selectedMonth}/{selectedYear})
                  </th>
                  <th className="px-4 py-3 text-center border border-gray-300">Total Salary</th>
                  <th className="px-4 py-3 text-center border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No workers found for this month.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      {editingId !== worker.id ? (
                        <>
                          <td className="px-4 py-3 text-center border border-gray-300">{worker.id}</td>
                          <td className="px-4 py-3 font-medium text-center border border-gray-300">{worker.name}</td>
                          <td className="px-4 py-3 text-center border border-gray-300 hidden sm:table-cell">{worker.phone}</td>
                          <td className="px-4 py-3 text-center border border-gray-300 hidden sm:table-cell">{worker.village}</td>
                          <td className="px-4 py-3 text-center border border-gray-300">₹{worker.per_day_salary}</td>
                          <td className="px-4 py-3 text-center border border-gray-300 font-semibold">
                            {calculateTotalDays(worker)}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300 font-bold text-green-600">
                            ₹{calculateTotalSalary(worker)}
                          </td>
                          <td className="px-4 py-3 text-center flex flex-row border border-gray-300 space-x-1">
                            <button
                              onClick={() => startEdit(worker)}
                              className="rounded px-2 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteWorker(worker.id)}
                              className="rounded px-2 py-1 bg-red-600 text-white text-xs hover:bg-red-700"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 border border-gray-300">{worker.id}</td>
                          <td className="px-4 py-3 border border-gray-300">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border border-gray-300 hidden sm:table-cell">
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm({ ...editForm, phone: e.target.value })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border border-gray-300 hidden sm:table-cell">
                            <input
                              type="text"
                              value={editForm.village}
                              onChange={(e) =>
                                setEditForm({ ...editForm, village: e.target.value })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border border-gray-300">
                            <input
                              type="number"
                              min="0"
                              value={editForm.per_day_salary}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  per_day_salary: Number(e.target.value),
                                })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 text-center font-semibold border border-gray-300">
                            {calculateTotalDays(worker)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-600 border border-gray-300">
                            ₹{calculateTotalSalary(worker, editForm.per_day_salary)}
                          </td>
                          <td className="px-4 py-3 text-center space-x-1 border border-gray-300">
                            <button
                              onClick={saveEdit}
                              className="rounded px-2 py-1 bg-green-600 text-white text-xs hover:bg-green-700"
                              disabled={loading}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded px-2 py-1 bg-gray-400 text-white text-xs hover:bg-gray-500"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center space-y-3">
              <div className="flex w-full justify-between sm:hidden">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded px-3 py-1 bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded px-3 py-1 bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <nav className="hidden sm:flex items-center space-x-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-l-md border border-gray-300 px-3 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`border px-3 py-1 ${
                      page === currentPage
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-r-md border border-gray-300 px-3 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>

              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, workers.length)}
                </span>{" "}
                of <span className="font-medium">{workers.length}</span> results
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Viewattendance
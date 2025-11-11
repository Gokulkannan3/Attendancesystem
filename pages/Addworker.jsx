import { useRef, useState, useEffect } from "react"
import { API_BASE_URL } from "../src/config"
import '../App.css'

function Addworker() {
  const videoRef = useRef(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [village, setVillage] = useState("")
  const [salary, setSalary] = useState("")
  const [images, setImages] = useState([])
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      setIsCameraActive(true)
      setMessage("")
    } catch (err) {
      console.error(err)
      setMessage("Failed to start camera. Please grant permission.")
      setMessageType("error")
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      setMessage("Camera not active. Start it first.")
      setMessageType("error")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL("image/png")
    setImages([{ angle: "front", data: imageData }])
    setMessage("Front image captured!")
    setMessageType("success")
  }

  const submitWorker = async () => {
    if (!name || !phone || !village || !salary || images.length === 0) {
      setMessage("Please fill all fields and capture at least one image.")
      setMessageType("error")
      return
    }
    setMessage("Submitting worker...")
    setMessageType("")
    try {
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          const res = await fetch(`${API_BASE_URL}/upload-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: img.data }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Image upload failed")
          return data.url
        })
      )
      const res = await fetch(`${API_BASE_URL}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          village,
          salary: Number.parseInt(salary, 10),
          images: imageUrls,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setName("")
        setPhone("")
        setVillage("")
        setSalary("")
        setImages([])
        setMessage("Worker added successfully!")
        setMessageType("success")
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject
          const tracks = stream.getTracks()
          tracks.forEach((track) => track.stop())
          videoRef.current.srcObject = null
          setIsCameraActive(false)
        }
      } else {
        throw new Error(data.error || "Worker submission failed")
      }
    } catch (error) {
      console.error(error)
      setMessage(`Error: ${error.message}`)
      setMessageType("error")
    }
  }

  return (
    <div className="mobile:w-full mobile:max-w-none card-container">
      <div className="card-header">
        <h2 className="card-title">Add New Worker</h2>
      </div>
      <div className="card-content">
        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div className="grid mobile:grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-section mobile:grid-cols-1 md:grid-cols-2 gap-4 grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Worker's Name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                id="phone"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="village" className="form-label">Village</label>
              <input
                id="village"
                className="form-input"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village Name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="salary" className="form-label">Per Day Salary</label>
              <input
                id="salary"
                type="number"
                className="form-input"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Daily Salary"
                required
              />
            </div>
          </div>

          <div className="camera-section">
            <div className="camera-preview-box">
              <video ref={videoRef} autoPlay playsInline className="camera-video w-full" />
              {!isCameraActive && <div className="camera-placeholder">Camera Preview</div>}
            </div>
            <div className="camera-controls flex gap-2 mt-2">
              <button onClick={startCamera} className="btn btn-primary flex-1">Start Camera</button>
              <button onClick={captureImage} disabled={!isCameraActive} className="btn btn-outline flex-1">Capture Front</button>
            </div>
            <div className="image-previews mt-3 flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="image-preview-item">
                  <img src={img.data || "/placeholder.svg"} alt={`${img.angle} view`} className="preview-image" />
                  <span className="image-angle-label">{img.angle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={submitWorker} className="btn btn-submit mt-6 w-full md:w-auto">Submit Worker</button>
      </div>
    </div>
  )
}

export default Addworker
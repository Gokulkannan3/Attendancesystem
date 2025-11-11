// Addworker.jsx
import { useRef, useState } from "react";
import { API_BASE_URL } from "../src/config";
import { usecamera } from "./Usecamera";

function Addworker() {
  const videoRef = useRef(null);
  const { isCameraActive, devices, startCamera, switchCamera } = usecamera(videoRef);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [salary, setSalary] = useState("");
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      setMessage("Camera not active. Start it first.");
      setMessageType("error");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setImages([{ angle: "front", data: imageData }]);
    setMessage("Front image captured!");
    setMessageType("success");
  };

  const submitWorker = async () => {
    if (!name || !phone || !village || !salary || images.length === 0) {
      setMessage("Please fill all fields and capture at least one image.");
      setMessageType("error");
      return;
    }
    setMessage("Submitting worker...");
    setMessageType("");
    try {
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          const res = await fetch(`${API_BASE_URL}/api/upload-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: img.data }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Image upload failed");
          return data.url;
        })
      );
      const res = await fetch(`${API_BASE_URL}/api/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          village,
          salary: Number.parseInt(salary, 10),
          images: imageUrls,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setName("");
        setPhone("");
        setVillage("");
        setSalary("");
        setImages([]);
        setMessage("Worker added successfully!");
        setMessageType("success");
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      } else {
        throw new Error(data.error || "Worker submission failed");
      }
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    }
  };

  const hasMultipleCameras = devices.length > 1 || /Mobi|Android|iPhone/i.test(navigator.userAgent);

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
            <div className="camera-preview-box relative">
              <video ref={videoRef} autoPlay playsInline className="camera-video w-full" />
              {!isCameraActive && <div className="camera-placeholder">Camera Preview</div>}
              {isCameraActive && hasMultipleCameras && (
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-2"
                  title="Switch camera"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-5-4v4m0 10v4"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="camera-controls flex gap-2 mt-2">
              <button onClick={() => startCamera(0)} className="btn btn-primary flex-1">Start Camera</button>
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
  );
}

export default Addworker;
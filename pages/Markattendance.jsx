// Markattendance.jsx
import { useRef, useState } from "react";
import { API_BASE_URL } from "../src/config";
import { usecamera } from "./Usecamera";

function Markattendance() {
  const videoRef = useRef(null);
  const { isCameraActive, devices, currentDeviceIdx, startCamera, switchCamera } = usecamera(videoRef);
  const [capturedImage, setCapturedImage] = useState(null);
  const [identifiedWorker, setIdentifiedWorker] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const captureAndIdentifyImage = async () => {
    if (!videoRef.current?.srcObject) {
      setMessage("Camera not active. Start it first.");
      setMessageType("error");
      return;
    }

    setMessage("Capturing and identifying...");
    setMessageType("");
    setIdentifiedWorker(null);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);

    try {
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
      const imageUrl = uploadData.url;

      const identifyRes = await fetch(`${API_BASE_URL}/api/identify-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const identifyData = await identifyRes.json();

      if (identifyRes.ok && identifyData.success) {
        setIdentifiedWorker(identifyData.worker);
        setMessage(`Identified: ${identifyData.worker.name}. Tap 'Mark Attendance' to confirm.`);
        setMessageType("success");
      } else {
        setIdentifiedWorker(null);
        setMessage(identifyData.message || "Worker not recognized. Try again.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    }
  };

  const handleMarkAttendance = async () => {
    if (!identifiedWorker || !capturedImage) {
      setMessage("Capture and identify a worker first.");
      setMessageType("error");
      return;
    }

    setMessage(`Marking attendance for ${identifiedWorker.name}...`);
    setMessageType("");

    try {
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Re-upload failed");
      const imageUrl = uploadData.url;

      const attRes = await fetch(`${API_BASE_URL}/api/attendance/${identifiedWorker.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const attData = await attRes.json();

      if (attRes.ok) {
        setMessage(`Attendance marked for ${identifiedWorker.name}!`);
        setMessageType("success");
        setCapturedImage(null);
        setIdentifiedWorker(null);
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
      } else {
        throw new Error(attData.error || "Failed to mark attendance");
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
        <h2 className="card-title text-lg sm:text-xl">Mark Attendance</h2>
      </div>

      <div className="card-content space-y-4">
        {message && (
          <div className={`message ${messageType} text-sm p-3 rounded-md`}>
            {message}
          </div>
        )}

        <div className="camera-section space-y-3">
          <div className="camera-preview-box relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video w-full h-auto max-h-64 object-cover"
            />
            {!isCameraActive && (
              <div className="camera-placeholder absolute inset-0 flex items-center justify-center text-gray-400">
                Camera Off
              </div>
            )}
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

          <div className="camera-controls flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => startCamera(0)}
              className="btn btn-primary flex-1 text-sm py-2"
            >
              Start Camera
            </button>
            <button
              onClick={captureAndIdentifyImage}
              disabled={!isCameraActive}
              className="btn btn-outline flex-1 text-sm py-2 disabled:opacity-50"
            >
              Capture & Identify
            </button>
          </div>

          {capturedImage && (
            <div className="image-previews mt-3">
              <div className="image-preview-item inline-block">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="preview-image w-32 h-32 object-cover rounded-md shadow"
                />
                <span className="image-angle-label block text-xs text-center mt-1">Captured</span>
              </div>
            </div>
          )}

          {identifiedWorker && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center text-sm">
              <strong className="text-blue-700">{identifiedWorker.name}</strong>
              <br />
              <span className="text-xs text-gray-600">ID: {identifiedWorker.id}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleMarkAttendance}
          disabled={!identifiedWorker || !capturedImage}
          className="btn btn-submit w-full mt-5 text-sm py-3 disabled:opacity-50"
        >
          Mark Attendance
        </button>
      </div>
    </div>
  );
}

export default Markattendance;
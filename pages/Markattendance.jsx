// pages/Markattendance.jsx
import { useRef, useState, useEffect } from "react";
import { API_BASE_URL } from "../src/config";
import { usecamera } from "./Usecamera";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";   // Served from public/models/

function Markattendance() {
  const videoRef = useRef(null);
  // FIXED: destructure 'devices'
  const { isCameraActive, devices, startCamera, switchCamera } = usecamera(videoRef);

  const [capturedImage, setCapturedImage] = useState(null);
  const [identifiedWorker, setIdentifiedWorker] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [workers, setWorkers] = useState([]);

  /* --------------------------------------------------------------
     Load models + fetch workers
  -------------------------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("All face-api.js models loaded");
        setMessage("Face recognition ready.");
      } catch (e) {
        console.error(e);
        setMessage("Failed to load AI models. Check public/models/.");
        setMessageType("error");
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/workers`);
        const data = await res.json();
        setWorkers(data);
      } catch (e) {
        setMessage("Failed to load workers.");
        setMessageType("error");
      }
    };
    init();
  }, []);

  /* --------------------------------------------------------------
     Get face descriptor
  -------------------------------------------------------------- */
  const getDescriptor = async (src) => {
    const img = await faceapi.fetchImage(src);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) throw new Error("No face");
    return detection.descriptor;
  };

  /* --------------------------------------------------------------
     Capture → Identify
  -------------------------------------------------------------- */
  const captureAndIdentifyImage = async () => {
    if (!videoRef.current?.srcObject) {
      setMessage("Start camera first.");
      setMessageType("error");
      return;
    }

    setMessage("Capturing...");
    setIdentifiedWorker(null);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const imgData = canvas.toDataURL("image/png");
    setCapturedImage(imgData);

    try {
      const capturedDesc = await getDescriptor(imgData);
      let best = { distance: Infinity };

      for (const w of workers) {
        for (const url of w.images || []) {
          try {
            const storedDesc = await getDescriptor(url);
            const d = faceapi.euclideanDistance(capturedDesc, storedDesc);
            if (d < best.distance) best = { worker: w, distance: d };
          } catch (_) {}
        }
      }

      if (best.distance < 0.6) {
        setIdentifiedWorker(best.worker);
        setMessage(`Match: ${best.worker.name} (${((1 - best.distance) * 100).toFixed(1)}%)`);
        setMessageType("success");
      } else {
        setMessage("No match. Try again.");
        setMessageType("error");
      }
    } catch (e) {
      setMessage(`Error: ${e.message}`);
      setMessageType("error");
    }
  };

  /* --------------------------------------------------------------
     Mark attendance
  -------------------------------------------------------------- */
  const handleMarkAttendance = async () => {
    if (!identifiedWorker || !capturedImage) return;

    setMessage(`Uploading for ${identifiedWorker.name}...`);
    try {
      const up = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });
      const { url } = await up.json();
      if (!up.ok) throw new Error("Upload failed");

      const att = await fetch(`${API_BASE_URL}/api/attendance/${identifiedWorker.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!att.ok) throw new Error("Attendance failed");

      setMessage(`Attendance marked!`);
      setMessageType("success");
      setCapturedImage(null);
      setIdentifiedWorker(null);
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setMessage(`Error: ${e.message}`);
      setMessageType("error");
    }
  };

  /* --------------------------------------------------------------
     UI
  -------------------------------------------------------------- */
  const hasMultipleCameras =
    (Array.isArray(devices) && devices.length > 1) ||
    /Mobi|Android|iPhone/i.test(navigator.userAgent);

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
                <span className="image-angle-label block text-xs text-center mt-1">
                  Captured
                </span>
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
// src/hooks/useCamera.js
import { useRef, useState, useEffect, useCallback } from "react";

export const usecamera = (videoRef) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [currentDeviceIdx, setCurrentDeviceIdx] = useState(0);
  const currentStreamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((t) => t.stop());
      currentStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, [videoRef]);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .enumerateDevices()
      .then((all) => {
        if (!mounted) return;
        const video = all.filter((d) => d.kind === "videoinput" && d.deviceId);
        setDevices(video);
      })
      .catch(() => setDevices([]));
    return () => (mounted = false);
  }, []);

  const startCamera = useCallback(
    async (deviceIdx = 0) => {
      stopStream();

      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const constraints = isMobile
        ? { video: { facingMode: { ideal: deviceIdx === 0 ? "environment" : "user" } } }
        : devices[deviceIdx]
        ? { video: { deviceId: { exact: devices[deviceIdx].deviceId } } }
        : { video: true };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCurrentDeviceIdx(deviceIdx);
        setIsCameraActive(true);
      } catch (err) {
        console.error(err);
        setIsCameraActive(false);
      }
    },
    [devices, stopStream, videoRef]
  );

  // ---------- ONLY THIS PART IS CHANGED ----------
  const switchCamera = useCallback(() => {
    // Always toggle between front (user) and rear (environment)
    const nextIdx = currentDeviceIdx === 0 ? 1 : 0;
    startCamera(nextIdx);
  }, [currentDeviceIdx, startCamera]);
  // -------------------------------------------

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return { isCameraActive, devices, currentDeviceIdx, startCamera, switchCamera, stopStream };
};
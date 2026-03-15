import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export const useFaceApi = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = import.meta.env.DEV
        ? '/models'
        : 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Model loading error:", err);
      }
    };
    loadModels();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Wait for video to actually start playing
        videoRef.current.onloadeddata = () => setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const captureDescriptor = async () => {
    if (!videoRef.current) return null;
    const detection = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection ? Array.from(detection.descriptor) : null;
  };

  return { modelsLoaded, cameraReady, videoRef, startVideo, captureDescriptor };
};

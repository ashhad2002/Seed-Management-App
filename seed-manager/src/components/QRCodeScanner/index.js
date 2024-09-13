import React, { useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRCodeScanner = ({ onScan, showScanner }) => {
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    if (showScanner) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [showScanner]);

  const startScanning = async () => {
    try {
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          onScan(result.getText());
          stopScanning();
        }
      });
    } catch (err) {
      console.error('Error accessing the camera:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (codeReader.current) {
      codeReader.current.reset();
    }
  };

  return (
    <div className="w-full h-96 relative">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay />
    </div>
  );
};

export default QRCodeScanner;
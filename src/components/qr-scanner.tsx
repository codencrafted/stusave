'use client';

import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import React, { useEffect, useRef } from 'react';

// This component uses @zxing/library directly to avoid issues with the react-zxing wrapper.
export function Scanner({
  onResult,
  onError,
}: {
  onResult: (result: any) => void;
  onError: (error: any) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: any;

    const startScanner = async () => {
      try {
        if (!videoRef.current) return;
        // This will request camera access
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            onResult(result);
          }
          // NotFoundException is thrown when no QR code is found in a frame. We can ignore it.
          if (error && !(error instanceof NotFoundException)) {
            console.error('Decode error:', error);
            onError(error);
          }
        });
      } catch (error: any) {
        console.error('Camera Error:', error);
        onError(error);
      }
    };

    startScanner();

    // Cleanup function to stop the scanner
    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [onResult, onError]);

  return <video ref={videoRef} className="w-full h-full object-cover" />;
}

'use client';

import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import React, { useEffect, useRef } from 'react';

// This component uses @zxing/library directly to avoid issues with the react-zxing wrapper.
export function Scanner({
  onResult,
  onError,
  isScanning,
}: {
  onResult: (result: any) => void;
  onError: (error: any) => void;
  isScanning: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    if (isScanning) {
      const startScanner = async () => {
        try {
          if (!videoRef.current) return;
          // This will request camera access
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
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
    }

    // Cleanup function to stop the scanner when the component unmounts or `isScanning` becomes false.
    return () => {
        reader.reset();
    };
  }, [isScanning, onResult, onError]);

  return <video ref={videoRef} className="w-full h-full object-cover" />;
}

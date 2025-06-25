'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/hooks/use-store';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/library';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, QrCode, ScanLine, Upload } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const Scanner = dynamic(() => import('@/components/qr-scanner').then(mod => mod.Scanner), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export function TransferDataDialog() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [view, setView] = useState<'options' | 'generate' | 'scan'>('options');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const isProcessing = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'generate' && isOpen) {
        const generateCode = async () => {
            setIsGenerating(true);
            setQrCodeValue('');
            try {
                const response = await fetch('/api/transfer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(state),
                });
                if (!response.ok) {
                    throw new Error('Failed to generate code from server.');
                }
                const { id } = await response.json();
                
                const transferUrl = new URL(window.location.origin);
                transferUrl.searchParams.set('id', id);
                setQrCodeValue(transferUrl.toString());

            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error Generating Code',
                    description: 'Could not generate a transfer code. Please try again.',
                });
                setView('options');
            } finally {
                setIsGenerating(false);
            }
        };
        generateCode();
    }
  }, [view, isOpen, state, toast]);

  const handleScanResult = async (result: any) => {
    if (isProcessing.current) return;

    if (result) {
      isProcessing.current = true;
      const text = result.getText();

      try {
        const url = new URL(text);
        const id = url.searchParams.get('id');

        if (!id) {
          throw new Error("QR code does not contain a valid transfer ID.");
        }

        const response = await fetch(`/api/transfer?id=${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Invalid or expired code.");
        }
        
        const data = await response.json();

        if ('spendings' in data && 'budget' in data) {
          setScannedData(JSON.stringify(data));
          setOpen(false);
        } else {
          throw new Error("Received data is not in the correct format.");
        }
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Transfer Failed',
          description: e.message || 'The scanned QR code is invalid.',
        });
        setView('options');
        isProcessing.current = false;
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (isProcessing.current) return;
    isProcessing.current = true;

    const reader = new BrowserQRCodeReader();
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const result = await reader.decodeFromImageUrl(imageUrl);
      await handleScanResult(result);
    } catch (err) {
      console.error("QR Code decoding from image failed", err);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: 'No valid QR code could be found in the selected image.',
      });
      isProcessing.current = false; 
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmTransfer = () => {
    if (scannedData) {
      try {
        const newState = JSON.parse(scannedData);
        dispatch({ type: 'HYDRATE', payload: newState });
        toast({ title: 'Success!', description: 'Data transferred successfully.' });
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Transfer Failed',
          description: 'Could not apply the new data.',
        });
      } finally {
        setScannedData(null);
        isProcessing.current = false;
      }
    }
  };

  const handleCancelTransfer = () => {
    setScannedData(null);
    isProcessing.current = false;
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTimeout(() => {
        setView('options');
        setQrCodeValue('');
        isProcessing.current = false;
      }, 200);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label>Transfer Data</Label>
              <p className="text-sm text-muted-foreground">Move your data using a QR code.</p>
            </div>
            <Button variant="outline">Transfer</Button>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            {view !== 'options' && (
              <Button variant="ghost" size="icon" className="absolute top-3 left-3" onClick={() => setView('options')}>
                <ArrowLeft />
              </Button>
            )}
            <DialogTitle className="text-center">
                {view === 'generate' && 'Generate QR'}
                {view === 'scan' && 'Scan QR'}
                {view === 'options' && 'Transfer Data'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {view === 'generate' && 'Have another device scan this code to copy your data.'}
              {view === 'scan' && 'Point your camera at a QR code or upload one from your gallery.'}
              {view === 'options' && 'Generate a QR code to send data or scan one to receive it.'}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            {view === 'options' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView('generate')}>
                  <QrCode size={32}/>
                  Generate QR
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView('scan')}>
                  <ScanLine size={32}/>
                  Scan QR
                </Button>
              </div>
            )}

            {view === 'generate' && (
              <div className="flex flex-col items-center gap-4">
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-4 h-[304px] w-[288px]">
                        <Skeleton className="h-[256px] w-[256px]" />
                        <p className="mt-4 text-sm text-muted-foreground">Generating secure code...</p>
                    </div>
                )}
                {!isGenerating && qrCodeValue && (
                    <div className="p-4 bg-white rounded-lg">
                        <QRCode value={qrCodeValue} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }}/>
                    </div>
                )}
              </div>
            )}

            {view === 'scan' && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-xs aspect-square rounded-lg overflow-hidden border">
                  <Scanner
                    onResult={handleScanResult}
                    onError={(error: any) => {
                      if (error?.name === 'NotAllowedError') {
                        toast({
                          variant: 'destructive',
                          title: 'Camera Access Denied',
                          description: 'Please enable camera permissions in your browser.',
                        });
                        setView('options');
                      }
                    }}
                  />
                </div>
                 <p className="text-sm text-muted-foreground">or</p>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    id="qr-upload-input"
                />
                <Button
                    variant="outline"
                    className="w-full max-w-xs"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mr-2" />
                    Upload from Gallery
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!scannedData} onOpenChange={(open) => {if(!open) handleCancelTransfer()}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all your current data. This action cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTransfer}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTransfer}>Yes, Transfer Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

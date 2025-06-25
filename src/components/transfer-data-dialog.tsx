'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/hooks/use-store';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode.react';

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
import { ArrowLeft, QrCode, ScanLine } from 'lucide-react';
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

  const handleScanResult = (result: any) => {
    if (result) {
      const text = result.getText();
      try {
        // Basic validation that it's our app's data by checking for a key
        const parsed = JSON.parse(text);
        if ('spendings' in parsed && 'budget' in parsed) {
          setScannedData(text);
          setOpen(false); // Close main dialog, confirmation will open
        } else {
           throw new Error("Invalid data structure");
        }
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Invalid QR Code',
          description: 'The scanned QR code does not contain valid StuSave data.',
        });
        setView('options');
      }
    }
  };

  const handleConfirmTransfer = () => {
    if (scannedData) {
      try {
        const newState = JSON.parse(scannedData);
        dispatch({ type: 'HYDRATE', payload: newState });
        toast({ title: 'Success!', description: 'Data transferred successfully.' });
        setScannedData(null);
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Transfer Failed',
          description: 'Could not apply the new data.',
        });
      }
    }
  };

  const stringifiedState = JSON.stringify(state);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset view when dialog is closed
      setTimeout(() => setView('options'), 200);
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
              {view === 'scan' && 'Point your camera at a StuSave QR code.'}
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
                <div className="p-4 bg-white rounded-lg">
                    <QRCode value={stringifiedState} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }}/>
                </div>
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!scannedData} onOpenChange={(open) => {if(!open) setScannedData(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all your current data. This action cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTransfer}>Yes, Transfer Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

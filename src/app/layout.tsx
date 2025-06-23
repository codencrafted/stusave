import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { StoreProvider } from '@/hooks/use-store';

export const metadata: Metadata = {
  title: 'StuSave – Smart Student Money Manager',
  description: 'Manage your monthly money, expenses, and savings goals with the help of AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

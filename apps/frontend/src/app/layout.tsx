import React from 'react';
import { Lora, Poppins } from 'next/font/google';
import type { Metadata } from 'next';
import { Header, Footer, Toaster } from '@/components';
import { cn } from '@/lib/utils';
import './globals.css';

const lora = Lora({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});
const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Order Management App',
  description: 'App that allows you to create and manage orders.',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en'>
      <body
        className={cn(
          lora.variable,
          poppins.variable,
          'flex flex-col min-h-screen bg-gray-100 antialiased'
        )}
      >
        <Header />
        <main className='flex-1'>{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;

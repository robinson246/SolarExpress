import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/components/wallet/Web3Provider";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { LoadingProvider } from "@/lib/loading-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolarExpress",
  description: "Blockchain-based interplanetary ticketing with 3D exploration",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <Web3Provider>
          <AuthProvider>
            <LoadingProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </LoadingProvider>
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
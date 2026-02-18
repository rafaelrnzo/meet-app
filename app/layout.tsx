import "@livekit/components-styles";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "LiveKit Meeting",
  description: "Minimal video conference UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming for native feel
};

import "@livekit/components-styles";
import "./globals.css";

export const metadata = {
  title: "LiveKit Meeting",
  description: "Minimal video conference UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

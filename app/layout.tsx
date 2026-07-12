import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "時間マスター | Time Master",
    template: "%s | 時間マスター",
  },
  description: "体感だけで時間を測る、シンプルな時間感覚ゲーム。",
  applicationName: "時間マスター",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "時間マスター",
  },
  icons: {
    icon: [
      { url: "/icons/time-master-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/time-master-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/time-master-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#080a20",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

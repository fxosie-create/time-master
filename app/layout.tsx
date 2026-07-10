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
    statusBarStyle: "default",
    title: "時間マスター",
  },
  icons: {
    icon: [
      { url: "/icons/time-master-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/time-master-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#10111a" },
  ],
  colorScheme: "light dark",
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

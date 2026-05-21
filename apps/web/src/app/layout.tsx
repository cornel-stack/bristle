import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Bristle",
  description: "Multi-source problem discovery for builders.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

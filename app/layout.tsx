import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KINETIQ | Master the Laws of the Universe",
  description: "Dive into high-fidelity interactive physics simulations designed for the next generation of scientists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark font-sans"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}


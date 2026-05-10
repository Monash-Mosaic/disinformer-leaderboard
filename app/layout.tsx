import type { Metadata } from "next";
import { Bungee_Shade, Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const bungeeShade = Bungee_Shade({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bungee-shade",
});

export const metadata: Metadata = {
  title: "Disinformer Leaderboard",
  description: "Disinformer Leaderboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${bungeeShade.variable} antialiased`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

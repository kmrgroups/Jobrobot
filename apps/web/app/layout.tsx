import "./globals.css";
import { Inter } from "next/font/google";
import Nav from "./nav";
import Footer from "./footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Job Bot — Auto-apply assistant",
  description: "Auto-apply tracker for LinkedIn and Naukri with resume auto-fill and instant notifications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-paper font-sans antialiased">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

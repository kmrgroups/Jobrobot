import "./globals.css";
import Nav from "./nav";

export const metadata = {
  title: "Job Bot",
  description: "Auto-apply tracker for LinkedIn and Naukri",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}

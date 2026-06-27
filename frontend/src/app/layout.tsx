import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "EduVerse AI - The AI-Native Learning Operating System",
  description: "A multi-agent, personalized educational environment that adapts to your learning pace and needs.",
  icons: {
    icon: "/favicon.png",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import AuthGuard from "@/components/providers/AuthGuard";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NextTopLoader color="var(--primary)" showSpinner={false} height={3} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}

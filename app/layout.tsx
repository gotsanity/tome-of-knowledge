import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./components/SessionProvider";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Tome of Knowledge",
  description: "The Scholar's Archive — a diegetic reading experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${newsreader.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="font-body text-on-surface antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

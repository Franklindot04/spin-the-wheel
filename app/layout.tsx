import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  APPEARANCE_THEMES,
  THEME_STORAGE_KEY,
} from "./lib/appearance-themes";

export const metadata: Metadata = {
  title: "Spin the Wheel",
  description: "Create and customize wheels for games, quizzes, decisions, and more.",
  appleWebApp: {
    capable: true,
    title: "Spin the Wheel",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

/*
 * Runs while the page is parsed, before the first
 * paint, so the loading screen already uses the
 * saved theme. Anything unexpected means Classic.
 */
const themeScript = `(function(){var t="classic";try{var v=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(Object.keys(APPEARANCE_THEMES))}.indexOf(v)!==-1)t=v}catch(e){}document.documentElement.setAttribute("data-theme",t)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

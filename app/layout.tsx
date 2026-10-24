import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  APPEARANCE_THEMES,
  THEME_STORAGE_KEY,
} from "./lib/appearance-themes";
import { en } from "./lib/i18n/en";
import { languageScript } from "./lib/i18n/head-script";
import { LanguageProvider } from "./lib/i18n/provider";

/*
 * The English page title and description are the fallback written
 * into the built page. The head script (and the language store, when
 * the language changes) replace them for another language.
 */
export const metadata: Metadata = {
  title: en["meta.title"],
  description: en["meta.description"],
  appleWebApp: {
    capable: true,
    title: en["meta.title"],
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <script
          dangerouslySetInnerHTML={{ __html: languageScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

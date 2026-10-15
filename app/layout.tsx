import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spin the Wheel",
  description: "Create and customize wheels for games, quizzes, decisions, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

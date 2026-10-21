import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Nghiên cứu khoa học · Research Agent",
  description:
    "Không gian nghiên cứu với 177 kỹ năng khoa học, bài báo, dự án và công cụ phân tích.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

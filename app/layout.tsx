import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "RIVERSE | 도시 수해 디지털 트윈";
  const description =
    "도시 공사와 하천 변경이 침수 위험에 미치는 영향을 공사 전에 시뮬레이션합니다.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "RIVERSE",
      locale: "ko_KR",
      type: "website",
      images: [{
        url: `${origin}/og.png`,
        width: 1536,
        height: 1024,
        alt: "RIVERSE 도시 수해 디지털 트윈",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

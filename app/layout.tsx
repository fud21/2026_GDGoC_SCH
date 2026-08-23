import type { Metadata } from "next";
import "./globals.css";

const title = "RIVERSE | 우리 동네 침수 위험지도";
const description =
  "실제 2D 지도에서 비와 하천 상황에 따른 예상 침수지역과 수심을 확인합니다.";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "http://localhost:3000",
    siteName: "RIVERSE",
    locale: "ko_KR",
    type: "website",
    images: [{
      url: "/og.png",
      width: 1536,
      height: 1024,
      alt: "RIVERSE 우리 동네 침수 위험지도",
    }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

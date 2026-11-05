import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MoviesProvider } from "@/lib/movies-context";

export const metadata: Metadata = {
  title: "AsilKino — O'zbek tilida kinolar, seriallar va multfilmlar",
  description:
    "Tarjima kinolar, seriallar va multfilmlarni o'zbek tilida onlayn HD sifatda bepul tomosha qiling. Premyeralar, treylerlar va tasodifiy kino tanlash.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="flex min-h-screen flex-col antialiased">
        <MoviesProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-5">{children}</main>
          <Footer />
        </MoviesProvider>
      </body>
    </html>
  );
}

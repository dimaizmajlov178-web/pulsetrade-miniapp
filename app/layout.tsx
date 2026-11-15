import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseTrade",
  description: "Торговый терминал",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Подключаем официальный скрипт Telegram */}
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className="bg-black text-white flex justify-center">
        <div className="w-full max-w-[400px] min-h-screen bg-[#0B0E11] relative shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
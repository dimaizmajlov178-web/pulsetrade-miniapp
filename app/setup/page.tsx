"use client";

import { useState } from "react";

export default function Setup() {
  const [status, setStatus] = useState("");

  const handleSetup = async () => {
    setStatus("Создаем таблицы...");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("Таблицы созданы! Теперь можно идти на главную.");
      } else {
        setStatus("Ошибка: " + data.error);
      }
    } catch (error: any) {
      setStatus("Ошибка сети: " + error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0B0E11] text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Настройка базы данных</h1>
      <button
        onClick={handleSetup}
        className="bg-[#00C076] text-white px-6 py-3 rounded-xl font-bold"
      >
        Создать таблицы
      </button>
      {status && <p className="mt-4 text-center">{status}</p>}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { ChevronDown, Menu, Wallet, Settings, Clock, CandlestickChart, Search, PlusCircle, ArrowUpRight } from "lucide-react";

const TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1h", "4h"];
const ASSETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "DOGE/USDT"];

export default function Home() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance] = useState(1000);
  const [price, setPrice] = useState<number>(0);
  const [amount, setAmount] = useState(10);
  const [expiry, setExpiry] = useState("1 мин");
  const [timeframe, setTimeframe] = useState("1m");
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [showAssets, setShowAssets] = useState(false);
  const [showBalanceMenu, setShowBalanceMenu] = useState(false); // Состояние для меню баланса
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [seriesInstance, setSeriesInstance] = useState<any>(null);

  const getSymbol = () => selectedAsset.replace("/", "");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0B0E11" },
        textColor: "#848E9C",
      },
      grid: {
        vertLines: { color: "#1f2630" },
        horzLines: { color: "#1f2630" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#00C076",
      downColor: "#FF4D4D",
      borderVisible: false,
      wickUpColor: "#00C076",
      wickDownColor: "#FF4D4D",
    });

    setChartInstance(chart);
    setSeriesInstance(candlestickSeries);

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesInstance) return;

    const symbol = getSymbol();

    fetch(`/api/market?symbol=${symbol}&interval=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.candles && data.candles.length > 0) {
          seriesInstance.setData(data.candles);
          const lastCandle = data.candles[data.candles.length - 1];
          setPrice(lastCandle.close);
          
          if (chartInstance) {
            chartInstance.timeScale().setVisibleLogicalRange({
              from: data.candles.length - 100,
              to: data.candles.length,
            });
          }
        }
      });

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.k) {
        const k = message.k;
        seriesInstance.update({
          time: k.t / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });
        setPrice(parseFloat(k.c));
      }
    };

    return () => ws.close();
  }, [timeframe, seriesInstance, chartInstance, selectedAsset]);

  const handleTrade = async (direction: string) => {
    if (balance < amount) {
      alert("Недостаточно средств");
      return;
    }

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: getSymbol(),
          direction: direction,
          amount: amount,
          telegramId: 123456789,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBalance(data.balance);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B0E11] overflow-hidden relative">
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <header className="flex justify-between items-center px-4 py-3 bg-[#0B0E11] shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C076] rounded-full flex items-center justify-center font-bold text-white text-lg shadow-[0_0_10px_rgba(0,192,118,0.3)]">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-[#00C076] font-bold text-sm leading-tight">PULSETRADE</span>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>VIP</span>
              <span className="text-[#00C076]">РЕАЛЬНЫЙ</span>
              <ChevronDown size={10} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          {/* АКТИВНАЯ ПЛАШКА БАЛАНСА */}
          <button 
            onClick={() => setShowBalanceMenu(!showBalanceMenu)}
            className="bg-[#151A21] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-[#00C076] hover:bg-[#1f2630] transition-colors"
          >
            <Wallet size={16} />
            ${balance}
          </button>

          {/* ВЫПАДАЮЩЕЕ МЕНЮ БАЛАНСА */}
          {showBalanceMenu && (
            <div className="absolute top-[50px] right-[40px] w-48 bg-[#151A21] rounded-xl shadow-2xl border border-[#1f2630] overflow-hidden z-50 flex flex-col">
               <button 
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-[#1f2630] transition-colors"
                  onClick={() => setShowBalanceMenu(false)}
               >
                  <PlusCircle size={16} className="text-[#00C076]" />
                  Пополнить
               </button>
               <div className="h-[1px] bg-[#1f2630] w-full"></div>
               <button 
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-[#1f2630] transition-colors"
                  onClick={() => setShowBalanceMenu(false)}
               >
                  <ArrowUpRight size={16} className="text-[#FF4D4D]" />
                  Вывести
               </button>
            </div>
          )}

          <button className="text-white"><Menu size={24} /></button>
        </div>
      </header>

      {/* ИНФО О ПАРЕ И ТАЙМФРЕЙМЫ */}
      <div className="flex flex-col px-4 py-1 shrink-0 relative z-20">
        <div className="flex justify-between items-center text-xs mb-2">
          <div 
            className="flex items-center gap-2 font-bold cursor-pointer hover:bg-[#151A21] px-2 py-1 rounded-lg transition-colors -ml-2"
            onClick={() => setShowAssets(!showAssets)}
          >
            <span className="text-base text-white">{selectedAsset}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAssets ? 'rotate-180' : ''}`} />
            <span className="text-[#00C076] ml-2">82%</span>
          </div>
          <Settings size={16} className="text-gray-500" />
        </div>
        
        <div className="flex gap-4 overflow-x-auto text-xs font-bold pb-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`transition-colors ${
                timeframe === tf ? "text-[#00C076]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ВЫПАДАЮЩИЙ СПИСОК АКТИВОВ */}
      {showAssets && (
        <div className="absolute top-[110px] left-4 w-64 bg-[#151A21] rounded-xl shadow-2xl z-50 border border-[#1f2630] overflow-hidden">
           <div className="p-2 border-b border-[#1f2630] flex items-center gap-2 text-gray-400">
              <Search size={14} />
              <input type="text" placeholder="Поиск..." className="bg-transparent text-sm outline-none w-full text-white" />
           </div>
           <div className="max-h-60 overflow-y-auto">
              {ASSETS.map((asset) => (
                <div 
                  key={asset}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowAssets(false);
                  }}
                  className={`px-4 py-3 text-sm font-bold cursor-pointer hover:bg-[#1f2630] transition-colors ${
                    selectedAsset === asset ? "text-[#00C076]" : "text-white"
                  }`}
                >
                  {asset}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* ТЕКУЩАЯ ЦЕНА И ГРАФИК */}
      <div className="flex-1 relative min-h-[300px]">
        <div className="absolute top-2 left-4 z-10">
            <span className="text-3xl font-bold text-white">${price}</span>
        </div>
        <div className="w-full h-full" ref={chartContainerRef} />
      </div>

      {/* ПАНЕЛЬ СТАВКИ */}
      <div className="p-3 bg-[#0B0E11] shrink-0 relative z-20">
        
        <div className="grid grid-cols-3 gap-2 mb-3 items-stretch">
           
           <div className="bg-[#151A21] rounded-xl flex flex-col items-center justify-center h-[80px]">
              <Clock size={16} className="text-gray-400 mb-1" />
              <div className="flex items-center gap-1">
                 <span className="font-bold text-sm text-white">{expiry}</span>
                 <ChevronDown size={12} className="text-gray-400" />
              </div>
           </div>

           <div className="flex flex-col justify-between h-[80px]">
              <div className="bg-[#151A21] rounded-lg flex items-center justify-center h-10 gap-2">
                 <span className="font-bold text-sm text-white">${amount}</span>
                 <ChevronDown size={12} className="text-gray-400" />
              </div>
              
              <div className="flex gap-1 h-8 mt-1">
                 <button onClick={() => setAmount(Math.max(1, Math.floor(amount / 2)))} className="flex-1 bg-[#151A21] rounded-lg flex justify-center items-center text-white text-xs font-bold hover:bg-[#1f2630] transition">/2</button>
                 <button onClick={() => setAmount(amount * 2)} className="flex-1 bg-[#151A21] rounded-lg flex justify-center items-center text-white text-xs font-bold hover:bg-[#1f2630] transition">x2</button>
              </div>
           </div>

           <div className="bg-[#151A21] rounded-xl flex flex-col items-center justify-center h-[80px]">
              <span className="text-[10px] text-gray-400">Доходность</span>
              <span className="text-xl text-[#00C076] font-bold leading-none mt-1">82%</span>
              <span className="text-[10px] text-[#00C076] font-bold leading-none mt-1">
                 +${(amount * 0.82).toFixed(2)}
              </span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 h-20">
          <button
            onClick={() => handleTrade("up")}
            className="bg-[#00C076] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,192,118,0.3)]"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
          <button
            onClick={() => handleTrade("down")}
            className="bg-[#FF4D4D] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,77,77,0.3)]"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {/* НИЖНЕЕ МЕНЮ */}
      <div className="flex justify-around items-center py-2 border-t border-[#151A21] bg-[#0B0E11] shrink-0">
         <button className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition">
            <Menu size={18} />
            <span className="text-[9px]">Меню</span>
         </button>
         
         <button className="flex flex-col items-center gap-0.5 text-[#00C076] hover:text-[#00a060] transition">
            <CandlestickChart size={20} />
            <span className="text-[9px]">Торговля</span>
         </button>
         
         <button className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition">
            <Wallet size={18} />
            <span className="text-[9px]">Кошелек</span>
         </button>
      </div>
    </div>
  );
}
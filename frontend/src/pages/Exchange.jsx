import { useState, useEffect, useCallback } from 'react';
import TOKENS from '../data/tokens';

function generateChartData() {
  const data = [];
  let value = 50 + Math.random() * 20;
  for (let i = 0; i < 30; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(20, Math.min(80, value));
    data.push(value);
  }
  return data;
}

function formatNumber(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatPrice(price) {
  return '$' + price.toFixed(price < 1 ? 4 : 2);
}

function MiniChart({ data, positive }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = ((max - v) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const color = positive ? '#00ff88' : '#ff3366';
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Exchange() {
  const buildMarket = useCallback(
    () =>
      TOKENS.map((t) => ({
        ...t,
        price: t.basePrice * (0.95 + Math.random() * 0.1),
        change24h: (Math.random() * 30 - 10).toFixed(2),
        volume24h: Math.floor(Math.random() * 10_000_000 + 1_000_000),
        high24h: t.basePrice * (1 + Math.random() * 0.15),
        low24h: t.basePrice * (1 - Math.random() * 0.15),
        chartData: generateChartData(),
      })),
    [],
  );

  const [market, setMarket] = useState(buildMarket);

  useEffect(() => {
    const id = setInterval(() => {
      setMarket((prev) =>
        prev.map((t) => {
          const delta = (Math.random() - 0.48) * 0.04;
          const price = Math.max(0.01, t.price * (1 + delta));
          const change = ((price / t.basePrice) - 1) * 100;
          return {
            ...t,
            price,
            change24h: change.toFixed(2),
            volume24h: t.volume24h + Math.floor(Math.random() * 50000),
            chartData: [...t.chartData.slice(1), 50 + change],
          };
        }),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const totalCap = market.reduce((s, t) => s + t.price * t.supply, 0);
  const totalVol = market.reduce((s, t) => s + t.volume24h, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">A-Suite Exchange</h1>
          <p className="text-gray-400 mt-1">Datos de mercado en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tokens Activos</p>
          <p className="text-2xl font-bold">{TOKENS.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Cap</p>
          <p className="text-2xl font-bold">${formatNumber(totalCap)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volumen 24 h</p>
          <p className="text-2xl font-bold">${formatNumber(totalVol)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dominancia</p>
          <p className="text-2xl font-bold">AGOV 28%</p>
        </div>
      </div>

      {/* Token cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {market.map((t) => {
          const positive = parseFloat(t.change24h) >= 0;
          return (
            <div
              key={t.slug}
              className="card hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={t.img}
                  alt={t.ticker}
                  className="w-14 h-14 rounded-xl border border-gray-700 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{t.name}</p>
                  <p className="text-sm text-gray-400">
                    {t.ticker} &middot; {t.type}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    t.series === 'A'
                      ? 'bg-blue-500/20 text-blue-300'
                      : t.series === 'A1'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {t.series}
                </span>
              </div>

              {/* Price row */}
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-2xl font-bold">{formatPrice(t.price)}</p>
                  <p className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
                    {positive ? '+' : ''}
                    {t.change24h}%
                  </p>
                </div>
                <div className="w-24">
                  <MiniChart data={t.chartData} positive={positive} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-t border-gray-800 pt-3">
                <div>
                  <p className="text-gray-500">Vol 24h</p>
                  <p className="text-white">${formatNumber(t.volume24h)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Supply</p>
                  <p className="text-white">{formatNumber(t.supply)}</p>
                </div>
                <div>
                  <p className="text-gray-500">M.Cap</p>
                  <p className="text-white">${formatNumber(t.price * t.supply)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-600">
        Datos simulados &mdash; se actualizan cada 3 s &middot; A-Suite Token Exchange
      </p>
    </div>
  );
}

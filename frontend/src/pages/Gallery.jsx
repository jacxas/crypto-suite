import TOKENS, { TOKEN_SERIES } from '../data/tokens';
import { SERIES_BADGE_CLASSES } from '../data/constants';
import { useState } from 'react';

export default function Gallery() {
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [selectedToken, setSelectedToken] = useState(null);

  const filtered =
    seriesFilter === 'ALL' ? TOKENS : TOKENS.filter((t) => t.series === seriesFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Galeria de Tokens</h1>
        <p className="text-gray-400 mt-1">Assets visuales del ecosistema A-Suite</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...TOKEN_SERIES].map((s) => (
          <button
            key={s}
            onClick={() => setSeriesFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seriesFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {s === 'ALL' ? 'Todos' : `Serie ${s}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filtered.map((t) => (
          <button
            key={t.slug}
            onClick={() => setSelectedToken(t)}
            className="group text-left"
          >
            <div className="card p-0 overflow-hidden hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-square overflow-hidden">
                <img
                  src={t.img}
                  alt={t.ticker}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{t.ticker}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${SERIES_BADGE_CLASSES[t.series]}`}>
                    {t.series}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{t.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedToken && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-dark-100 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedToken.img}
              alt={selectedToken.ticker}
              className="w-full aspect-square object-cover"
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{selectedToken.name}</h2>
                <span className={`text-sm px-3 py-1 rounded ${SERIES_BADGE_CLASSES[selectedToken.series]}`}>
                  {selectedToken.series}
                </span>
              </div>
              <p className="text-gray-400">
                {selectedToken.ticker} &middot; {selectedToken.type}
              </p>
              <button
                onClick={() => setSelectedToken(null)}
                className="btn-secondary mt-4 w-full text-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

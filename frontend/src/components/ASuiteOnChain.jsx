import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import TOKENS from '../data/tokens';
import DIRECCIONES from '../data/asuite-addresses.json';
import { ERC20_MINIMAL_ABI } from '../contracts/ERC20MinimalABI';

// Exploradores por red, para enlazar el contrato cuando exista.
const EXPLORADOR = {
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
  137: 'https://polygonscan.com',
};

function formatea(valor) {
  return Number(formatUnits(valor, 18)).toLocaleString('es-ES', {
    maximumFractionDigits: 2,
  });
}

function Fila({ token, direccion, cuenta, explorador }) {
  const { data: supply } = useReadContract({
    address: direccion,
    abi: ERC20_MINIMAL_ABI,
    functionName: 'totalSupply',
    query: { enabled: Boolean(direccion) },
  });

  const { data: saldo } = useReadContract({
    address: direccion,
    abi: ERC20_MINIMAL_ABI,
    functionName: 'balanceOf',
    args: cuenta ? [cuenta] : undefined,
    query: { enabled: Boolean(direccion) && Boolean(cuenta) },
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-dark-100/60 px-4 py-2">
      <span className="flex items-center gap-2">
        <img
          src={token.img}
          alt={token.ticker}
          className="h-6 w-6 rounded-full object-cover"
        />
        <span className="font-semibold text-white">{token.ticker}</span>
        <span className="text-xs text-gray-500">{token.name}</span>
      </span>

      {direccion ? (
        <span className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-400">
            supply{' '}
            <span className="text-white">
              {supply !== undefined ? formatea(supply) : '...'}
            </span>
          </span>
          <span className="text-gray-400">
            tu saldo{' '}
            <span className="text-emerald-400">
              {cuenta ? (saldo !== undefined ? formatea(saldo) : '...') : '-'}
            </span>
          </span>
          {explorador && (
            <a
              href={explorador + '/token/' + direccion}
              target="_blank"
              rel="noreferrer"
              className="text-primary-400 hover:underline"
            >
              ver
            </a>
          )}
        </span>
      ) : (
        <span className="text-xs text-gray-600">no desplegado en esta red</span>
      )}
    </li>
  );
}

export default function ASuiteOnChain() {
  const chainId = useChainId();
  const { address: cuenta } = useAccount();

  const mapa = DIRECCIONES[String(chainId)] || {};
  const desplegados = TOKENS.filter((t) => mapa[t.ticker]).length;
  const explorador = EXPLORADOR[chainId];

  return (
    <section className="mt-10 rounded-xl border border-gray-700 bg-dark-200 p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-white">Estado en cadena</h2>
        <span className="text-xs text-gray-400">
          {desplegados} de {TOKENS.length} tokens desplegados en esta red
          {cuenta ? '' : ' - conecta la wallet para ver tus saldos'}
        </span>
      </div>

      <ul className="space-y-2">
        {TOKENS.map((t) => (
          <Fila
            key={t.ticker}
            token={t}
            direccion={mapa[t.ticker]}
            cuenta={cuenta}
            explorador={explorador}
          />
        ))}
      </ul>

      {desplegados === 0 && (
        <p className="mt-4 text-xs text-gray-500">
          Los precios de este mercado son simulados y no vienen de la cadena.
          Para que estos datos sean reales, despliega la suite con{' '}
          <code className="text-gray-300">npm run deploy:asuite</code>: el script
          escribe las direcciones en{' '}
          <code className="text-gray-300">
            frontend/src/data/asuite-addresses.json
          </code>{' '}
          y este panel las lee solo.
        </p>
      )}
    </section>
  );
}

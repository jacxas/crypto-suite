import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Staking from './pages/Staking';
import NFTMarketplace from './pages/NFTMarketplace';
import Escrow from './pages/Escrow';
import MultiSig from './pages/MultiSig';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #374151',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="staking" element={<Staking />} />
          <Route path="nft" element={<NFTMarketplace />} />
          <Route path="escrow" element={<Escrow />} />
          <Route path="multisig" element={<MultiSig />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Staking from './pages/Staking';
import NFTMarketplace from './pages/NFTMarketplace';
import Escrow from './pages/Escrow';
import MultiSig from './pages/MultiSig';
import YieldFarming from './pages/YieldFarming';
import Governance from './pages/Governance';
import Lending from './pages/Lending';
import NFTAuctions from './pages/NFTAuctions';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
// --- A-Suite (suite de 10 monedas) ---
import Exchange from './pages/Exchange';
import TokenSpecs from './pages/TokenSpecs';
import Gallery from './pages/Gallery';
import Token from './pages/Token';
import Faucet from './pages/Faucet';

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
          <Route path="farming" element={<YieldFarming />} />
          <Route path="governance" element={<Governance />} />
          <Route path="lending" element={<Lending />} />
          <Route path="auctions" element={<NFTAuctions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          {/* A-Suite: suite de 10 monedas */}
          <Route path="exchange" element={<Exchange />} />
          <Route path="specs" element={<TokenSpecs />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="token" element={<Token />} />
          <Route path="faucet" element={<Faucet />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

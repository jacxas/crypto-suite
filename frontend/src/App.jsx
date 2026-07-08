import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Faucet from './pages/Faucet';
import Token from './pages/Token';
import NFTCollection from './pages/NFTCollection';
import Marketplace from './pages/Marketplace';
import Exchange from './pages/Exchange';
import TokenSpecs from './pages/TokenSpecs';
import Gallery from './pages/Gallery';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/specs" element={<TokenSpecs />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/faucet" element={<Faucet />} />
        <Route path="/token" element={<Token />} />
        <Route path="/nft" element={<NFTCollection />} />
        <Route path="/marketplace" element={<Marketplace />} />
      </Routes>
    </Layout>
  );
}

export default App;

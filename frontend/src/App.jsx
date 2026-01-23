import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Faucet from './pages/Faucet';
import Token from './pages/Token';
import NFTCollection from './pages/NFTCollection';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/faucet" element={<Faucet />} />
        <Route path="/token" element={<Token />} />
        <Route path="/nft" element={<NFTCollection />} />
        <Route path="/marketplace" element={<Marketplace />} />
      </Routes>
    </Layout>
  );
}

export default App;

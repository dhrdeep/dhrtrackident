import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TrackIdentPage from './pages/TrackIdentPage';
import DHR1Page from './pages/DHR1Page';
import DHR2Page from './pages/DHR2Page';
import VIPPage from './pages/VIPPage';
import ForumPage from './pages/ForumPage';
import UploadPage from './pages/UploadPage';
import ShopPage from './pages/ShopPage';
import AdminPage from './pages/AdminPage';
import PatreonCallbackPage from './pages/PatreonCallbackPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/track-ident" element={<TrackIdentPage />} />
          <Route path="/dhr1" element={<DHR1Page />} />
          <Route path="/dhr2" element={<DHR2Page />} />
          <Route path="/vip" element={<VIPPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth/patreon/callback" element={<PatreonCallbackPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
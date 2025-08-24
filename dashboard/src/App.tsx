import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Podcasts from './pages/Podcasts';
import Episodes from './pages/Episodes';
import Slots from './pages/Slots';
import Campaigns from './pages/Campaigns';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="podcasts" element={<Podcasts />} />
            <Route path="episodes" element={<Episodes />} />
            <Route path="slots" element={<Slots />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
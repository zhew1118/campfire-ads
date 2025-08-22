import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Podcasts from './pages/Podcasts';
import Campaigns from './pages/Campaigns';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="podcasts" element={<Podcasts />} />
            <Route path="campaigns" element={<Campaigns />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
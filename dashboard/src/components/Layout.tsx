import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // No user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Role-based navigation according to stack.md business logic
  const getNavigationForRole = (role: string) => {
    if (role === 'podcaster') {
      // Podcasters (Supply Side) - manage their inventory
      return [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'My Podcasts', href: '/podcasts', icon: MicrophoneIcon },
        { name: 'Episodes', href: '/episodes', icon: SpeakerWaveIcon },
        { name: 'Ad Slots', href: '/slots', icon: ChartBarIcon },
      ];
    } else if (role === 'advertiser') {
      // Advertisers (Demand Side) - browse inventory and manage campaigns
      return [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Browse Inventory', href: '/inventory', icon: MicrophoneIcon },
        { name: 'My Campaigns', href: '/campaigns', icon: SpeakerWaveIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
      ];
    }
    // Default fallback
    return [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
    ];
  };

  const navigation = getNavigationForRole(user?.role);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/login');
  };

  const getUserInitials = (user: any) => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'podcaster':
        return 'Podcaster';
      case 'advertiser':
        return 'Advertiser';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center h-16 px-4 bg-primary-600">
          <h1 className="text-xl font-bold text-white">🔥 Campfire Ads</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserInitials(user)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {getRoleDisplayName(user?.role)}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
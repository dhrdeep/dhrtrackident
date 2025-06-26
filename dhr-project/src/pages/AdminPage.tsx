import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  TrendingUp, 
  DollarSign, 
  RefreshCw, 
  Download, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Mail,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  AlertTriangle,
  Info
} from 'lucide-react';
import { patreonService, DHR_PATREON_TIERS } from '../services/patreonService';
import { subscriptionService } from '../services/subscriptionService';
import { User, SubscriptionTier } from '../types/subscription';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  patreonSubscribers: number;
  vipUsers: number;
  premiumUsers: number;
  freeUsers: number;
  recentSignups: number;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'patreon' | 'analytics' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | SubscriptionTier>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<{ isConfigured: boolean; issues: string[] }>({ isConfigured: false, issues: [] });
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    patreonSubscribers: 0,
    vipUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    recentSignups: 0
  });

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  // Load users and calculate stats
  useEffect(() => {
    loadUsers();
    checkPatreonConfig();
  }, []);

  // Filter users based on search and tier
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(user => user.subscriptionTier === filterTier);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterTier]);

  const checkPatreonConfig = () => {
    const status = patreonService.getConfigStatus();
    setConfigStatus(status);
  };

  const loadUsers = () => {
    // In a real app, this would fetch from your backend
    const mockUsers: User[] = [
      {
        id: 'user_1',
        email: 'john@example.com',
        username: 'John Doe',
        subscriptionTier: 'vip',
        subscriptionStatus: 'active',
        subscriptionSource: 'patreon',
        subscriptionStartDate: '2024-01-15T00:00:00Z',
        patreonTier: 'dhr_vip',
        preferences: {
          emailNotifications: true,
          newReleaseAlerts: true,
          eventNotifications: true,
          autoPlay: true,
          preferredGenres: ['deep-house']
        },
        createdAt: '2024-01-15T00:00:00Z',
        lastLoginAt: '2024-01-20T10:30:00Z'
      },
      {
        id: 'user_2',
        email: 'sarah@example.com',
        username: 'Sarah Wilson',
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionSource: 'patreon',
        subscriptionStartDate: '2024-01-10T00:00:00Z',
        patreonTier: 'dhr_premium',
        preferences: {
          emailNotifications: true,
          newReleaseAlerts: true,
          eventNotifications: false,
          autoPlay: true,
          preferredGenres: ['deep-house', 'tech-house']
        },
        createdAt: '2024-01-10T00:00:00Z',
        lastLoginAt: '2024-01-19T15:45:00Z'
      },
      {
        id: 'user_3',
        email: 'mike@example.com',
        username: 'Mike Johnson',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        subscriptionSource: 'direct',
        subscriptionStartDate: '2024-01-18T00:00:00Z',
        preferences: {
          emailNotifications: false,
          newReleaseAlerts: true,
          eventNotifications: false,
          autoPlay: true,
          preferredGenres: ['deep-house']
        },
        createdAt: '2024-01-18T00:00:00Z',
        lastLoginAt: '2024-01-20T09:15:00Z'
      }
    ];

    setUsers(mockUsers);
    calculateStats(mockUsers);
  };

  const calculateStats = (userList: User[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats: AdminStats = {
      totalUsers: userList.length,
      activeSubscribers: userList.filter(u => u.subscriptionTier !== 'free').length,
      monthlyRevenue: userList.reduce((total, user) => {
        if (user.subscriptionTier === 'vip') return total + 20;
        if (user.subscriptionTier === 'premium') return total + 10;
        return total;
      }, 0),
      patreonSubscribers: userList.filter(u => u.subscriptionSource === 'patreon').length,
      vipUsers: userList.filter(u => u.subscriptionTier === 'vip').length,
      premiumUsers: userList.filter(u => u.subscriptionTier === 'premium').length,
      freeUsers: userList.filter(u => u.subscriptionTier === 'free').length,
      recentSignups: userList.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
    };

    setStats(newStats);
  };

  const handlePatreonAuth = () => {
    if (!configStatus.isConfigured) {
      setSyncStatus('Please configure Patreon credentials in .env file first');
      return;
    }
    
    const authUrl = patreonService.getAuthUrl();
    window.open(authUrl, '_blank', 'width=600,height=700');
  };

  const handleSyncPatreon = async () => {
    if (!patreonService.isAuthenticated()) {
      setSyncStatus('Please authenticate with Patreon first');
      return;
    }

    setIsLoading(true);
    setSyncStatus('Syncing with Patreon...');

    try {
      const result = await patreonService.syncPatreonSubscribers();
      setSyncStatus(`Sync completed: ${result.success} users synced, ${result.errors} errors`);
      
      // Update local users list
      const updatedUsers = [...users];
      result.users.forEach(patreonUser => {
        const existingIndex = updatedUsers.findIndex(u => u.email === patreonUser.email);
        if (existingIndex >= 0) {
          updatedUsers[existingIndex] = patreonUser;
        } else {
          updatedUsers.push(patreonUser);
        }
      });
      
      setUsers(updatedUsers);
      calculateStats(updatedUsers);
    } catch (error) {
      setSyncStatus(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Username', 'Email', 'Subscription Tier', 'Status', 'Source', 'Start Date', 'Last Login'],
      ...filteredUsers.map(user => [
        user.username,
        user.email,
        user.subscriptionTier,
        user.subscriptionStatus,
        user.subscriptionSource,
        new Date(user.subscriptionStartDate).toLocaleDateString(),
        new Date(user.lastLoginAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhr-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return 'text-orange-400 bg-orange-500/20';
      case 'premium': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; change?: string; color?: string }> = ({ 
    icon: Icon, title, value, change, color = 'text-orange-400' 
  }) => (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-16 w-16 rounded-xl shadow-2xl border-2 border-orange-400/50"
                onError={handleArtworkError}
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-2">
                <Settings className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                DHR Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-1">Manage Subscribers, Patreon Integration & Analytics</p>
            </div>
          </div>
        </header>

        {/* Configuration Warning */}
        {!configStatus.isConfigured && (
          <div className="mb-8 bg-red-500/20 border border-red-400/30 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-semibold mb-2">Patreon Configuration Required</h3>
                <div className="text-red-200 text-sm space-y-1">
                  {configStatus.issues.map((issue, index) => (
                    <p key={index}>• {issue}</p>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
                  <p className="text-red-200 text-sm">
                    <strong>To fix:</strong> Create a <code>.env</code> file with your Patreon credentials:
                  </p>
                  <pre className="text-xs text-red-300 mt-2 font-mono">
{`VITE_PATREON_CLIENT_ID=your_client_id_here
VITE_PATREON_CLIENT_SECRET=your_client_secret_here
VITE_PATREON_REDIRECT_URI=${patreonService.getRedirectUri()}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-2 border border-orange-400/20">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'patreon', label: 'Patreon', icon: Crown },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard icon={Users} title="Total Users" value={stats.totalUsers} change="+12%" />
              <StatCard icon={Crown} title="Active Subscribers" value={stats.activeSubscribers} change="+8%" />
              <StatCard icon={DollarSign} title="Monthly Revenue" value={`€${stats.monthlyRevenue}`} change="+15%" />
              <StatCard icon={TrendingUp} title="Recent Signups" value={stats.recentSignups} change="+23%" />
            </div>

            {/* Subscription Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
                <h3 className="text-xl font-bold text-white mb-4">Subscription Tiers</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-orange-400" />
                      <span className="text-white">VIP Users</span>
                    </div>
                    <span className="text-orange-400 font-semibold">{stats.vipUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <span className="text-white">Premium Users</span>
                    </div>
                    <span className="text-amber-400 font-semibold">{stats.premiumUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-white">Free Users</span>
                    </div>
                    <span className="text-gray-400 font-semibold">{stats.freeUsers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSyncPatreon}
                    disabled={isLoading || !configStatus.isConfigured}
                    className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors border ${
                      configStatus.isConfigured 
                        ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/30' 
                        : 'bg-gray-600/50 border-gray-600/30 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Patreon</span>
                  </button>
                  <button
                    onClick={exportUsers}
                    className="w-full flex items-center space-x-2 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/30"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Users</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/30">
                    <Mail className="h-4 w-4" />
                    <span>Send Newsletter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as any)}
                    className="px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  >
                    <option value="all">All Tiers</option>
                    <option value="vip">VIP</option>
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                  
                  <button
                    onClick={exportUsers}
                    className="flex items-center space-x-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-400/30"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-orange-400/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-semibold">User</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Subscription</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Source</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Start Date</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Last Login</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-white">{user.username}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(user.subscriptionTier)}`}>
                            {user.subscriptionTier.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            {user.subscriptionSource === 'patreon' && <Crown className="h-4 w-4 text-orange-400" />}
                            <span className="text-gray-300 capitalize">{user.subscriptionSource}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{formatDate(user.subscriptionStartDate)}</td>
                        <td className="p-4 text-gray-300">{formatDate(user.lastLoginAt)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-white">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patreon Tab */}
        {activeTab === 'patreon' && (
          <div className="space-y-6">
            {/* Patreon Connection Status */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Patreon Integration</h3>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  patreonService.isAuthenticated() 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {patreonService.isAuthenticated() ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{patreonService.isAuthenticated() ? 'Connected' : 'Not Connected'}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Connection Actions</h4>
                  <div className="space-y-3">
                    {!patreonService.isAuthenticated() ? (
                      <button
                        onClick={handlePatreonAuth}
                        disabled={!configStatus.isConfigured}
                        className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors border ${
                          configStatus.isConfigured 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/30' 
                            : 'bg-gray-600/50 border-gray-600/30 cursor-not-allowed'
                        }`}
                      >
                        <Crown className="h-4 w-4" />
                        <span>Connect to Patreon</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSyncPatreon}
                          disabled={isLoading}
                          className="w-full flex items-center space-x-2 p-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-400/30"
                        >
                          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Sync Subscribers</span>
                        </button>
                        <button
                          onClick={() => patreonService.logout()}
                          className="w-full flex items-center space-x-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-400/30"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Disconnect</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Status & Messages</h4>
                  {!configStatus.isConfigured && (
                    <div className="bg-red-500/20 rounded-lg p-3 border border-red-400/30 mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-red-300 text-sm">Configuration required</span>
                      </div>
                    </div>
                  )}
                  {syncStatus && (
                    <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-300 text-sm">{syncStatus}</span>
                      </div>
                    </div>
                  )}
                  {configStatus.isConfigured && (
                    <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 text-sm">Configuration valid</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            {!configStatus.isConfigured && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-300 font-semibold mb-3">Patreon Setup Instructions</h3>
                    <div className="text-blue-200 text-sm space-y-2">
                      <p><strong>1.</strong> Go to <a href="https://www.patreon.com/portal/registration/register-clients" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Patreon Developer Portal</a></p>
                      <p><strong>2.</strong> Create a new client application</p>
                      <p><strong>3.</strong> Set redirect URI to: <code className="bg-blue-500/20 px-1 rounded">{patreonService.getRedirectUri()}</code></p>
                      <p><strong>4.</strong> Copy your Client ID and Client Secret</p>
                      <p><strong>5.</strong> Create a <code className="bg-blue-500/20 px-1 rounded">.env</code> file with your credentials</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patreon Tiers */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h3 className="text-xl font-bold text-white mb-4">DHR Patreon Tiers</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.values(DHR_PATREON_TIERS).map((tier) => (
                  <div key={tier.id} className="bg-gray-700/30 rounded-lg p-4 border border-orange-400/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{tier.name}</h4>
                      <span className="text-orange-400 font-bold">${(tier.minAmount / 100).toFixed(0)}/mo</span>
                    </div>
                    <div className="space-y-2">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-gray-300 text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patreon Statistics */}
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard 
                icon={Crown} 
                title="Patreon Subscribers" 
                value={stats.patreonSubscribers} 
                color="text-orange-400" 
              />
              <StatCard 
                icon={DollarSign} 
                title="Patreon Revenue" 
                value={`€${Math.round(stats.monthlyRevenue * 0.8)}`} 
                color="text-green-400" 
              />
              <StatCard 
                icon={TrendingUp} 
                title="Growth Rate" 
                value="12%" 
                change="+3%" 
                color="text-blue-400" 
              />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 text-center">
              <BarChart3 className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">
                Detailed analytics dashboard coming soon. This will include revenue tracking, 
                user engagement metrics, subscription trends, and more.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 text-center">
              <Settings className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Admin Settings</h3>
              <p className="text-gray-400">
                Configuration options for DHR admin panel, API keys, webhook settings, 
                and system preferences will be available here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
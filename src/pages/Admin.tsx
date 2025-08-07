import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, Users, BarChart3, Shield, Crown, Save, 
  RefreshCw, Eye, EyeOff, Globe, Search, Image,
  FileText, Tag, Link as LinkIcon, Palette, Code
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SEOSettings {
  [pagePath: string]: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
    canonicalUrl: string;
    robots: string;
    customMeta: string;
  };
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [gameSettings, setGameSettings] = useState<any>({});
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({});
  const [selectedPage, setSelectedPage] = useState('/');
  const [loading, setLoading] = useState(false);

  // Default SEO settings for all pages
  const defaultSEOSettings = {
    '/': {
      title: 'CharliesOdds - Advanced Demo Casino Platform | Free Casino Games',
      description: 'Experience the most advanced demo casino with 6 unique games, professional auto-betting, and real-time analytics. Start with $1,000 free balance!',
      keywords: 'demo casino, free casino games, dice game, crash game, blackjack, plinko, auto betting, casino strategy',
      ogTitle: 'CharliesOdds - The Ultimate Demo Casino Experience',
      ogDescription: 'Master casino games risk-free with advanced auto-betting and professional analytics tools.',
      ogImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
      twitterTitle: 'CharliesOdds - Advanced Demo Casino',
      twitterDescription: 'Free casino games with professional features',
      twitterImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
      canonicalUrl: 'https://charliesodds.com/',
      robots: 'index, follow',
      customMeta: ''
    },
    '/dice': {
      title: 'Dice Game - CharliesOdds | Customizable Odds & Auto-Betting',
      description: 'Play dice games with customizable win chances from 1% to 95%. Advanced auto-betting with Martingale, Fibonacci strategies and real-time analytics.',
      keywords: 'dice game, casino dice, auto betting, martingale strategy, fibonacci betting, dice odds',
      ogTitle: 'Advanced Dice Game with Auto-Betting',
      ogDescription: 'Customizable odds, professional strategies, and detailed analytics.',
      ogImage: 'https://images.pexels.com/photos/37534/cube-six-gambling-play-37534.jpeg',
      twitterTitle: 'Dice Game - CharliesOdds',
      twitterDescription: 'Advanced dice gaming with auto-betting',
      twitterImage: 'https://images.pexels.com/photos/37534/cube-six-gambling-play-37534.jpeg',
      canonicalUrl: 'https://charliesodds.com/dice',
      robots: 'index, follow',
      customMeta: ''
    },
    '/crash': {
      title: 'Crash Game - CharliesOdds | Multiplier Betting & Auto-Cashout',
      description: 'Experience crash games with auto-cashout, multiplier betting, and advanced strategies. Watch multipliers rise and cash out at the perfect time.',
      keywords: 'crash game, multiplier betting, auto cashout, crash strategy, casino crash',
      ogTitle: 'Crash Game with Auto-Cashout',
      ogDescription: 'Advanced crash gaming with professional auto-cashout features.',
      ogImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
      twitterTitle: 'Crash Game - CharliesOdds',
      twitterDescription: 'Multiplier betting with auto-cashout',
      twitterImage: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg',
      canonicalUrl: 'https://charliesodds.com/crash',
      robots: 'index, follow',
      customMeta: ''
    }
    // Add more pages as needed
  };

  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/dice', name: 'Dice Game' },
    { path: '/limbo', name: 'Limbo Game' },
    { path: '/crash', name: 'Crash Game' },
    { path: '/blackjack', name: 'Blackjack Game' },
    { path: '/plinko', name: 'Plinko Game' },
    { path: '/spin-wheel', name: 'Spin Wheel Game' },
    { path: '/analytics', name: 'Analytics Page' },
    { path: '/profile', name: 'Profile Page' },
    { path: '/earn-balance', name: 'Earn Balance Page' },
    { path: '/suggestions', name: 'Suggestions Page' },
    { path: '/changelog', name: 'Changelog Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/register', name: 'Register Page' }
  ];

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    
    loadAdminData();
    loadSEOSettings();
  }, [user, navigate]);

  const loadAdminData = async () => {
    if (!supabase) return;
    
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersData) setUsers(usersData);

      // Load game settings
      const savedGameSettings = localStorage.getItem('charlies-odds-admin-game-settings');
      if (savedGameSettings) {
        setGameSettings(JSON.parse(savedGameSettings));
      } else {
        // Default game settings
        const defaultSettings = {
          dice: { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 1 },
          limbo: { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 1 },
          crash: { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 1 },
          blackjack: { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 0.5 },
          plinko: { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 2 },
          'spin-wheel': { enabled: true, minBet: 0.01, maxBet: 1000, houseEdge: 5 }
        };
        setGameSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadSEOSettings = () => {
    const savedSEO = localStorage.getItem('charlies-odds-seo-settings');
    if (savedSEO) {
      setSeoSettings(JSON.parse(savedSEO));
    } else {
      setSeoSettings(defaultSEOSettings);
      localStorage.setItem('charlies-odds-seo-settings', JSON.stringify(defaultSEOSettings));
    }
  };

  const updateGameSetting = (game: string, setting: string, value: any) => {
    const updatedSettings = {
      ...gameSettings,
      [game]: {
        ...gameSettings[game],
        [setting]: value
      }
    };
    setGameSettings(updatedSettings);
    localStorage.setItem('charlies-odds-admin-game-settings', JSON.stringify(updatedSettings));
  };

  const updateSEOSetting = (page: string, field: string, value: string) => {
    const updatedSEO = {
      ...seoSettings,
      [page]: {
        ...seoSettings[page],
        [field]: value
      }
    };
    setSeoSettings(updatedSEO);
  };

  const saveSEOSettings = () => {
    localStorage.setItem('charlies-odds-seo-settings', JSON.stringify(seoSettings));
    
    // Update document head for current page
    updatePageSEO();
    
    alert('SEO settings saved successfully!');
  };

  const updatePageSEO = () => {
    const currentPageSEO = seoSettings[window.location.pathname] || seoSettings['/'];
    
    // Update title
    document.title = currentPageSEO.title;
    
    // Update meta tags
    updateMetaTag('description', currentPageSEO.description);
    updateMetaTag('keywords', currentPageSEO.keywords);
    updateMetaTag('robots', currentPageSEO.robots);
    
    // Update Open Graph tags
    updateMetaTag('og:title', currentPageSEO.ogTitle, 'property');
    updateMetaTag('og:description', currentPageSEO.ogDescription, 'property');
    updateMetaTag('og:image', currentPageSEO.ogImage, 'property');
    updateMetaTag('og:url', currentPageSEO.canonicalUrl, 'property');
    updateMetaTag('og:type', 'website', 'property');
    
    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', currentPageSEO.twitterTitle, 'name');
    updateMetaTag('twitter:description', currentPageSEO.twitterDescription, 'name');
    updateMetaTag('twitter:image', currentPageSEO.twitterImage, 'name');
    
    // Update canonical URL
    updateLinkTag('canonical', currentPageSEO.canonicalUrl);
  };

  const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  const updateLinkTag = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!element) {
      element = document.createElement('link');
      element.rel = rel;
      document.head.appendChild(element);
    }
    element.href = href;
  };

  const currentPageSEO = seoSettings[selectedPage] || {
    title: '', description: '', keywords: '', ogTitle: '', ogDescription: '', 
    ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '',
    canonicalUrl: '', robots: 'index, follow', customMeta: ''
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need admin privileges to access this page.</p>
          <Link
            to="/"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400">Manage CharliesOdds platform settings and users</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">{users.length}</div>
              <div className="text-gray-400 text-sm">Total Users</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800 rounded-2xl mb-8 border border-gray-700">
          <div className="flex flex-wrap border-b border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'games', label: 'Game Settings', icon: <Settings className="w-4 h-4" /> },
              { id: 'seo', label: 'SEO Management', icon: <Globe className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-900 rounded-xl p-6 text-center">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-gray-400 text-sm">Total Users</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-6 text-center">
                    <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">6</div>
                    <div className="text-gray-400 text-sm">Active Games</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-6 text-center">
                    <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{Object.keys(seoSettings).length}</div>
                    <div className="text-gray-400 text-sm">SEO Pages</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-6 text-center">
                    <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-gray-400 text-sm">Uptime</div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {users.map((userData) => (
                          <tr key={userData.id} className="hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-bold text-sm">
                                    {userData.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-white font-medium">{userData.username}</div>
                                  <div className="text-gray-400 text-sm">{userData.email || 'No email'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              ${userData.balance?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-purple-400 font-semibold">
                                {userData.level || 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                              {new Date(userData.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {userData.is_admin ? (
                                <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">Admin</span>
                              ) : (
                                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">User</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Game Settings Tab */}
            {activeTab === 'games' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Game Configuration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(gameSettings).map(([game, settings]: [string, any]) => (
                    <div key={game} className="bg-gray-900 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-bold text-white mb-4 capitalize">{game.replace('-', ' ')}</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Enabled</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.enabled}
                              onChange={(e) => updateGameSetting(game, 'enabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Min Bet ($)</label>
                          <input
                            type="number"
                            value={settings.minBet}
                            onChange={(e) => updateGameSetting(game, 'minBet', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            min="0.01"
                            step="0.01"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Max Bet ($)</label>
                          <input
                            type="number"
                            value={settings.maxBet}
                            onChange={(e) => updateGameSetting(game, 'maxBet', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            min="1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">House Edge (%)</label>
                          <input
                            type="number"
                            value={settings.houseEdge}
                            onChange={(e) => updateGameSetting(game, 'houseEdge', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Management Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Globe className="w-8 h-8 text-blue-400 mr-3" />
                    SEO Management
                  </h2>
                  <button
                    onClick={saveSEOSettings}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save All SEO Settings
                  </button>
                </div>
                
                {/* Page Selection */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-4">Select Page to Edit</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {pages.map((page) => (
                      <button
                        key={page.path}
                        onClick={() => setSelectedPage(page.path)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedPage === page.path
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEO Form */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-lg font-bold text-white mb-6">
                    SEO Settings for: <span className="text-yellow-400">{pages.find(p => p.path === selectedPage)?.name}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic SEO */}
                    <div className="space-y-6">
                      <h4 className="text-white font-semibold flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-400" />
                        Basic SEO
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Page Title</label>
                        <input
                          type="text"
                          value={currentPageSEO.title}
                          onChange={(e) => updateSEOSetting(selectedPage, 'title', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Page title (50-60 characters)"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          Length: {currentPageSEO.title.length}/60 characters
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
                        <textarea
                          value={currentPageSEO.description}
                          onChange={(e) => updateSEOSetting(selectedPage, 'description', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 h-24 resize-none"
                          placeholder="Meta description (150-160 characters)"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          Length: {currentPageSEO.description.length}/160 characters
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Keywords</label>
                        <input
                          type="text"
                          value={currentPageSEO.keywords}
                          onChange={(e) => updateSEOSetting(selectedPage, 'keywords', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Canonical URL</label>
                        <input
                          type="url"
                          value={currentPageSEO.canonicalUrl}
                          onChange={(e) => updateSEOSetting(selectedPage, 'canonicalUrl', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="https://charliesodds.com/page"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Robots</label>
                        <select
                          value={currentPageSEO.robots}
                          onChange={(e) => updateSEOSetting(selectedPage, 'robots', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          <option value="index, follow">Index, Follow</option>
                          <option value="noindex, follow">No Index, Follow</option>
                          <option value="index, nofollow">Index, No Follow</option>
                          <option value="noindex, nofollow">No Index, No Follow</option>
                        </select>
                      </div>
                    </div>

                    {/* Social Media SEO */}
                    <div className="space-y-6">
                      <h4 className="text-white font-semibold flex items-center">
                        <Palette className="w-5 h-5 mr-2 text-green-400" />
                        Social Media & Open Graph
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Open Graph Title</label>
                        <input
                          type="text"
                          value={currentPageSEO.ogTitle}
                          onChange={(e) => updateSEOSetting(selectedPage, 'ogTitle', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Title for social media sharing"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Open Graph Description</label>
                        <textarea
                          value={currentPageSEO.ogDescription}
                          onChange={(e) => updateSEOSetting(selectedPage, 'ogDescription', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 h-20 resize-none"
                          placeholder="Description for social media sharing"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Open Graph Image URL</label>
                        <input
                          type="url"
                          value={currentPageSEO.ogImage}
                          onChange={(e) => updateSEOSetting(selectedPage, 'ogImage', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Title</label>
                        <input
                          type="text"
                          value={currentPageSEO.twitterTitle}
                          onChange={(e) => updateSEOSetting(selectedPage, 'twitterTitle', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Title for Twitter sharing"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Description</label>
                        <textarea
                          value={currentPageSEO.twitterDescription}
                          onChange={(e) => updateSEOSetting(selectedPage, 'twitterDescription', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 h-20 resize-none"
                          placeholder="Description for Twitter sharing"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Image URL</label>
                        <input
                          type="url"
                          value={currentPageSEO.twitterImage}
                          onChange={(e) => updateSEOSetting(selectedPage, 'twitterImage', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Custom Meta Tags */}
                  <div className="mt-8">
                    <h4 className="text-white font-semibold mb-4 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-purple-400" />
                      Custom Meta Tags
                    </h4>
                    <textarea
                      value={currentPageSEO.customMeta}
                      onChange={(e) => updateSEOSetting(selectedPage, 'customMeta', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 h-32 resize-none font-mono text-sm"
                      placeholder='<meta name="custom" content="value">
<link rel="custom" href="url">'
                    />
                    <div className="text-xs text-gray-400 mt-2">
                      Add custom meta tags, link tags, or other head elements (one per line)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
import React from 'react';
import { Crown, Play, Download, Star, Clock, Users } from 'lucide-react';
import MediaPlayer from '../components/MediaPlayer';
import SubscriptionGate from '../components/SubscriptionGate';
import { subscriptionService } from '../services/subscriptionService';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const DHR1Page: React.FC = () => {
  const canAccess = subscriptionService.canAccessContent('dhr1');
  const canDownload = subscriptionService.canDownload();
  const currentUser = subscriptionService.getCurrentUser();

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const features = [
    {
      icon: Star,
      title: 'Premium Quality',
      description: '320kbps high-quality streaming for the best audio experience'
    },
    {
      icon: Clock,
      title: '24/7 Curated',
      description: 'Hand-picked deep house tracks playing around the clock'
    },
    {
      icon: Users,
      title: 'Exclusive Content',
      description: 'Access to premium-only tracks and exclusive DJ sets'
    },
    {
      icon: Download,
      title: 'Offline Access',
      description: canDownload ? 'Download select tracks for offline listening' : 'Available with subscription'
    }
  ];

  const recentTracks = [
    {
      title: 'Midnight City',
      artist: 'Deep House Collective',
      time: '2 mins ago',
      artwork: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      title: 'Ocean Waves',
      artist: 'Sunset Vibes',
      time: '8 mins ago',
      artwork: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      title: 'Urban Nights',
      artist: 'City Sounds',
      time: '15 mins ago',
      artwork: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  const handleDownload = (trackTitle: string) => {
    if (!canDownload) {
      alert('Download feature requires a premium subscription. Please upgrade to access downloads.');
      return;
    }
    // Handle download logic here
    console.log(`Downloading: ${trackTitle}`);
    alert(`Starting download: ${trackTitle}`);
  };

  return (
    <SubscriptionGate requiredTier="premium" contentType="dhr1">
      <div className="min-h-screen text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <img 
                  src={DHR_LOGO_URL} 
                  alt="DHR Logo"
                  className="h-20 w-20 rounded-2xl shadow-2xl border-2 border-orange-400/50"
                  onError={handleArtworkError}
                />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-2">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                  DHR1 Premium
                </h1>
                <p className="text-xl text-gray-300 mt-2">The finest deep house selection</p>
                {currentUser && (
                  <p className="text-sm text-orange-300 mt-1">
                    Welcome back, {currentUser.username}!
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm max-w-2xl mx-auto">
              <p className="text-lg text-gray-200 leading-relaxed">
                Experience premium deep house music with our carefully curated DHR1 channel. 
                Featuring underground gems, exclusive tracks, and the smoothest vibes 24/7.
              </p>
            </div>
          </header>

          {/* Premium Player */}
          <section className="mb-12">
            <MediaPlayer 
              streamUrl="https://ec1.everestcast.host:2776/stream" 
              title="DHR1 Premium Stream"
            />
          </section>

          {/* Features Grid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              Premium Features
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isDownloadFeature = feature.icon === Download;
                return (
                  <div
                    key={index}
                    className={`bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-200 group ${
                      isDownloadFeature && !canDownload 
                        ? 'border-gray-600/30 opacity-60' 
                        : 'border-orange-400/20 hover:border-orange-400/40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                      isDownloadFeature && !canDownload
                        ? 'bg-gray-600'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recently Played */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              Recently Played on DHR1
            </h2>
            
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/20">
              <div className="space-y-4">
                {recentTracks.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-orange-400/10 hover:border-orange-400/30 transition-all duration-200 group"
                  >
                    <img 
                      src={track.artwork} 
                      alt={`${track.title} artwork`}
                      className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform"
                      onError={handleArtworkError}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-orange-200">{track.artist}</p>
                      <p className="text-sm text-gray-400">{track.time}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-all duration-200 opacity-0 group-hover:opacity-100">
                        <Play className="h-4 w-4 text-orange-300" />
                      </button>
                      <button 
                        onClick={() => handleDownload(track.title)}
                        className={`p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          canDownload 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300' 
                            : 'bg-gray-600/50 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!canDownload}
                        title={canDownload ? 'Download track' : 'Premium subscription required'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Google Ads Placeholder */}
          <section className="mb-12">
            <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
              <div className="text-gray-500 text-sm mb-2">Advertisement</div>
              <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Google Ads Space - Premium Content</span>
              </div>
            </div>
          </section>

          {/* Subscription CTA */}
          {!canAccess && (
            <section className="text-center">
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-3xl p-12 border border-orange-400/30 backdrop-blur-sm">
                <Crown className="h-16 w-16 text-orange-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold mb-6 text-white">
                  Upgrade to Premium
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Get unlimited access to DHR1 Premium with high-quality streaming, 
                  exclusive content, and ad-free listening experience.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <a
                    href="https://www.patreon.com/c/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Crown className="h-6 w-6" />
                    <span>Subscribe Now</span>
                  </a>
                  <button className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/30">
                    <Play className="h-6 w-6 text-orange-400" />
                    <span>Try Free Preview</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </SubscriptionGate>
  );
};

export default DHR1Page;
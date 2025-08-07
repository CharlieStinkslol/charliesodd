import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, DollarSign, Gamepad2, 
  Clock, Trophy, Star, Calendar, Zap, Shield, Crown, Award, Users,
  ArrowUp, ArrowDown, Activity, PieChart, LineChart, Filter,
  Download, RefreshCw, Eye, Settings, Flame, Gem, Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import RecentBets from '../components/RecentBets';

const Analytics = () => {
  const { user, formatCurrency } = useAuth();
  const { bets, stats } = useGame();
  const [timeFilter, setTimeFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('profit');
  
  // Use user stats from auth context if available, otherwise fall back to game context
  const displayStats = user?.stats ? {
    totalBets: user.stats.totalBets,
    totalWins: user.stats.totalWins,
    totalLosses: user.stats.totalLosses,
    totalWagered: user.stats.totalWagered,
    totalWon: user.stats.totalWon,
    biggestWin: user.stats.biggestWin,
    biggestLoss: user.stats.biggestLoss,
    winRate: user.stats.totalBets > 0 ? (user.stats.totalWins / user.stats.totalBets) * 100 : 0
  } : stats;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your analytics.</p>
          <Link
            to="/login"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const profitLoss = displayStats.totalWon - displayStats.totalWagered;
  
  // Calculate additional advanced stats
  const averageBet = displayStats.totalBets > 0 ? displayStats.totalWagered / displayStats.totalBets : 0;
  const averageWin = displayStats.totalWins > 0 ? displayStats.totalWon / displayStats.totalWins : 0;
  const averageLoss = displayStats.totalLosses > 0 ? (displayStats.totalWagered - displayStats.totalWon) / displayStats.totalLosses : 0;
  const roi = displayStats.totalWagered > 0 ? ((displayStats.totalWon - displayStats.totalWagered) / displayStats.totalWagered) * 100 : 0;
  const profitFactor = displayStats.totalLosses > 0 ? displayStats.totalWon / (displayStats.totalWagered - displayStats.totalWon) : 0;
  
  // Game distribution and analysis
  const gameDistribution = bets.reduce((acc, bet) => {
    acc[bet.game] = (acc[bet.game] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const gameProfit = bets.reduce((acc, bet) => {
    const profit = bet.winAmount - bet.betAmount;
    acc[bet.game] = (acc[bet.game] || 0) + profit;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteGame = Object.keys(gameDistribution).length > 0 
    ? Object.keys(gameDistribution).reduce((a, b) => gameDistribution[a] > gameDistribution[b] ? a : b)
    : 'None';

  const mostProfitableGame = Object.keys(gameProfit).length > 0
    ? Object.keys(gameProfit).reduce((a, b) => gameProfit[a] > gameProfit[b] ? a : b)
    : 'None';

  // Time-based analysis
  const last24Hours = bets.filter(bet => 
    Date.now() - bet.timestamp.getTime() < 24 * 60 * 60 * 1000
  );
  const last7Days = bets.filter(bet => 
    Date.now() - bet.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
  );
  const last30Days = bets.filter(bet => 
    Date.now() - bet.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
  );

  // Streak analysis
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let isWinStreak = true;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  bets.forEach((bet, index) => {
    const isWin = bet.winAmount > bet.betAmount;
    
    if (index === 0) {
      isWinStreak = isWin;
      currentStreak = 1;
      if (isWin) tempWinStreak = 1;
      else tempLossStreak = 1;
    } else {
      if (isWin === isWinStreak) {
        currentStreak++;
        if (isWin) tempWinStreak++;
        else tempLossStreak++;
      } else {
        if (isWinStreak) {
          longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
          tempWinStreak = 0;
          tempLossStreak = 1;
        } else {
          longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
          tempLossStreak = 0;
          tempWinStreak = 1;
        }
        isWinStreak = isWin;
        currentStreak = 1;
      }
    }
  });

  // Update final streaks
  if (isWinStreak) {
    longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
  } else {
    longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
  }

  // Performance metrics
  const performanceMetrics = [
    {
      label: 'Sharpe Ratio',
      value: roi > 0 ? (roi / 10).toFixed(2) : '0.00', // Simplified calculation
      description: 'Risk-adjusted return measure',
      color: roi > 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Profit Factor',
      value: profitFactor.toFixed(2),
      description: 'Gross profit / Gross loss',
      color: profitFactor > 1 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Kelly Criterion',
      value: displayStats.winRate > 0 ? ((displayStats.winRate / 100 * 2 - 1) * 100).toFixed(1) + '%' : '0%',
      description: 'Optimal bet size percentage',
      color: 'text-blue-400'
    },
    {
      label: 'Volatility Index',
      value: displayStats.totalBets > 0 ? (Math.sqrt(displayStats.totalBets) / 10).toFixed(1) : '0',
      description: 'Measure of result variance',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with User Info */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8 mb-8 border border-gray-600">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center relative">
                <User className="w-8 h-8 text-white" />
                <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {user.level}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{user.username}'s Analytics</h1>
                <p className="text-gray-400">Comprehensive gaming performance analysis</p>
                <div className="flex items-center mt-2 space-x-4">
                  {user.isAdmin && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                  )}
                  <span className="text-purple-400 font-semibold text-sm">
                    Level {user.level} Player
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {formatCurrency(user.balance)}
                </div>
                <div className="text-gray-400 text-sm">Current Balance</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                </div>
                <div className="text-gray-400 text-sm">All-Time P&L</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Filters:</span>
              </div>
              
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Games</option>
                <option value="Dice">Dice</option>
                <option value="Limbo">Limbo</option>
                <option value="Crash">Crash</option>
                <option value="Blackjack">Blackjack</option>
                <option value="Plinko">Plinko</option>
                <option value="Spin Wheel">Spin Wheel</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{displayStats.totalBets}</div>
                <div className="text-sm text-gray-400">Total Bets</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Avg per day: {displayStats.totalBets > 0 ? Math.round(displayStats.totalBets / 30) : 0}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{displayStats.winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
            </div>
            <div className="flex items-center text-xs">
              {displayStats.winRate > 50 ? (
                <ArrowUp className="w-3 h-3 text-green-400 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-400 mr-1" />
              )}
              <span className={displayStats.winRate > 50 ? 'text-green-400' : 'text-red-400'}>
                {displayStats.winRate > 50 ? 'Above' : 'Below'} average
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{formatCurrency(displayStats.totalWagered)}</div>
                <div className="text-sm text-gray-400">Total Wagered</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Avg bet: {formatCurrency(averageBet)}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${profitLoss >= 0 ? 'bg-green-600' : 'bg-red-600'} rounded-xl flex items-center justify-center`}>
                {profitLoss >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-white" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                </div>
                <div className="text-sm text-gray-400">Net Profit</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              ROI: {roi.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Advanced Performance Metrics */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Activity className="w-8 h-8 text-purple-400 mr-3" />
            Advanced Performance Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${metric.color} mb-2`}>
                  {metric.value}
                </div>
                <div className="text-white font-medium text-sm mb-1">{metric.label}</div>
                <div className="text-xs text-gray-400">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Betting Patterns */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-400 mr-2" />
              Betting Patterns
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Bet Size</span>
                <span className="text-white font-semibold">{formatCurrency(averageBet)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Largest Single Bet</span>
                <span className="text-yellow-400 font-semibold">
                  {bets.length > 0 ? formatCurrency(Math.max(...bets.map(b => b.betAmount))) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Smallest Single Bet</span>
                <span className="text-gray-400 font-semibold">
                  {bets.length > 0 ? formatCurrency(Math.min(...bets.map(b => b.betAmount))) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Bet Size Variance</span>
                <span className="text-purple-400 font-semibold">
                  {bets.length > 1 ? 
                    formatCurrency(Math.sqrt(bets.reduce((acc, bet) => acc + Math.pow(bet.betAmount - averageBet, 2), 0) / bets.length))
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Win/Loss Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
              Win/Loss Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Win Amount</span>
                <span className="text-green-400 font-semibold">{formatCurrency(averageWin)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Loss Amount</span>
                <span className="text-red-400 font-semibold">{formatCurrency(averageLoss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Biggest Single Win</span>
                <span className="text-green-400 font-semibold">{formatCurrency(displayStats.biggestWin)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Biggest Single Loss</span>
                <span className="text-red-400 font-semibold">{formatCurrency(Math.abs(displayStats.biggestLoss))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Analysis */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Flame className="w-8 h-8 text-orange-400 mr-3" />
            Streak Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className={`text-4xl font-bold mb-2 ${isWinStreak ? 'text-green-400' : 'text-red-400'}`}>
                {currentStreak}
              </div>
              <div className="text-white font-medium mb-1">
                Current {isWinStreak ? 'Win' : 'Loss'} Streak
              </div>
              <div className="text-xs text-gray-400">
                {isWinStreak ? 'Keep it going!' : 'Turn it around!'}
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">{longestWinStreak}</div>
              <div className="text-white font-medium mb-1">Longest Win Streak</div>
              <div className="text-xs text-gray-400">Personal best</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">{longestLossStreak}</div>
              <div className="text-white font-medium mb-1">Longest Loss Streak</div>
              <div className="text-xs text-gray-400">Overcome adversity</div>
            </div>
          </div>
        </div>

        {/* Game Performance Breakdown */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Gamepad2 className="w-8 h-8 text-green-400 mr-3" />
            Game Performance Breakdown
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(gameDistribution).map(([game, count]) => {
              const gameProfit = bets
                .filter(bet => bet.game === game)
                .reduce((acc, bet) => acc + (bet.winAmount - bet.betAmount), 0);
              const gameWins = bets.filter(bet => bet.game === game && bet.winAmount > bet.betAmount).length;
              const gameWinRate = count > 0 ? (gameWins / count) * 100 : 0;
              
              return (
                <div key={game} className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-white">{game}</h4>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      gameProfit > 0 ? 'bg-green-600 text-white' : 
                      gameProfit < 0 ? 'bg-red-600 text-white' : 
                      'bg-gray-600 text-white'
                    }`}>
                      {gameProfit > 0 ? 'Profitable' : gameProfit < 0 ? 'Losing' : 'Break Even'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Games Played:</span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className={`font-semibold ${gameWinRate > 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {gameWinRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Net Profit:</span>
                      <span className={`font-semibold ${gameProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gameProfit >= 0 ? '+' : ''}{formatCurrency(gameProfit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(count / displayStats.totalBets) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      {((count / displayStats.totalBets) * 100).toFixed(1)}% of total activity
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time-based Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Calendar className="w-6 h-6 text-blue-400 mr-2" />
              Activity Timeline
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Last 24 Hours</span>
                  <span className="text-yellow-400 font-bold">{last24Hours.length} bets</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((last24Hours.length / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Last 7 Days</span>
                  <span className="text-yellow-400 font-bold">{last7Days.length} bets</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((last7Days.length / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Last 30 Days</span>
                  <span className="text-yellow-400 font-bold">{last30Days.length} bets</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min((last30Days.length / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-6 h-6 text-red-400 mr-2" />
              Risk Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Risk Level</span>
                  <span className={`font-bold ${
                    averageBet / user.balance > 0.1 ? 'text-red-400' :
                    averageBet / user.balance > 0.05 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {averageBet / user.balance > 0.1 ? 'High' :
                     averageBet / user.balance > 0.05 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Bet Size vs Balance</span>
                  <span className="text-white font-semibold">
                    {((averageBet / user.balance) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Drawdown</span>
                  <span className="text-red-400 font-semibold">
                    {formatCurrency(Math.abs(displayStats.biggestLoss))}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Recovery Factor</span>
                  <span className="text-purple-400 font-semibold">
                    {displayStats.biggestLoss < 0 ? (displayStats.biggestWin / Math.abs(displayStats.biggestLoss)).toFixed(2) : '∞'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements & Milestones */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Award className="w-8 h-8 text-yellow-400 mr-3" />
            Achievements & Milestones
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Gem className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{user.level}</div>
              <div className="text-sm text-gray-400">Current Level</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{user.experience}</div>
              <div className="text-sm text-gray-400">Total Experience</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">
                {Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - Math.floor(new Date(user.createdAt).getTime() / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-400">Days Playing</div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">
                {displayStats.totalBets > 1000 ? 'Elite' : 
                 displayStats.totalBets > 500 ? 'Expert' :
                 displayStats.totalBets > 100 ? 'Experienced' : 'Beginner'}
              </div>
              <div className="text-sm text-gray-400">Player Tier</div>
            </div>
          </div>
        </div>

        {/* Recent Bets with Enhanced Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentBets bets={bets} formatCurrency={formatCurrency} maxBets={15} />

          {/* Session Summary */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Clock className="w-6 h-6 text-purple-400 mr-2" />
              Session Summary
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Today's Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bets Placed:</span>
                    <span className="text-white">{last24Hours.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit/Loss:</span>
                    <span className={`${
                      last24Hours.reduce((acc, bet) => acc + (bet.winAmount - bet.betAmount), 0) >= 0 
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(last24Hours.reduce((acc, bet) => acc + (bet.winAmount - bet.betAmount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-yellow-400">
                      {last24Hours.length > 0 ? 
                        ((last24Hours.filter(bet => bet.winAmount > bet.betAmount).length / last24Hours.length) * 100).toFixed(1) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Favorite Game</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">{favoriteGame}</div>
                  <div className="text-sm text-gray-400">
                    {gameDistribution[favoriteGame] || 0} games played
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Most Profitable</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{mostProfitableGame}</div>
                  <div className="text-sm text-gray-400">
                    {formatCurrency(gameProfit[mostProfitableGame] || 0)} profit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
            Performance Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Key Insights</h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  You've placed <span className="text-yellow-400 font-semibold">{displayStats.totalBets}</span> bets 
                  with a <span className="text-green-400 font-semibold">{displayStats.winRate.toFixed(1)}%</span> win rate.
                </p>
                <p>
                  Your current profit/loss is <span className={`font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(profitLoss)}</span> with an average bet of <span className="text-blue-400 font-semibold">{formatCurrency(averageBet)}</span>.
                </p>
                {favoriteGame !== 'None' && (
                  <p>
                    Your favorite game is <span className="text-purple-400 font-semibold">{favoriteGame}</span>, 
                    which represents <span className="text-yellow-400 font-semibold">
                    {((gameDistribution[favoriteGame] / displayStats.totalBets) * 100).toFixed(1)}%</span> of your total activity.
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Recommendations</h3>
              <div className="space-y-2">
                {roi > 10 && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Excellent ROI! Keep up the great strategy.
                  </div>
                )}
                {displayStats.winRate > 60 && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    High win rate indicates good game selection.
                  </div>
                )}
                {averageBet / user.balance > 0.1 && (
                  <div className="flex items-center text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Consider reducing bet size relative to balance.
                  </div>
                )}
                {longestLossStreak > 10 && (
                  <div className="flex items-center text-yellow-400 text-sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Review strategy during long losing streaks.
                  </div>
                )}
                <div className="flex items-center text-blue-400 text-sm">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Try different games to diversify your experience.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
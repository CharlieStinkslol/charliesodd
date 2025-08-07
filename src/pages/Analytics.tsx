import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Target, DollarSign, Gamepad2, Clock, Trophy, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import RecentBets from '../components/RecentBets';

const Analytics = () => {
  const { user, formatCurrency } = useAuth();
  const { bets, stats } = useGame();
  
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
  
  // Calculate additional stats
  const averageBet = displayStats.totalBets > 0 ? displayStats.totalWagered / displayStats.totalBets : 0;
  const averageWin = displayStats.totalWins > 0 ? displayStats.totalWon / displayStats.totalWins : 0;
  
  // Game distribution
  const gameDistribution = bets.reduce((acc, bet) => {
    acc[bet.game] = (acc[bet.game] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteGame = Object.keys(gameDistribution).length > 0 
    ? Object.keys(gameDistribution).reduce((a, b) => gameDistribution[a] > gameDistribution[b] ? a : b)
    : 'None';

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Track your gaming performance and detailed statistics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bets</p>
              <p className="text-2xl font-bold text-white">{displayStats.totalBets}</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-white">{displayStats.winRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Wagered</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(displayStats.totalWagered)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Profit/Loss</p>
              <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(profitLoss)}
              </p>
            </div>
            {profitLoss >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Average Bet</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(averageBet)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Biggest Win</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(displayStats.biggestWin)}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Favorite Game</p>
              <p className="text-2xl font-bold text-white">{favoriteGame}</p>
            </div>
            <Gamepad2 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Session Time</p>
              <p className="text-2xl font-bold text-white">{bets.length > 0 ? '2h 15m' : '0m'}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Bets */}
        <RecentBets bets={bets} formatCurrency={formatCurrency} maxBets={15} />

        {/* Game Statistics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Detailed Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Biggest Win</span>
              <span className="text-green-400 font-semibold">{formatCurrency(displayStats.biggestWin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Biggest Loss</span>
              <span className="text-red-400 font-semibold">{formatCurrency(Math.abs(displayStats.biggestLoss))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Wins</span>
              <span className="text-white font-semibold">{displayStats.totalWins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Losses</span>
              <span className="text-white font-semibold">{displayStats.totalLosses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Bet</span>
              <span className="text-white font-semibold">
                {formatCurrency(displayStats.totalBets > 0 ? (displayStats.totalWagered / displayStats.totalBets) : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Won</span>
              <span className="text-white font-semibold">{formatCurrency(displayStats.totalWon)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Distribution */}
      {Object.keys(gameDistribution).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Game Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gameDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([game, count]) => (
                <div key={game} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">{game}</span>
                    <span className="text-yellow-400 font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(count / displayStats.totalBets) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {((count / displayStats.totalBets) * 100).toFixed(1)}% of total bets
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Performance Summary</h2>
        <p className="text-gray-300">
          You've placed {displayStats.totalBets} bets with a {displayStats.winRate.toFixed(1)}% win rate. 
          Your current profit/loss is {formatCurrency(profitLoss)} with an average bet of {formatCurrency(averageBet)}.
          {favoriteGame !== 'None' && ` Your favorite game is ${favoriteGame}.`}
        </p>
      </div>
      </div>
    </div>
  );
};

export default Analytics;
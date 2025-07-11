import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, Settings, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';

const Crash = () => {
  const { user, updateBalance, updateStats } = useAuth();
  const { addBet, generateSeededRandom } = useGame();
  
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutAt, setCashOutAt] = useState(2);
  const [autoCashOut, setAutoCashOut] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoBetCount, setAutoBetCount] = useState(0);
  const [maxAutoBets, setMaxAutoBets] = useState(100);
  const [infiniteBet, setInfiniteBet] = useState(false);
  const [autoBetRunning, setAutoBetRunning] = useState(false);
  const [instantBet, setInstantBet] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Profit tracking
  const [sessionProfit, setSessionProfit] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    isWinStreak: true
  });

  const startGame = () => {
    if (!user || betAmount > user.balance) return;

    setIsPlaying(true);
    setCurrentMultiplier(1);
    setCashedOut(false);
    setGameResult(null);
    
    // Generate crash point
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomNum = randomArray[0] / (0xffffffff + 1);
    const crash = Math.max(1.01, Math.pow(Math.E, randomNum * 3));
    setCrashPoint(crash);
    
    // Animate multiplier
    const duration = instantBet ? 100 : Math.min(crash * 1000, 10000);
    const startTime = Date.now();
    
    const animateMultiplier = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Game crashed
        setCurrentMultiplier(crash);
        endGame(false);
        return;
      }
      
      const current = 1 + (crash - 1) * progress;
      setCurrentMultiplier(current);
      
      // Auto cash out
      if (autoCashOut && current >= cashOutAt && !cashedOut) {
        cashOut();
        return;
      }
      
      requestAnimationFrame(animateMultiplier);
    };
    
    animateMultiplier();
  };

  const cashOut = () => {
    if (!isPlaying || cashedOut) return;
    
    setCashedOut(true);
    endGame(true);
  };

  const endGame = (won: boolean) => {
    setIsPlaying(false);
    setGameResult(won ? 'win' : 'lose');
    
    const winAmount = won ? betAmount * currentMultiplier : 0;
    const profit = winAmount - betAmount;
    
    // Update profit tracking
    const newProfit = sessionProfit + profit;
    setSessionProfit(newProfit);
    
    // Update session statistics
    setSessionStats(prev => {
      const newStats = {
        totalBets: prev.totalBets + 1,
        wins: prev.wins + (won ? 1 : 0),
        losses: prev.losses + (won ? 0 : 1),
        currentStreak: prev.isWinStreak === won ? prev.currentStreak + 1 : 1,
        longestWinStreak: prev.longestWinStreak,
        longestLossStreak: prev.longestLossStreak,
        isWinStreak: won
      };
      
      if (won) {
        newStats.longestWinStreak = Math.max(prev.longestWinStreak, newStats.currentStreak);
      } else {
        newStats.longestLossStreak = Math.max(prev.longestLossStreak, newStats.currentStreak);
      }
      
      return newStats;
    });
    
    updateBalance(profit);
    updateStats(betAmount, winAmount);
    
    addBet({
      game: 'Crash',
      betAmount,
      winAmount,
      multiplier: won ? currentMultiplier : 0,
      result: { crashPoint, cashedOutAt: won ? currentMultiplier : null, won },
    });
    
    // Handle auto-betting
    if (isAutoMode && autoBetRunning) {
      setAutoBetCount(prev => prev - 1);
    }
  };

  const startAutoPlay = () => {
    setIsAutoMode(true);
    setAutoBetRunning(true);
    setAutoBetCount(infiniteBet ? Infinity : maxAutoBets);
    setSessionProfit(0);
    setSessionStats({
      totalBets: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      isWinStreak: true
    });
  };

  const stopAutoPlay = () => {
    setIsAutoMode(false);
    setAutoBetRunning(false);
    setAutoBetCount(0);
  };

  useEffect(() => {
    if (isAutoMode && autoBetRunning && (autoBetCount > 0 || infiniteBet) && !isPlaying) {
      const timer = setTimeout(() => {
        startGame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAutoMode, autoBetRunning, autoBetCount, isPlaying]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Panel */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Zap className="w-8 h-8 text-red-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">Crash</h1>
            </div>
            
            {/* Multiplier Display */}
            <div className="bg-gray-900 rounded-lg p-8 mb-6">
              <div className="text-center">
                <div className="text-8xl font-bold text-white mb-4">
                  {currentMultiplier.toFixed(2)}x
                </div>
                
                {/* Fixed height container for result to prevent jumping */}
                <div className="h-12 flex items-center justify-center">
                  {gameResult && (
                    <div className="text-center">
                      <div className="text-base text-gray-300">
                        {gameResult === 'win' ? 'Cashed Out!' : 'Crashed!'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="h-12 flex items-center justify-center relative">
                  {crashPoint > 0 && !isPlaying && (
                    <div className="text-base text-gray-400 absolute">
                      Crashed at: {crashPoint.toFixed(2)}x
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Statistics Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{sessionStats.totalBets}</div>
                <div className="text-xs text-gray-400">Total Bets</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{sessionStats.wins}</div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{sessionStats.losses}</div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className={`text-lg font-bold ${sessionProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${sessionProfit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">Session Profit</div>
              </div>
            </div>
            
            {/* Streaks */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className={`text-lg font-bold ${sessionStats.isWinStreak ? 'text-green-400' : 'text-red-400'}`}>
                  {sessionStats.currentStreak}
                </div>
                <div className="text-xs text-gray-400">
                  Current {sessionStats.isWinStreak ? 'Win' : 'Loss'} Streak
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{sessionStats.longestWinStreak}</div>
                <div className="text-xs text-gray-400">Best Win Streak</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{sessionStats.longestLossStreak}</div>
                <div className="text-xs text-gray-400">Worst Loss Streak</div>
              </div>
            </div>
            
            {/* Auto Cash Out */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCashOut}
                    onChange={(e) => setAutoCashOut(e.target.checked)}
                    className="mr-2"
                    disabled={isPlaying}
                  />
                  <span className="text-white">Auto Cash Out</span>
                </label>
                {autoCashOut && (
                  <input
                    type="number"
                    value={cashOutAt}
                    onChange={(e) => setCashOutAt(Math.max(1.01, Number(e.target.value)))}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white w-20"
                    min="1.01"
                    step="0.01"
                    disabled={isPlaying}
                  />
                )}
              </div>
              
              {isPlaying && !cashedOut && (
                <button
                  onClick={cashOut}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl transition-colors text-xl shadow-lg transform hover:scale-105"
                >
                  💰 CASH OUT: ${(betAmount * currentMultiplier).toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Betting Panel */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Place Your Bet</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                min="0.01"
                step="0.01"
                disabled={isPlaying}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setBetAmount(prev => prev / 2)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isPlaying}
              >
                1/2
              </button>
              <button
                onClick={() => setBetAmount(prev => prev * 2)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isPlaying}
              >
                2x
              </button>
            </div>
            
            {user && (
              <div className="mb-4 text-sm text-gray-400">
                Balance: ${user.balance.toFixed(2)}
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={startGame}
                disabled={isPlaying || !user || betAmount > user.balance}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isPlaying ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Game
                  </>
                )}
              </button>
              
              {!isAutoMode ? (
                <button
                  onClick={startAutoPlay}
                  disabled={isPlaying || !user || betAmount > user.balance}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Start Auto
                </button>
              ) : (
                <button
                  onClick={stopAutoPlay}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Stop Auto ({autoBetCount} left)
                </button>
              )}
            </div>
          </div>
          
          {/* Auto-bet Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Auto-Bet Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Bets
                </label>
                <input
                  type="number"
                  value={maxAutoBets}
                  onChange={(e) => setMaxAutoBets(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  min="1"
                  max="10000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crash;
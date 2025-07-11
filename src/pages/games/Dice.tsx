import React, { useState, useEffect } from 'react';
import { Dice1, Play, Settings, RotateCcw, TrendingUp, TrendingDown, Pause, BarChart3, RefreshCw } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';

const Dice = () => {
  const { addBet, generateSeededRandom } = useGame();
  const { user, updateBalance, updateStats } = useAuth();
  
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(2);
  const [rollUnder, setRollUnder] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  
  // Auto-betting states
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoBetCount, setAutoBetCount] = useState(0);
  const [maxAutoBets, setMaxAutoBets] = useState(100);
  const [infiniteBet, setInfiniteBet] = useState(false);
  const [autoBetRunning, setAutoBetRunning] = useState(false);
  
  // Advanced auto-bet settings
  const [strategy, setStrategy] = useState<'fixed' | 'martingale' | 'fibonacci' | 'labouchere'>('fixed');
  const [onWin, setOnWin] = useState<'reset' | 'increase' | 'decrease'>('reset');
  const [onLoss, setOnLoss] = useState<'reset' | 'increase' | 'decrease'>('increase');
  const [increaseBy, setIncreaseBy] = useState(100); // percentage
  const [decreaseBy, setDecreaseBy] = useState(50); // percentage
  
  // Roll type switching
  const [enableRollSwitch, setEnableRollSwitch] = useState(false);
  const [switchCondition, setSwitchCondition] = useState<'wins' | 'losses' | 'bets'>('wins');
  const [switchCount, setSwitchCount] = useState(3);
  const [currentSwitchCounter, setCurrentSwitchCounter] = useState(0);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);
  
  // Stop conditions
  const [stopOnProfit, setStopOnProfit] = useState(false);
  const [stopProfitAmount, setStopProfitAmount] = useState(100);
  const [stopOnLoss, setStopOnLoss] = useState(false);
  const [stopLossAmount, setStopLossAmount] = useState(100);
  const [stopOnWin, setStopOnWin] = useState(false);
  const [stopOnNextWin, setStopOnNextWin] = useState(false);
  
  // Strategy specific states
  const [baseBet, setBaseBet] = useState(10);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
  const [fibonacciMultiplier, setFibonacciMultiplier] = useState(1);
  const [fibSequence, setFibSequence] = useState([1, 1]);
  const [fibIndex, setFibIndex] = useState(0);
  const [labouchereSequence, setLabouchereSequence] = useState([1, 2, 3, 4]);
  const [currentLabouchere, setCurrentLabouchere] = useState([1, 2, 3, 4]);
  
  // Profit tracking
  const [sessionProfit, setSessionProfit] = useState(0);
  
  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [instantBet, setInstantBet] = useState(false);
  
  // Enhanced statistics
  const [sessionStats, setSessionStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    isWinStreak: true
  });

  // Enhanced profit tracking for graph
  const [profitHistory, setProfitHistory] = useState<{value: number, bet: number}[]>([{value: 0, bet: 0}]);

  // Calculate win chance from multiplier
  const winChance = (100 / multiplier) * 0.99; // 1% house edge
  const targetNumber = rollUnder ? winChance : 100 - winChance;

  const rollDice = async () => {
    if (!user || betAmount > user.balance) return;

    setIsRolling(true);
    setGameResult(null);
    
    // Generate truly random number between 0-99.99 (not using seeded random)
    const result = Math.floor(Math.random() * 10000) / 100;
    
    const processResult = () => {
      setDiceResult(result);
      
      // Determine win/lose
      const isWin = rollUnder ? result < targetNumber : result > targetNumber;
      setGameResult(isWin ? 'win' : 'lose');
      
      // Calculate balance changes
      let balanceChange = -betAmount; // Always lose the bet amount first
      
      if (isWin) {
        const totalWinAmount = betAmount * multiplier;
        balanceChange = totalWinAmount - betAmount; // Net profit
        updateStats(betAmount, totalWinAmount);
      } else {
        updateStats(betAmount, 0);
      }
      
      // Update balance with the net change
      updateBalance(balanceChange);
      
      // Update profit tracking
      const newProfit = sessionProfit + balanceChange;
      setSessionProfit(newProfit);
      setProfitHistory(prev => [...prev.slice(-99), {value: newProfit, bet: sessionStats.totalBets + 1}]); // Keep last 100 points
      
      // Update session statistics
      setSessionStats(prev => {
        const newStats = {
          totalBets: prev.totalBets + 1,
          wins: prev.wins + (isWin ? 1 : 0),
          losses: prev.losses + (isWin ? 0 : 1),
          currentStreak: prev.isWinStreak === isWin ? prev.currentStreak + 1 : 1,
          longestWinStreak: prev.longestWinStreak,
          longestLossStreak: prev.longestLossStreak,
          isWinStreak: isWin
        };
        
        if (isWin) {
          newStats.longestWinStreak = Math.max(prev.longestWinStreak, newStats.currentStreak);
        } else {
          newStats.longestLossStreak = Math.max(prev.longestLossStreak, newStats.currentStreak);
        }
        
        return newStats;
      });
      
      // Handle roll type switching
      if (enableRollSwitch) {
        handleRollTypeSwitch(isWin);
      }
      
      addBet({
        game: 'Dice',
        betAmount,
        winAmount: isWin ? betAmount * multiplier : 0,
        multiplier: isWin ? multiplier : 0,
        result: {
          diceResult: result,
          target: targetNumber,
          rollUnder,
          won: isWin
        },
      });
      
      setIsRolling(false);
      
      // Handle auto-betting
      if (isAutoMode && autoBetRunning) {
        handleAutoBetResult(isWin, balanceChange);
      }
    };
    
    // Use instant bet or normal timing
    const delay = instantBet ? 100 : 1000;
    setTimeout(processResult, delay);
  };

  const handleRollTypeSwitch = (won: boolean) => {
    let shouldIncrement = false;
    
    switch (switchCondition) {
      case 'wins':
        if (won) shouldIncrement = true;
        break;
      case 'losses':
        if (!won) shouldIncrement = true;
        break;
      case 'bets':
        shouldIncrement = true;
        break;
    }
    
    if (shouldIncrement) {
      const newCounter = currentSwitchCounter + 1;
      if (newCounter >= switchCount) {
        setRollUnder(prev => !prev);
        setCurrentSwitchCounter(0);
      } else {
        setCurrentSwitchCounter(newCounter);
      }
    }
  };

  const handleAutoBetResult = (won: boolean, profit: number) => {
    // Check stop on next win
    if (stopOnNextWin && won) {
      stopAutoPlay();
      setStopOnNextWin(false);
      return;
    }
    
    // Check stop conditions
    if (stopOnProfit && sessionProfit >= stopProfitAmount) {
      stopAutoPlay();
      return;
    }
    
    if (stopOnLoss && sessionProfit <= -stopLossAmount) {
      stopAutoPlay();
      return;
    }
    
    // Calculate new bet amount based on strategy
    let newBetAmount = betAmount;
    
    switch (strategy) {
      case 'fixed':
        // Apply win/loss modifiers
        if (won) {
          switch (onWin) {
            case 'increase':
              newBetAmount = betAmount + (betAmount * increaseBy / 100);
              break;
            case 'decrease':
              newBetAmount = betAmount - (betAmount * decreaseBy / 100);
              break;
            case 'reset':
              newBetAmount = baseBet;
              break;
          }
        } else {
          switch (onLoss) {
            case 'increase':
              newBetAmount = betAmount + (betAmount * increaseBy / 100);
              break;
            case 'decrease':
              newBetAmount = betAmount - (betAmount * decreaseBy / 100);
              break;
            case 'reset':
              newBetAmount = baseBet;
              break;
          }
        }
        break;
        
      case 'martingale':
        if (won) {
          newBetAmount = baseBet;
        } else {
          newBetAmount = betAmount * martingaleMultiplier;
        }
        break;
        
      case 'fibonacci':
        if (won) {
          setFibIndex(Math.max(0, fibIndex - 2));
          newBetAmount = baseBet * fibSequence[Math.max(0, fibIndex - 2)];
        } else {
          const nextIndex = fibIndex + 1;
          if (nextIndex >= fibSequence.length) {
            const newFib = fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2];
            setFibSequence(prev => [...prev, newFib]);
          }
          setFibIndex(nextIndex);
          newBetAmount = baseBet * (fibSequence[nextIndex] || 1);
        }
        break;
        
      case 'labouchere':
        if (won) {
          const newSeq = [...currentLabouchere];
          if (newSeq.length > 2) {
            newSeq.shift();
            newSeq.pop();
          }
          setCurrentLabouchere(newSeq);
          newBetAmount = newSeq.length > 0 ? baseBet * (newSeq[0] + (newSeq[newSeq.length - 1] || 0)) : baseBet;
        } else {
          const newSeq = [...currentLabouchere, betAmount / baseBet];
          setCurrentLabouchere(newSeq);
          newBetAmount = baseBet * (newSeq[0] + newSeq[newSeq.length - 1]);
        }
        break;
    }
    
    // Ensure minimum bet
    setBetAmount(Math.max(0.01, newBetAmount));
    setAutoBetCount(prev => prev - 1);
    
    if (autoBetCount <= 1 && !infiniteBet) {
      stopAutoPlay();
    }
  };

  const startAutoPlay = () => {
    setIsAutoMode(true);
    setAutoBetRunning(true);
    setAutoBetCount(infiniteBet ? Infinity : maxAutoBets);
    setBaseBet(betAmount);
    setSessionProfit(0);
    setProfitHistory([{value: 0, bet: 0}]);
    setCurrentSwitchCounter(0);
    
    // Reset strategy states
    setFibIndex(0);
    setCurrentLabouchere([...labouchereSequence]);
  };

  const stopAutoPlay = () => {
    setIsAutoMode(false);
    setAutoBetRunning(false);
    setAutoBetCount(0);
    setStopOnNextWin(false);
  };

  const resetProfitGraph = () => {
    setSessionProfit(0);
    setProfitHistory([{value: 0, bet: 0}]);
    setSessionStats({
      totalBets: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      isWinStreak: true
    });
    setCurrentSwitchCounter(0);
  };

  // Enhanced profit graph component
  const ProfitGraph = () => {
    const values = profitHistory.map(p => p.value);
    const maxProfit = Math.max(...values, 10);
    const minProfit = Math.min(...values, -10);
    const range = maxProfit - minProfit || 20;
    const width = 100;
    const height = 100;
    
    return (
      <div className="relative h-40 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Zero line */}
          <line 
            x1="0" 
            y1={height - ((0 - minProfit) / range) * height} 
            x2={width} 
            y2={height - ((0 - minProfit) / range) * height}
            stroke="#6b7280" 
            strokeWidth="1" 
            strokeDasharray="2,2"
            opacity="0.7"
          />
          
          {/* Profit line */}
          <polyline
            fill="none"
            stroke={sessionProfit >= 0 ? "#10b981" : "#ef4444"}
            strokeWidth="1.5"
            points={profitHistory.map((point, index) => 
              `${(index / Math.max(profitHistory.length - 1, 1)) * width},${height - ((point.value - minProfit) / range) * height}`
            ).join(' ')}
          />
          
          {/* Current point */}
          {profitHistory.length > 1 && (
            <circle
              cx={(profitHistory.length - 1) / Math.max(profitHistory.length - 1, 1) * width}
              cy={height - ((sessionProfit - minProfit) / range) * height}
              r="1.5"
              fill={sessionProfit >= 0 ? "#10b981" : "#ef4444"}
            />
          )}
        </svg>
        
        {/* Labels */}
        <div className="absolute top-2 left-2 text-xs font-semibold bg-gray-800 px-2 py-1 rounded">
          <span className={sessionProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
            ${sessionProfit.toFixed(2)}
          </span>
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          Max: ${maxProfit.toFixed(2)}
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          Min: ${minProfit.toFixed(2)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          {profitHistory.length - 1} bets
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isAutoMode && autoBetRunning && (autoBetCount > 0 || infiniteBet) && !isRolling) {
      const timer = setTimeout(() => {
        rollDice();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAutoMode, autoBetRunning, autoBetCount, isRolling]);

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Login</h1>
          <p className="text-gray-400">You need to be logged in to play games.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Panel */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-6">
              <Dice1 className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">Dice Game</h1>
            </div>
            
            {/* Dice Display */}
            <div className="bg-gray-900 rounded-lg p-8 mb-6">
              <div className="text-center">
                {/* Long Thin Line with Arrow */}
                <div className="relative w-full max-w-96 h-16 mx-auto mb-6 overflow-hidden">
                  {/* Main line */}
                  <div className="absolute top-8 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full min-w-full"></div>
                  
                  {/* Target zone */}
                  <div 
                    className="absolute top-6 h-6 bg-blue-500 bg-opacity-40 border-2 border-blue-400 rounded-full"
                    style={{
                      left: rollUnder ? '0%' : `${100 - winChance}%`,
                      width: `${winChance}%`
                    }}
                  ></div>
                  
                  {/* Arrow indicator with number */}
                  {diceResult !== null && (
                    <div 
                      className="absolute transform -translate-x-1/2 transition-all duration-1000"
                      style={{ left: `${diceResult}%`, top: '-8px' }}
                    >
                      {/* Number above arrow */}
                      <div className={`text-lg font-bold mb-1 ${
                        gameResult === 'win' ? 'border-b-green-400' : 'border-b-red-400'
                      } ${gameResult === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {diceResult.toFixed(2)}
                      </div>
                      {/* Arrow pointing down */}
                      <div className={`w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent ${
                        gameResult === 'win' ? 'border-t-green-400' : 'border-t-red-400'
                      }`}></div>
                      {/* Vertical line */}
                      <div className={`w-1 h-8 mx-auto ${
                        gameResult === 'win' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Scale markers */}
                  <div className="absolute -bottom-4 left-0 text-xs text-gray-400">0</div>
                  <div className="absolute -bottom-4 right-0 text-xs text-gray-400">100</div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">50</div>
                  <div className="absolute -bottom-4 left-1/4 transform -translate-x-1/2 text-xs text-gray-400">25</div>
                  <div className="absolute -bottom-4 right-1/4 transform translate-x-1/2 text-xs text-gray-400">75</div>
                </div>
                
                {/* Fixed height container for result to prevent jumping */}
                <div className="h-8 flex items-center justify-center">
                  {diceResult !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-300">
                        Roll: {diceResult.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-lg text-gray-300">
                  Target: {rollUnder ? 'Under' : 'Over'} {targetNumber.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Game Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Multiplier: {multiplier.toFixed(2)}x (Win Chance: {winChance.toFixed(2)}%)
                </label>
                <input
                  type="range"
                  min="1.01"
                  max="100"
                  step="0.01"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="w-full"
                  disabled={isRolling || autoBetRunning}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1.01x</span>
                  <span>100x</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[1.5, 2, 5, 10].map(mult => (
                    <button
                      key={mult}
                      onClick={() => setMultiplier(mult)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        multiplier === mult 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      disabled={isRolling || autoBetRunning}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Roll Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setRollUnder(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      rollUnder 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={isRolling || autoBetRunning}
                  >
                    Roll Under
                  </button>
                  <button
                    onClick={() => setRollUnder(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !rollUnder 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={isRolling || autoBetRunning}
                  >
                    Roll Over
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg text-yellow-400 font-semibold">
                Payout: {multiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">
                Potential Win: ${(betAmount * multiplier).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Profit Graph */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Live Statistics & Profit Graph
              </h3>
              <button
                onClick={resetProfitGraph}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Reset
              </button>
            </div>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                <div className="text-lg font-bold text-yellow-400">
                  {sessionStats.totalBets > 0 ? ((sessionStats.wins / sessionStats.totalBets) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
            </div>
            
            {/* Streaks */}
            <div className="grid grid-cols-3 gap-4 mb-4">
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
            
            {/* Roll Type Switching Status */}
            {enableRollSwitch && (
              <div className="bg-blue-900 rounded-lg p-3 mb-4">
                <div className="text-blue-200 font-semibold text-sm mb-1">Auto Roll Switch Active</div>
                <div className="text-blue-300 text-xs">
                  Switch after {switchCount} {switchCondition} ({currentSwitchCounter}/{switchCount})
                </div>
                <div className="text-blue-300 text-xs">
                  Next: Roll {rollUnder ? 'Over' : 'Under'} {targetNumber.toFixed(2)}
                </div>
              </div>
            )}
            
            {/* Profit Graph */}
            <ProfitGraph />
          </div>
        </div>
        
        {/* Betting Panel */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Place Your Bet</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount ($)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="0.01"
                step="0.01"
                disabled={isRolling || autoBetRunning}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setBetAmount(prev => prev / 2)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isRolling || autoBetRunning}
              >
                1/2
              </button>
              <button
                onClick={() => setBetAmount(prev => prev * 2)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isRolling || autoBetRunning}
              >
                2x
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-400">
              Balance: ${user.balance.toFixed(2)}
            </div>
            
            <div className="space-y-2">
              <button
                onClick={rollDice}
                disabled={isRolling || betAmount > user.balance || autoBetRunning}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isRolling ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Rolling...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Roll Dice
                  </>
                )}
              </button>
              
              {!autoBetRunning ? (
                <button
                  onClick={startAutoPlay}
                  disabled={isRolling || betAmount > user.balance}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Start Auto
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={stopAutoPlay}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Auto {infiniteBet ? '(∞)' : `(${autoBetCount} left)`}
                  </button>
                  
                  <button
                    onClick={() => setStopOnNextWin(true)}
                    disabled={stopOnNextWin}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    {stopOnNextWin ? 'Will Stop on Next Win' : 'Stop on Next Win'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Advanced Auto-bet Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Auto-Bet Settings
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={infiniteBet}
                    onChange={(e) => setInfiniteBet(e.target.checked)}
                    className="mr-2"
                    disabled={autoBetRunning}
                  />
                  <span className="text-white text-sm font-medium">Infinite Bet Mode</span>
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Auto-bet will run indefinitely until manually stopped
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Number of Bets
                </label>
                <input
                  type="number"
                  value={maxAutoBets}
                  onChange={(e) => setMaxAutoBets(Number(e.target.value))}
                  className={`w-full px-3 py-2 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    infiniteBet ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
                  }`}
                  min="1"
                  max="10000"
                  disabled={infiniteBet || autoBetRunning}
                />
                {infiniteBet && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Infinite mode enabled - will bet until stopped
                  </p>
                )}
              </div>
              
              {/* Roll Type Switching */}
              <div className="bg-gray-700 rounded-lg p-3">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={enableRollSwitch}
                    onChange={(e) => setEnableRollSwitch(e.target.checked)}
                    className="mr-2"
                    disabled={autoBetRunning}
                  />
                  <span className="text-white text-sm font-medium">Auto Roll Type Switch</span>
                </label>
                
                {enableRollSwitch && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Switch After</label>
                        <input
                          type="number"
                          value={switchCount}
                          onChange={(e) => setSwitchCount(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          min="1"
                          disabled={autoBetRunning}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Condition</label>
                        <select
                          value={switchCondition}
                          onChange={(e) => setSwitchCondition(e.target.value as any)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          disabled={autoBetRunning}
                        >
                          <option value="wins">Wins</option>
                          <option value="losses">Losses</option>
                          <option value="bets">Bets</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Will switch from "{rollUnder ? 'Under' : 'Over'}" to "{rollUnder ? 'Over' : 'Under'}" after {switchCount} {switchCondition}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={instantBet}
                    onChange={(e) => setInstantBet(e.target.checked)}
                    className="mr-2"
                    disabled={autoBetRunning}
                  />
                  <span className="text-white text-sm">Instant Bet (Skip Animation)</span>
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Reduces roll time from 1 second to 0.1 seconds
                </p>
              </div>
              
              {showAdvanced && (
                <>
                  {/* Strategy Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Strategy
                    </label>
                    <select
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      disabled={autoBetRunning}
                    >
                      <option value="fixed">Fixed Bet</option>
                      <option value="martingale">Martingale</option>
                      <option value="fibonacci">Fibonacci</option>
                      <option value="labouchere">Labouchere</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Choose how bet amounts change after wins/losses</p>
                  </div>
                  
                  {/* Fixed Strategy Settings */}
                  {strategy === 'fixed' && (
                    <>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <h5 className="text-white font-medium mb-3">Fixed Strategy Settings</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            On Win
                          </label>
                          <select
                            value={onWin}
                            onChange={(e) => setOnWin(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={autoBetRunning}
                          >
                            <option value="reset">Reset to Base</option>
                            <option value="increase">Increase Bet</option>
                            <option value="decrease">Decrease Bet</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            On Loss
                          </label>
                          <select
                            value={onLoss}
                            onChange={(e) => setOnLoss(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={autoBetRunning}
                          >
                            <option value="reset">Reset to Base</option>
                            <option value="increase">Increase Bet</option>
                            <option value="decrease">Decrease Bet</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Increase By (%)
                          </label>
                          <input
                            type="number"
                            value={increaseBy}
                            onChange={(e) => setIncreaseBy(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            min="1"
                            disabled={autoBetRunning}
                          />
                          <p className="text-xs text-gray-400 mt-1">100% = double bet</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Decrease By (%)
                          </label>
                          <input
                            type="number"
                            value={decreaseBy}
                            onChange={(e) => setDecreaseBy(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            min="1"
                            max="99"
                            disabled={autoBetRunning}
                          />
                          <p className="text-xs text-gray-400 mt-1">50% = half bet</p>
                        </div>
                      </div>
                      </div>
                    </>
                  )}
                  
                  {/* Martingale Strategy Settings */}
                  {strategy === 'martingale' && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-3">Martingale Strategy</h5>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Loss Multiplier
                        </label>
                        <input
                          type="number"
                          value={martingaleMultiplier}
                          onChange={(e) => setMartingaleMultiplier(Math.max(1.1, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          min="1.1"
                          step="0.1"
                          disabled={autoBetRunning}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Multiply bet by this amount on loss (2.0 = double)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Fibonacci Strategy Settings */}
                  {strategy === 'fibonacci' && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-3">Fibonacci Strategy</h5>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Base Multiplier
                        </label>
                        <input
                          type="number"
                          value={fibonacciMultiplier}
                          onChange={(e) => setFibonacciMultiplier(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          min="0.1"
                          step="0.1"
                          disabled={autoBetRunning}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Base bet × Fibonacci number (1, 1, 2, 3, 5, 8...)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Labouchere Strategy Settings */}
                  {strategy === 'labouchere' && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-3">Labouchere Strategy</h5>
                      <label className="block text-sm text-gray-300 mb-1">
                        Labouchere Sequence (comma separated)
                      </label>
                      <input
                        type="text"
                        value={labouchereSequence.join(', ')}
                        onChange={(e) => {
                          const seq = e.target.value.split(',').map(n => Number(n.trim())).filter(n => !isNaN(n) && n > 0);
                          setLabouchereSequence(seq.length > 0 ? seq : [1]);
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="1, 2, 3, 4"
                        disabled={autoBetRunning}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Bet = first + last number. Remove both on win, add bet amount on loss.
                      </p>
                    </div>
                  )}
                  
                  {/* Stop Conditions */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-3">Stop Conditions</h5>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={stopOnProfit}
                          onChange={(e) => setStopOnProfit(e.target.checked)}
                          className="mr-2"
                          disabled={autoBetRunning}
                        />
                        <span className="text-white text-sm">Stop on profit:</span>
                        <input
                          type="number"
                          value={stopProfitAmount}
                          onChange={(e) => setStopProfitAmount(Number(e.target.value))}
                          className="ml-2 w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          disabled={!stopOnProfit || autoBetRunning}
                        />
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={stopOnLoss}
                          onChange={(e) => setStopOnLoss(e.target.checked)}
                          className="mr-2"
                          disabled={autoBetRunning}
                        />
                        <span className="text-white text-sm">Stop on loss:</span>
                        <input
                          type="number"
                          value={stopLossAmount}
                          onChange={(e) => setStopLossAmount(Number(e.target.value))}
                          className="ml-2 w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          disabled={!stopOnLoss || autoBetRunning}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Current Strategy Display */}
                  <div className="bg-blue-900 rounded-lg p-3">
                    <h5 className="text-blue-200 font-medium mb-2">Current Settings</h5>
                    <div className="text-xs text-blue-100 space-y-1">
                      <p><strong>Strategy:</strong> {strategy.charAt(0).toUpperCase() + strategy.slice(1)}</p>
                      <p><strong>Base Bet:</strong> ${baseBet.toFixed(2)}</p>
                      <p><strong>Current Bet:</strong> ${betAmount.toFixed(2)}</p>
                      <p><strong>Multiplier:</strong> {multiplier.toFixed(2)}x</p>
                      <p><strong>Win Chance:</strong> {winChance.toFixed(2)}%</p>
                      {strategy === 'fixed' && (
                        <>
                          <p><strong>On Win:</strong> {onWin} {onWin !== 'reset' && `(${onWin === 'increase' ? increaseBy : decreaseBy}%)`}</p>
                          <p><strong>On Loss:</strong> {onLoss} {onLoss !== 'reset' && `(${onLoss === 'increase' ? increaseBy : decreaseBy}%)`}</p>
                        </>
                      )}
                      {strategy === 'martingale' && (
                        <p><strong>Loss Multiplier:</strong> {martingaleMultiplier}x</p>
                      )}
                      {enableRollSwitch && (
                        <p><strong>Roll Switch:</strong> Every {switchCount} {switchCondition}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
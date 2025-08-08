// Local storage utilities for CharliesOdds
export interface Profile {
  id: string;
  username: string;
  email: string;
  balance: number;
  is_admin: boolean;
  level: number;
  experience: number;
  last_daily_bonus: string | null;
  currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC';
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_bets: number;
  total_wins: number;
  total_losses: number;
  biggest_win: number;
  biggest_loss: number;
  total_wagered: number;
  total_won: number;
  created_at: string;
  updated_at: string;
}

export interface GameBet {
  id: string;
  user_id: string;
  game_name: 'Dice' | 'Limbo' | 'Crash' | 'Blackjack' | 'Plinko' | 'Spin Wheel';
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  game_result: any;
  created_at: string;
}

export interface GameSetting {
  id: string;
  user_id: string;
  game_name: string;
  setting_name: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'feature' | 'bug' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'under-review' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
  admin_responses?: Array<{
    id: string;
    response_text: string;
    created_at: string;
    profiles?: {
      username: string;
    };
  }>;
  user_vote?: {
    vote_type: 'up' | 'down';
  };
}

export interface SuggestionVote {
  id: string;
  suggestion_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface AdminResponse {
  id: string;
  suggestion_id: string;
  admin_id: string;
  response_text: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'gaming' | 'social' | 'special';
  reward: number;
  icon: string;
  cooldown_hours: number;
  max_progress: number;
  is_active: boolean;
  created_at: string;
}

export interface UserTaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  progress: number;
  completed: boolean;
  last_completed: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminGameConfig {
  id: string;
  game_name: 'dice' | 'limbo' | 'crash' | 'blackjack' | 'plinko' | 'spin-wheel';
  enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  updated_by: string | null;
  updated_at: string;
}

// Local storage helper functions
export const localStorage_helpers = {
  getUsers: (): Profile[] => {
    return JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
  },
  
  saveUsers: (users: Profile[]) => {
    localStorage.setItem('charlies-odds-users', JSON.stringify(users));
  },
  
  getUserStats: (): UserStats[] => {
    return JSON.parse(localStorage.getItem('charlies-odds-user-stats') || '[]');
  },
  
  saveUserStats: (stats: UserStats[]) => {
    localStorage.setItem('charlies-odds-user-stats', JSON.stringify(stats));
  },
  
  getBets: (): GameBet[] => {
    return JSON.parse(localStorage.getItem('charlies-odds-bets') || '[]');
  },
  
  saveBets: (bets: GameBet[]) => {
    localStorage.setItem('charlies-odds-bets', JSON.stringify(bets));
  },
  
  getSuggestions: (): Suggestion[] => {
    return JSON.parse(localStorage.getItem('charlies-odds-suggestions') || '[]');
  },
  
  saveSuggestions: (suggestions: Suggestion[]) => {
    localStorage.setItem('charlies-odds-suggestions', JSON.stringify(suggestions));
  },
  
  getGameConfig: (): AdminGameConfig[] => {
    return JSON.parse(localStorage.getItem('charlies-odds-game-config') || '[]');
  },
  
  saveGameConfig: (config: AdminGameConfig[]) => {
    localStorage.setItem('charlies-odds-game-config', JSON.stringify(config));
  }
};

// Initialize default data if not exists
export const initializeDefaultData = () => {
  // Initialize default game config
  const existingConfig = localStorage_helpers.getGameConfig();
  if (existingConfig.length === 0) {
    const defaultConfig: AdminGameConfig[] = [
      { id: '1', game_name: 'dice', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 1, updated_by: null, updated_at: new Date().toISOString() },
      { id: '2', game_name: 'limbo', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 1, updated_by: null, updated_at: new Date().toISOString() },
      { id: '3', game_name: 'crash', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 1, updated_by: null, updated_at: new Date().toISOString() },
      { id: '4', game_name: 'blackjack', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 0.5, updated_by: null, updated_at: new Date().toISOString() },
      { id: '5', game_name: 'plinko', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 2, updated_by: null, updated_at: new Date().toISOString() },
      { id: '6', game_name: 'spin-wheel', enabled: true, min_bet: 0.01, max_bet: 1000, house_edge: 5, updated_by: null, updated_at: new Date().toISOString() }
    ];
    localStorage_helpers.saveGameConfig(defaultConfig);
  }
};

// Call initialization
initializeDefaultData();
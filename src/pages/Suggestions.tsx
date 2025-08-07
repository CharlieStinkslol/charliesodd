import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Lightbulb, Bug, Plus, Star, ThumbsUp, ThumbsDown, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Suggestion } from '../lib/supabase';

const Suggestions = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  const [priority, setPriority] = useState('medium');
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Load suggestions from Supabase
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select(`
          *,
          profiles:user_id(username),
          admin_responses(*),
          suggestion_votes(vote_type, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading suggestions:', error);
        setLoading(false);
        return;
      }

      // Process the data to match our interface
      const processedSuggestions: Suggestion[] = (data || []).map(suggestion => ({
        ...suggestion,
        profiles: suggestion.profiles,
        admin_responses: suggestion.admin_responses,
        user_vote: user && suggestion.suggestion_votes ? 
          suggestion.suggestion_votes.find((vote: any) => vote.user_id === user.id) : 
          undefined
      }));

      setSuggestions(processedSuggestions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    createSuggestion();
  };

  const createSuggestion = async () => {
    if (!user || !title.trim() || !description.trim()) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'open'
        });

      if (error) {
        console.error('Error creating suggestion:', error);
        return;
      }

      setSubmitted(true);
      setTitle('');
      setDescription('');
      setTimeout(() => setSubmitted(false), 3000);
      
      // Reload suggestions
      loadSuggestions();
    } catch (error) {
      console.error('Error creating suggestion:', error);
    }
  };

  const handleVote = async (suggestionId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    if (!supabase) return;

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('suggestion_votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('suggestion_id', suggestionId)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking same vote
          await supabase
            .from('suggestion_votes')
            .delete()
            .eq('user_id', user.id)
            .eq('suggestion_id', suggestionId);
        } else {
          // Update vote if different
          await supabase
            .from('suggestion_votes')
            .update({ vote_type: voteType })
            .eq('user_id', user.id)
            .eq('suggestion_id', suggestionId);
        }
      } else {
        // Create new vote
        await supabase
          .from('suggestion_votes')
          .insert({
            user_id: user.id,
            suggestion_id: suggestionId,
            vote_type: voteType
          });
      }

      // Reload suggestions to get updated counts
      loadSuggestions();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Sort suggestions by score (upvotes - downvotes)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const scoreA = a.upvotes - a.downvotes;
    const scoreB = b.upvotes - b.downvotes;
    return scoreB - scoreA;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'feature':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'bug':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'improvement':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-600 text-white';
      case 'under-review':
        return 'bg-yellow-600 text-white';
      case 'planned':
        return 'bg-blue-600 text-white';
      case 'in-progress':
        return 'bg-purple-600 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (pri: string) => {
    switch (pri) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-yellow-400" />
          Suggestions & Feedback
        </h1>
        <p className="text-gray-400">Help us improve CharliesOdds by sharing your ideas and reporting issues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit New Suggestion */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-4">Submit Suggestion</h2>
            
            {submitted && (
              <div className="bg-green-600 text-white p-3 rounded-lg mb-4 text-sm">
                Thank you! Your suggestion has been submitted.
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="feature">New Feature</option>
                  <option value="improvement">Improvement</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Brief title for your suggestion..."
                  required
                  disabled={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 h-32 resize-none"
                  placeholder="Describe your suggestion or issue in detail..."
                  required
                  disabled={!user}
                />
              </div>

              <button
                type="submit"
                disabled={!user}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                {user ? 'Submit Suggestion' : 'Login Required'}
              </button>
            </form>

            {!user && (
              <div className="mt-4 bg-blue-900 border border-blue-600 rounded-lg p-4">
                <p className="text-blue-200 text-sm text-center">
                  <strong>Login required</strong> to submit suggestions and vote
                </p>
              </div>
            )}

            <div className="mt-6 text-xs text-gray-400">
              <p className="mb-2"><strong>Guidelines:</strong></p>
              <ul className="space-y-1">
                <li>• Be specific and detailed</li>
                <li>• One suggestion per submission</li>
                <li>• Check existing suggestions first</li>
                <li>• Include steps to reproduce bugs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Existing Suggestions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Community Suggestions</h2>
            <div className="text-sm text-gray-400">
              {suggestions.length} suggestions
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400">Loading suggestions...</p>
              </div>
            ) : sortedSuggestions.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(item.category)}
                    <span className="text-sm text-gray-400 capitalize">{item.category}</span>
                    <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority} priority
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mb-3 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{item.profiles?.username || 'Unknown'}</span>
                  <Calendar className="w-4 h-4 ml-2" />
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 mb-4">{item.description}</p>
                
                {/* Admin Responses */}
                {item.admin_responses && item.admin_responses.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="text-yellow-400 font-semibold mb-3 text-sm">Official Response:</h4>
                    <div className="space-y-2">
                      {item.admin_responses.map((response) => (
                        <div key={response.id} className="bg-gray-600 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-yellow-400 font-semibold text-sm">
                              {response.profiles?.username || 'Admin'}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(response.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm">{response.response_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleVote(item.id, 'up')}
                      disabled={!user}
                      className={`flex items-center space-x-1 transition-colors ${
                        user && item.user_vote?.vote_type === 'up' 
                          ? 'text-green-400' 
                          : 'text-gray-400 hover:text-green-400'
                      } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{item.upvotes}</span>
                    </button>
                    <button 
                      onClick={() => handleVote(item.id, 'down')}
                      disabled={!user}
                      className={`flex items-center space-x-1 transition-colors ${
                        user && item.user_vote?.vote_type === 'down' 
                          ? 'text-red-400' 
                          : 'text-gray-400 hover:text-red-400'
                      } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">{item.downvotes}</span>
                    </button>
                    <div className="text-sm text-gray-400">
                      Score: {item.upvotes - item.downvotes}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {suggestions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Suggestions Yet</h3>
              <p className="text-gray-500">Be the first to submit a suggestion!</p>
            </div>
          )}

          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">How Suggestions Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-white font-semibold mb-2">Status Meanings:</h4>
                <ul className="space-y-1 text-gray-300">
                  <li><span className="text-gray-400">Open:</span> Under consideration</li>
                  <li><span className="text-yellow-400">Under Review:</span> Being evaluated</li>
                  <li><span className="text-blue-400">Planned:</span> Approved for development</li>
                  <li><span className="text-purple-400">In Progress:</span> Currently being worked on</li>
                  <li><span className="text-green-400">Completed:</span> Implemented and live</li>
                  <li><span className="text-red-400">Rejected:</span> Not suitable for implementation</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Voting & Priority:</h4>
                <ul className="space-y-1 text-gray-300">
                  <li><span className="text-green-400">👍 Upvote:</span> Support this suggestion</li>
                  <li><span className="text-red-400">👎 Downvote:</span> Don't think it's needed</li>
                  <li><span className="text-yellow-400">Score:</span> Net votes (upvotes - downvotes)</li>
                  <li><span className="text-blue-400">Sorting:</span> Higher scores appear first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;
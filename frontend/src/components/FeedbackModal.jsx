import { useState } from 'react';
import { Star, MessageSquare, X } from 'lucide-react';
import api from '../api';

export default function FeedbackModal({ isOpen, onClose, targetUserId, targetUserName, onFeedbackSubmitted }) {
  const [compatibility, setCompatibility] = useState(0);
  const [collaboration, setCollaboration] = useState(0);
  const [scheduling, setScheduling] = useState(0);
  const [comment, setComment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (compatibility === 0 || collaboration === 0 || scheduling === 0) {
      setError("Please provide a rating for all three categories before submitting.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await api.post(`/matches/${targetUserId}/feedback`, {
        compatibility_rating: compatibility,
        collaboration_quality: collaboration,
        scheduling_ease: scheduling,
        feedback_text: comment || null
      });
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, setRating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform duration-100 hover:scale-125"
          >
            <Star
              className={`h-7 w-7 ${
                star <= rating
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]'
                  : 'text-slate-200 hover:text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-white/95 border border-slate-100 shadow-2xl rounded-3xl animate-scale-up">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Evaluate Match</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">
            Share your feedback on working with <span className="text-indigo-600 font-bold">{targetUserName}</span> to help us improve matching accuracy.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl border border-rose-150 bg-rose-50 text-rose-600 text-xs font-bold shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 mb-8">
            {/* Category 1 */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Academic Compatibility</h4>
                <p className="text-xs text-slate-400">How well did subjects and goals align?</p>
              </div>
              {renderStars(compatibility, setCompatibility)}
            </div>

            {/* Category 2 */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Collaboration Quality</h4>
                <p className="text-xs text-slate-400">Communication and study effort</p>
              </div>
              {renderStars(collaboration, setCollaboration)}
            </div>

            {/* Category 3 */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Scheduling Ease</h4>
                <p className="text-xs text-slate-400">Timings and coordination</p>
              </div>
              {renderStars(scheduling, setScheduling)}
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                Review Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any highlights, observations, or challenges faced..."
                className="w-full h-24 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder-slate-400 bg-slate-50/50 resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

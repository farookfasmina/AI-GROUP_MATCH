import { useState, useEffect, useRef, useContext } from 'react';
import { X, Send, User, Plus, FileText, Download, Loader2 } from 'lucide-react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

export default function ChatDrawer({ group, isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Poll for messages while drawer is open
  useEffect(() => {
    if (!isOpen || !group) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/groups/${group.id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [isOpen, group]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage(''); // optimistic clear

    try {
      const res = await api.post(`/groups/${group.id}/messages`, { content });
      setMessages([...messages, res.data]);
    } catch (err) {
      console.error("Failed to send message", err);
      setNewMessage(content); // restore on error
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !group) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use standard axios to send multipart data
      const res = await api.post(`/groups/${group.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessages([...messages, res.data]);
    } catch (err) {
      console.error("File upload failed", err);
      alert("System Error: Failed to upload file. Please ensure it is not too large.");
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pointer-events-none">
        <div className="w-screen max-w-md pointer-events-auto transform transition-transform duration-500 ease-in-out">
          <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/20 overflow-hidden relative">
            {/* Top Branding Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            {/* Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{group.name} Hub</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Connection</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Chat History */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                  <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <Send className="h-10 w-10 text-indigo-400 -rotate-12" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">Send a message or share a PDF!</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                   const isMe = m.sender_id === user?.id;
                   const isFile = m.is_file;
                   return (
                    <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{isMe ? 'You' : m.sender_name}</span>
                        <span className="text-[9px] text-slate-300 font-medium">
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {isFile ? (
                        <div className={`max-w-[85%] p-1 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                          isMe ? 'bg-indigo-600' : 'bg-white border border-slate-200'
                        }`}>
                           <div className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-white/10' : 'bg-slate-50'}`}>
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                <FileText className="h-6 w-6" />
                              </div>
                              <div className="min-w-0 pr-2">
                                <p className={`text-xs font-bold truncate mb-1 ${isMe ? 'text-white' : 'text-slate-800'}`}>
                                  {m.file_name || 'Shared Document'}
                                </p>
                                <a 
                                  href={`http://localhost:8000${m.file_url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:underline ${isMe ? 'text-indigo-200' : 'text-indigo-600'}`}
                                >
                                  <Download className="h-3 w-3" />
                                  View / Download
                                </a>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-semibold shadow-sm leading-relaxed transition-all hover:shadow-md ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 border border-indigo-500' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}>
                          {m.content}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner group focus-within:bg-white focus-within:border-indigo-300 transition-all">
                {/* File Upload Input & Trigger */}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-600 transition-colors active:scale-90"
                  title="Share File"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-6 w-6" />
                  )}
                </button>

                <textarea
                  rows="1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={uploading ? "Uploading..." : "Share a thought..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder-slate-400 resize-none py-3 px-1 max-h-32"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || uploading}
                  className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-30 disabled:bg-slate-400 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <p className="mt-3 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-none">
                {uploading ? 'Processing your file...' : 'Shift + Enter for new line'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import { SharedLink } from '../types';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoFeedback from './VideoFeedback';

export default function SharedVideoFeedback() {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const [sharedLink, setSharedLink] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    async function checkShare() {
      if (!shareId) return;
      try {
        const link = await dbService.getSharedLink(shareId);
        if (!link) {
          setError('Link shared not found or has been deleted.');
          setLoading(false);
          return;
        }

        // Check expiry
        if (link.expiresAt && link.expiresAt < Date.now()) {
          setError('This shared link has expired.');
          setLoading(false);
          return;
        }

        setSharedLink(link);
        
        // If no password, or password in URL matches, or already authorized
        const urlPassword = searchParams.get('p');
        if (!link.password || (urlPassword && atob(urlPassword) === link.password)) {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Error checking share:', err);
        setError('An error occurred while checking the shared link.');
      } finally {
        setLoading(false);
      }
    }
    checkShare();
  }, [shareId, searchParams]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sharedLink && inputPassword === sharedLink.password) {
      setIsAuthorized(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1015] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
           <div className="w-20 h-20 bg-[#14151a] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgb(242,92,5,0.2)] border border-[#2e3138] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 animate-pulse"></div>
             <img 
               src="/src/assets/images/espace_logo_1779517923818.png" 
               alt="Espace Logo" 
               className="w-12 h-12 object-contain z-10 animate-bounce" 
               style={{animationDuration: '2s'}}
               referrerPolicy="no-referrer"
             />
           </div>
           <p className="text-slate-500 font-extrabold tracking-[0.2em] uppercase text-[10px]">Đang kiểm tra liên kết chia sẻ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0e1015] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#1c1e23] border border-[#2e3138] rounded-3xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Từ chối truy cập</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{error === 'Link shared not found or has been deleted.' ? 'Liên kết chia sẻ này không tồn tại hoặc đã bị gỡ bỏ.' : error === 'This shared link has expired.' ? 'Liên kết chia sẻ này đã hết thời gian hiệu lực.' : error}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-[#2e3138] hover:bg-[#3e4148] text-white font-bold rounded-2xl transition-all font-black text-xs uppercase tracking-wider"
          >
            Quay lại Trang chủ
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isAuthorized && sharedLink?.password) {
    return (
      <div className="min-h-screen bg-[#0e1015] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#1c1e23] border border-[#2e3138] rounded-3xl p-8 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#f25c05]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#f25c05]" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Nội Dung Được Bảo Vệ</h2>
            <p className="text-slate-400 text-sm">Vui lòng điền mật khẩu chính xác để xem feedback của video này.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Nhập mật khẩu truy cập..."
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className={`w-full bg-[#0e1015] border rounded-2xl p-4 text-white outline-none transition-all font-bold ${
                  passwordError ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[#2e3138] focus:ring-2 focus:ring-[#f25c05]'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-[10px] text-red-500 font-bold ml-1">Mật khẩu không chính xác. Vui lòng thử lại.</p>
              )}
            </div>
            <button 
              type="submit"
              className="w-full py-4.5 bg-[#f25c05] hover:bg-orange-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              Xác Minh Truy Cập
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Once authorized, we need to bypass the normal ID check in VideoFeedback 
  // or just pass the video ID to it.
  // We can't easily modify VideoFeedback to accept a share object, 
  // so we'll just use the videoId from the share link.
  
  return (
    <div className="contents" key={sharedLink?.videoId}>
      {/* We use a key to force rerender if sharedLink changes */}
      <VideoFeedbackOverride videoId={sharedLink?.videoId} />
    </div>
  );
}

// Wrapper for VideoFeedback that passes the video ID directly
function VideoFeedbackOverride({ videoId }: { videoId?: string }) {
  // We need to trick VideoFeedback into using this videoId instead of the one from params
  // Or we just re-implement the layout or hack the params.
  // Actually, let's just use the shared link's videoId.
  return <VideoFeedback sharedVideoId={videoId} />;
}

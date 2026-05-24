import { useState } from 'react';
import { User as UserIcon, Mail, Lock, LogIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../services/db';
import { User as UserType } from '../types';

interface LoginModalProps {
  onLogin: (user: UserType) => void;
  initialMode?: 'login' | 'register' | 'forgot_password' | 'guest' | 'choice';
}

export default function LoginModal({ onLogin, initialMode = 'login' }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'guest' | 'choice'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isRestrictedBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return (
      (ua.indexOf('FBAN') > -1) || 
      (ua.indexOf('FBAV') > -1) || 
      (ua.indexOf('Instagram') > -1) || 
      (ua.indexOf('Zalo') > -1) ||
      (ua.indexOf('TikTok') > -1)
    );
  };

  const handleGoogleLogin = async () => {
    if (isRestrictedBrowser()) {
      setError('Google chặn đăng nhập từ trình duyệt bên trong ứng dụng (như Facebook, Zalo). Vui lòng nhấn vào dấu 3 chấm góc trên bên phải và chọn "Mở bằng trình duyệt" (Chrome/Safari) để đăng nhập, hoặc sử dụng Email/Mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await dbService.loginWithGoogle();
      onLogin(user);
      window.location.reload();
    } catch (err: any) {
      console.error('Google login failed:', err);
      let errorMessage = err.message || 'Google login failed';
      if (errorMessage.includes('network-request-failed') || errorMessage.includes('popup-closed-by-user')) {
        errorMessage = 'Trình duyệt đang chặn popup hiển thị đăng nhập Google (thường do chạy trong iframe). Vui lòng thử dùng Email/Mật khẩu hoặc mở ứng dụng trong thẻ mới (Open In New Tab).';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (mode !== 'forgot_password' && !password.trim()) || (mode === 'register' && !name.trim())) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'forgot_password') {
        await dbService.resetPassword(email);
        setMessage('Vui lòng kiểm tra hòm thư (bao gồm cả thư rác/spam) để đặt lại mật khẩu.');
        setMode('login');
      } else {
        let user;
        if (mode === 'register') {
          user = await dbService.registerWithEmail(email, password, name);
        } else {
          user = await dbService.loginWithEmail(email, password);
        }
        onLogin(user);
        window.location.reload(); 
      }
    } catch (err: any) {
      console.error('Authentication failed:', err);
      const errorCode = err.code || '';
      let errorMessage = err.message || 'Authentication failed';
      
      const adminEmails = ['duongnguyencam00@gmail.com', 'hungbato19@gmail.com', 'hungbato01@gmail.com', 'ducna224@gmail.com', 'ducna225@gmail.com'];
      const isAdminEmail = adminEmails.includes(email);

      if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
        errorMessage = 'Phương thức đăng nhập Email/Mật khẩu chưa được bật. Vui lòng vào Firebase Console > Authentication > Sign-in method để bật "Email/Password".';
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorMessage.includes('invalid-credential')) {
        errorMessage = 'Email hoặc mật khẩu không đúng.';
        if (isAdminEmail) {
          errorMessage = 'Tài khoản Admin này chưa được tạo hoặc sai mật khẩu. Nếu bạn chưa tạo tài khoản, vui lòng nhấn "Đăng ký ngay" bên dưới để đăng ký với mật khẩu bạn chọn.';
        }
      } else if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        errorMessage = 'Email này đã được sử dụng. Nếu bạn đã có tài khoản, vui lòng dùng chức năng "Đăng nhập".';
        if (isAdminEmail) {
          errorMessage = 'Tài khoản Admin này đã tồn tại. Vui lòng quay lại màn hình "Đăng nhập" để vào hệ thống.';
        }
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
        errorMessage = 'Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 6 ký tự.';
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        errorMessage = 'Địa chỉ email không hợp lệ.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#111221] rounded-3xl shadow-[0_0_50px_rgba(242,92,5,0.25)] w-full max-w-md overflow-hidden relative border border-[#f25c05]/30 brand-glow-orange"
      >
         <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#f25c05] via-[#fbbf24] to-[#f25c05]"></div>
         {/* Background giant E watermark */}
         <div className="absolute -right-16 -bottom-16 opacity-[0.03] select-none pointer-events-none text-[240px] font-black text-[#f25c05] font-display">E</div>
         <div className="p-8 relative z-10">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-lg"></div>
                <img src="/src/assets/images/espace_logo_1779517923818.png" referrerPolicy="no-referrer" alt="Logo" className="w-16 h-16 mx-auto mb-4 relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase italic brand-glow-text">Espace</h2>
              <p className="text-slate-400 text-sm mt-1">
                {mode === 'login' ? 'Đăng nhập vào tài khoản Espace' : 
                 mode === 'register' ? 'Khởi tạo tài khoản Espace mới' : 
                 mode === 'choice' ? 'Lựa chọn phương thức đăng nhập' :
                 mode === 'guest' ? 'Trải nghiệm hệ thống dưới tư cách Khách' :
                 'Đặt lại mật khẩu của bạn'}
              </p>
            </div>
            
            {message && (
              <div className="bg-emerald-500/10 text-emerald-400 text-sm p-4 rounded-2xl mb-6 border border-emerald-500/20 font-medium">
                {message}
              </div>
            )}
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 text-red-400 text-[11px] font-bold p-3.5 rounded-2xl mb-6 border border-red-500/20 flex items-start gap-3 shadow-sm"
              >
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-red-500/30">
                  <X className="w-3 h-3 text-red-400" />
                </div>
                <span>{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'choice' && (
                <motion.div
                  key="choice-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5 py-2"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white tracking-tight uppercase italic brand-glow-text">Tuyển chọn phương thức</h3>
                    <p className="text-xs text-orange-400 mt-1">Để bắt đầu trao đổi đóng góp ý kiến phản hồi dự án</p>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full py-4.5 bg-gradient-to-r from-[#f25c05] to-[#ea580c] text-white rounded-2xl font-black text-sm hover:opacity-95 transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 tracking-widest uppercase active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Đăng nhập / Google Portal
                    </button>
                    
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-slate-800/80"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">hoặc dùng tên khách</span>
                      <div className="flex-1 h-px bg-slate-800/80"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode('guest')}
                      className="w-full py-4 bg-[#1b1c2e] text-slate-300 rounded-2xl font-black text-xs hover:bg-[#25273c] hover:text-white transition-all flex items-center justify-center gap-2 border-2 border-[#f25c05]/20 uppercase tracking-wider active:scale-[0.98]"
                    >
                      BÌNH LUẬN TRỰC TIẾP VỚI TÊN KHÁCH
                    </button>
                  </div>
                </motion.div>
              )}

              {mode === 'guest' && (
                <motion.div 
                  key="guest-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="text-center py-1">
                    <h3 className="text-lg font-black text-white tracking-tight">Truy cập nhanh với tư cách Khách</h3>
                    <p className="text-[10px] text-orange-400 mt-1 uppercase tracking-widest font-black">Nhập tên hiển thị tạm thời của bạn</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-slate-500 group-focus-within:text-[#f25c05]" />
                      </div>
                      <input 
                        type="text" 
                        value={guestNameInput}
                        onChange={e => setGuestNameInput(e.target.value)}
                        placeholder="Họ và tên của bạn hoặc biệt hiệu..."
                        className="w-full bg-[#1b1c2e] border-2 border-[#f25c05]/20 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:ring-4 focus:ring-[#f25c05]/20 focus:border-[#f25c05] outline-none transition-all placeholder:text-slate-600 placeholder:font-medium"
                        required
                        autoFocus
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (guestNameInput.trim()) {
                          localStorage.setItem('guestName', guestNameInput.trim());
                          onLogin({ id: 'guest', name: guestNameInput.trim(), role: 'viewer' } as any);
                        }
                      }}
                      className="w-full py-5 bg-gradient-to-r from-[#f25c05] to-[#f59e0b] text-white rounded-2xl font-black text-base hover:opacity-90 transition-all shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-3 group active:scale-[0.97] tracking-widest"
                    >
                      TRẢI NGHIỆM NGAY
                      <motion.span 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </button>
                  </div>

                  <div className="pt-6 border-t border-slate-800/60">
                    <p className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-[0.2em] mb-4">HOẶC SỬ DỤNG EMAIL & TÀI KHOẢN</p>
                    <button 
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-full py-4 bg-[#1b1c2e] text-slate-300 rounded-2xl font-bold hover:bg-[#25273c] hover:text-white transition-all flex items-center justify-center gap-2 border-2 border-[#f25c05]/20 active:scale-[0.98]"
                    >
                      <LogIn className="w-4 h-4 text-[#f25c05]" />
                      Đăng nhập / Đăng ký
                    </button>
                  </div>
                </motion.div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {mode !== 'forgot_password' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <button 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                        className="w-full py-3.5 mb-4 bg-[#1b1c2e] border-2 border-[#f25c05]/20 text-white rounded-2xl font-bold hover:bg-[#25273c] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Đồng bộ nhanh bằng Google Portal
                      </button>

                      <div className="bg-[#f25c05]/10 border border-[#f25c05]/20 rounded-2xl p-4 mb-5 text-[11px] text-slate-300 leading-relaxed shadow-inner">
                        <p className="font-extrabold uppercase tracking-wider text-[10px] text-orange-500 mb-1.5 flex items-center gap-1">
                          ⚡ LƯU Ý QUAN TRỌNG VỀ PHÂN QUYỀN:
                        </p>
                        <span>
                          Dự án Firebase được tự động cấu hình và bảo mật tối đa. Đăng nhập bằng Google qua email chính của bạn <strong className="text-orange-400">duongnguyencam05@gmail.com</strong> sẽ <strong>TỰ ĐỘNG ĐƯỢC TRAO QUYỀN ADMIN CAO CẤP</strong>, liên kết trực tiếp với các điều khoản phân quyền của Firestore Rules một cách bảo mật và an toàn!
                        </span>
                        <div className="mt-2 text-[10px] text-slate-400 italic">
                          *Nếu trình duyệt báo chặn popup khi nhấp nút Google, vui lòng click nút <strong>"Open in a new tab" (Mở trong tab mới)</strong> ở góc trên bên phải thanh công cụ AI Studio để khắc phục ngay lập tức!
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-slate-800/80"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">hoặc nhập tài khoản</span>
                        <div className="flex-1 h-px bg-slate-800/80"></div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {mode === 'register' && (
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Tên hiển thị của bạn</label>
                          <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className="w-full bg-[#1b1c2e] border-2 border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold focus:ring-2 focus:ring-[#f25c05] outline-none transition-all placeholder:text-slate-600 focus:border-[#f25c05]"
                            required
                          />
                       </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Thư điện tử (Email)</label>
                        <input 
                          type="email" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-[#1b1c2e] border-2 border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold focus:ring-2 focus:ring-[#f25c05] outline-none transition-all placeholder:text-slate-600 focus:border-[#f25c05]"
                          required
                        />
                    </div>
                    {mode !== 'forgot_password' && (
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Mật khẩu</label>
                          <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#1b1c2e] border-2 border-slate-800 rounded-xl px-4 py-3.5 text-white font-bold focus:ring-2 focus:ring-[#f25c05] outline-none transition-all placeholder:text-slate-600 focus:border-[#f25c05]"
                            required
                          />
                          {mode === 'login' && (
                            <div className="text-right mt-1.5">
                              <button type="button" onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); }} className="text-xs text-orange-400 hover:underline font-black uppercase tracking-wider">
                                Khôi phục mật khẩu?
                              </button>
                            </div>
                          )}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 mt-2 bg-gradient-to-r from-[#f25c05] to-[#ea580c] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-black"
                    >
                      {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : mode === 'register' ? 'THIẾT LẬP TÀI KHOẢN' : 'GỬI ĐƯỜNG DẪN KHÔI PHỤC'
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs font-medium text-slate-400 space-y-4">
                    <div>
                      {mode === 'login' ? 'Chưa sở hữu tài khoản? ' : mode === 'register' ? 'Đã có tài khoản trước đây? ' : 'Thay đổi mật khẩu thành công? '}
                      <button 
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}
                        className="text-orange-400 font-black hover:underline uppercase tracking-wider"
                      >
                        {mode === 'login' ? 'ĐĂNG KÝ NGAY' : 'Đăng nhập'}
                      </button>
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        onClick={() => setMode('guest')}
                        className="text-amber-400 font-black hover:underline py-2.5 px-4 bg-amber-500/10 rounded-2xl border border-amber-500/15 uppercase tracking-wider"
                      >
                        Xem bản dùng thử với tư cách khách
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Copy, Check, Lock, Calendar, Share2, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../services/db';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, videoId, videoTitle }) => {
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [isCopied, setIsCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const expiryTimestamp = expiryDays === 'never' ? undefined : Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000;
      
      const sharedLink = await dbService.createSharedLink(
        videoId, 
        videoTitle,
        password.trim() || undefined,
        expiryTimestamp
      );
      
      const url = dbService.formatSharedLink(sharedLink.id, sharedLink.password || undefined, sharedLink.expiresAt || undefined);
      setShareUrl(url);
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#1c1e23] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#2e3138]"
          >
            <div className="p-6 border-b border-[#2e3138] flex items-center justify-between bg-[#14151a]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f25c05]/10 rounded-xl">
                  <Share2 className="w-5 h-5 text-[#f25c05]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chia sẻ Video</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{videoTitle}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#2e3138] rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!shareUrl ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Đặt mật khẩu truy cập (Không bắt buộc)
                      </label>
                      <input
                        type="password"
                        placeholder="Để trống nếu không muốn cài mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#0e1015] border border-[#2e3138] text-white rounded-2xl p-4 focus:ring-2 focus:ring-[#f25c05] outline-none transition-all placeholder:text-slate-700 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Thời gian hết hạn liên kết
                      </label>
                      <select
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        className="w-full bg-[#0e1015] border border-[#2e3138] text-white rounded-2xl p-4 focus:ring-2 focus:ring-[#f25c05] outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="1">24 giờ (1 ngày)</option>
                        <option value="7">7 ngày (1 tuần)</option>
                        <option value="30">30 ngày (1 tháng)</option>
                        <option value="never">Vô thời hạn (Không bao giờ hết hạn)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="w-full bg-[#f25c05] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-xs font-black"
                  >
                    {isGenerating ? 'Đang tạo liên kết...' : 'Tạo Link Chia Sẻ Dưới Dạng Khách'}
                  </button>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest">
                      <Check className="w-4 h-4" /> Tạo liên kết thành công!
                    </div>
                    <div className="flex bg-[#0e1015] border border-[#2e3138] rounded-xl overflow-hidden group focus-within:ring-2 focus-within:ring-orange-500">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-300 outline-none font-mono text-xs"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-4 bg-[#2e3138] hover:bg-[#3e4148] transition-colors border-l border-[#2e3138] flex items-center justify-center"
                      >
                        {isCopied ? <span className="text-xs font-bold text-emerald-400">OK</span> : <Copy className="w-4 h-4 text-orange-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0e1015] rounded-xl border border-[#2e3138]">
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Bảo mật
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {password ? 'Mật khẩu bảo vệ' : 'Công khai'}
                      </div>
                    </div>
                    <div className="p-3 bg-[#0e1015] rounded-xl border border-[#2e3138]">
                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Hiệu lực
                      </div>
                      <div className="text-xs font-bold text-white">
                        {expiryDays === 'never' ? 'Vĩnh viễn' : `${expiryDays} Ngày`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShareUrl('')}
                    className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-colors py-2"
                  >
                    Xóa và tạo lại liên kết mới
                  </button>

                  <div className="pt-4 border-t border-[#2e3138]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Đường dẫn truy cập nội bộ (Yêu cầu Đăng nhập)</p>
                    <div className="flex bg-[#0e1015] border border-[#2e3138] rounded-xl overflow-hidden group">
                      <input
                        readOnly
                        value={`${window.location.origin}/video/${videoId}`}
                        className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/video/${videoId}`);
                        }}
                        className="px-3 bg-[#2e3138] hover:bg-[#3e4148] transition-colors border-l border-[#2e3138] flex items-center justify-center text-xs font-bold text-slate-400"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-4 bg-[#14151a] text-center">
              <p className="text-[10px] text-slate-600 italic">
                {shareUrl ? 'Bất kỳ ai có liên kết này đều có thể vào xem & để lại nhận xét dưới tư cách Khách' : 'Chia sẻ dễ dàng cho đối tác ngoài hệ thống nhận xét trực tiếp không cần tạo tài khoản.'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;

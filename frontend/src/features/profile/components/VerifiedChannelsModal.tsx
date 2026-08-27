import React from 'react';

interface VerifiedChannel {
  id: string;
  channel_username: string;
  is_verified?: boolean;
}

interface VerifiedChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUsername?: string | null;
  verifiedChannels?: VerifiedChannel[];
}

const VerifiedChannelsModal: React.FC<VerifiedChannelsModalProps> = ({ 
  isOpen, 
  onClose, 
  telegramUsername, 
  verifiedChannels 
}) => {
  if (!isOpen) return null;

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="animate-fade-in-up"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'auto'
      }}
    >
      {/* Overlay Background */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Modal Container */}
      <div className="liquid-glass rounded-xl w-full max-w-md p-6 relative z-10 max-h-[85vh] flex flex-col" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal" 
          className="absolute top-4 right-4 text-[#c4c7c8] hover:text-white transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        {/* Header */}
        <div className="mb-0 text-center" style={{ marginBottom: '8px' }}>
          <h2 className="text-[28px] font-semibold text-[#e5e2e1] mb-2">Verified Links</h2>
          <p className="text-[14px] text-[#8e9192]">Connect with your audience</p>
        </div>
        
        {/* Channel List - Scrollable */}
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Main Profile DM */}
          {telegramUsername && (
            <div 
              onClick={() => handleLinkClick(`https://t.me/${telegramUsername}`)}
              className="liquid-card rounded-lg p-4 flex items-center justify-between group relative cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] border border-[#444748]/30 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-[#c4c7c8] text-[24px]">person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium" style={{ fontSize: '13px' }}>@{telegramUsername}</h3>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '6px', right: '8px' }}>
                <span className="material-symbols-outlined text-[#4ade80]" style={{ fontSize: '14px' }}>open_in_new</span>
              </div>
            </div>
          )}

          {/* Verified Channels */}
          {verifiedChannels && verifiedChannels.map(ch => (
            <div 
              key={ch.id}
              onClick={() => {
                const url = ch.channel_username.startsWith('http') 
                  ? ch.channel_username 
                  : `https://t.me/${ch.channel_username.replace('@', '')}`;
                handleLinkClick(url);
              }}
              className="liquid-card rounded-lg p-4 flex items-center justify-between group relative cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] border border-[#444748]/30 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-[#c4c7c8] text-[24px]">group</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium" style={{ fontSize: '13px' }}>{ch.channel_username}</h3>
                    <span className="material-symbols-outlined text-[#3b82f6] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '6px', right: '8px' }}>
                <span className="material-symbols-outlined text-[#4ade80]" style={{ fontSize: '14px' }}>open_in_new</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .liquid-glass {
            background: rgba(18, 18, 18, 0.65);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02), 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .liquid-card {
            background: rgba(26, 26, 26, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .liquid-card:hover {
            background: rgba(34, 34, 34, 0.7);
            border-color: rgba(68, 68, 68, 1);
            transform: translateY(-1px);
        }
            
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default VerifiedChannelsModal;

'use client';

interface OverlayCommentIndicatorProps {
  hasComment: boolean;
  onClick: () => void;
  position?: string;
}

export default function OverlayCommentIndicator({ hasComment, onClick, position = "-right-12" }: OverlayCommentIndicatorProps) {
  if (!hasComment) return null;

  return (
    <div className={`absolute ${position} top-0 z-10`}>
      <button
        onClick={onClick}
        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-blue-600 transition-colors"
        title="View overlay comment"
      >
        💬
      </button>
    </div>
  );
}
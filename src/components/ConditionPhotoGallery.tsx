import { useState } from 'react';
import { X, BookOpen, BookMarked, FileText, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ConditionPhoto } from '@/types';

interface ConditionPhotoGalleryProps {
  photos: ConditionPhoto[];
}

const TYPE_LABELS: Record<ConditionPhoto['type'], { label: string; icon: typeof BookOpen }> = {
  cover: { label: '封面', icon: BookOpen },
  spine: { label: '书脊', icon: BookMarked },
  inside: { label: '内页', icon: FileText },
  defect: { label: '瑕疵', icon: AlertTriangle },
};

export function ConditionPhotoGallery({ photos }: ConditionPhotoGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="p-4 bg-brown-50 rounded-xl text-center">
        <p className="text-sm text-brown-400">暂无品相照片</p>
      </div>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    const order = { cover: 0, spine: 1, inside: 2, defect: 3 };
    return order[a.type] - order[b.type];
  });

  const openViewer = (index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = sortedPhotos[currentIndex];
  const CurrentIcon = TYPE_LABELS[currentPhoto?.type]?.icon || BookOpen;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sortedPhotos.map((photo, index) => {
          const { label, icon: Icon } = TYPE_LABELS[photo.type];
          return (
            <div
              key={photo.id}
              onClick={() => openViewer(index)}
              className="relative aspect-square bg-brown-50 rounded-lg overflow-hidden border border-brown-200 cursor-pointer group hover:border-brown-400 transition-colors"
            >
              <img
                src={photo.url}
                alt={photo.description || label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                  {photo.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewerOpen && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeViewer}>
          <button
            onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {sortedPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhoto.url}
              alt={currentPhoto.description || TYPE_LABELS[currentPhoto.type].label}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-4 flex items-center gap-3 text-white">
              <CurrentIcon className="w-5 h-5" />
              <span className="font-medium">{TYPE_LABELS[currentPhoto.type].label}</span>
              {currentPhoto.description && (
                <span className="text-white/70">— {currentPhoto.description}</span>
              )}
              <span className="text-white/50 ml-4">
                {currentIndex + 1} / {sortedPhotos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef } from 'react';
import { Camera, X, Image as ImageIcon, BookOpen, BookMarked, FileText, AlertTriangle } from 'lucide-react';
import type { ConditionPhoto } from '@/types';
import { generateId } from '@/utils/format';

interface ConditionPhotoUploaderProps {
  photos: ConditionPhoto[];
  onChange: (photos: ConditionPhoto[]) => void;
}

const PHOTO_TYPES: { value: ConditionPhoto['type']; label: string; icon: typeof BookOpen; required?: boolean }[] = [
  { value: 'cover', label: '封面', icon: BookOpen, required: true },
  { value: 'spine', label: '书脊', icon: BookMarked },
  { value: 'inside', label: '内页', icon: FileText },
  { value: 'defect', label: '瑕疵', icon: AlertTriangle },
];

export function ConditionPhotoUploader({ photos, onChange }: ConditionPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTypeRef = useRef<ConditionPhoto['type']>('cover');

  const getPhotosByType = (type: ConditionPhoto['type']) => {
    return photos.filter((p) => p.type === type);
  };

  const handleFileSelect = (type: ConditionPhoto['type']) => {
    currentTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          const newPhoto: ConditionPhoto = {
            id: generateId(),
            type: currentTypeRef.current,
            url,
            description: '',
            uploadedAt: new Date().toISOString(),
          };
          onChange([...photos, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const handleDescriptionChange = (id: string, description: string) => {
    onChange(photos.map((p) => (p.id === id ? { ...p, description } : p)));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {PHOTO_TYPES.map((photoType) => {
        const Icon = photoType.icon;
        const typePhotos = getPhotosByType(photoType.value);
        const hasPhoto = typePhotos.length > 0;

        return (
          <div key={photoType.value} className="p-4 bg-brown-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${hasPhoto ? 'text-olive-600' : 'text-brown-400'}`} />
                <span className="font-medium text-brown-700">
                  {photoType.label}
                  {photoType.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {hasPhoto && (
                  <span className="text-xs bg-olive-100 text-olive-700 px-2 py-0.5 rounded-full">
                    已上传 {typePhotos.length} 张
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleFileSelect(photoType.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brown-600 text-white text-sm rounded-lg hover:bg-brown-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                拍照/上传
              </button>
            </div>

            {typePhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {typePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-white rounded-lg overflow-hidden border border-brown-200">
                      <img
                        src={photo.url}
                        alt={photoType.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={photo.description || ''}
                      onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                      placeholder="添加备注..."
                      className="mt-2 w-full text-xs px-2 py-1 border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => handleFileSelect(photoType.value)}
                className="border-2 border-dashed border-brown-300 rounded-lg p-6 text-center cursor-pointer hover:border-brown-500 hover:bg-white transition-colors"
              >
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-brown-300" />
                <p className="text-sm text-brown-400">
                  点击上传{photoType.label}照片
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

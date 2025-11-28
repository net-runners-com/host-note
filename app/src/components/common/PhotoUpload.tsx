import { useRef, useCallback, memo } from 'react';
import { Button } from './Button';
import { LazyImage } from './LazyImage';
import { resizeImage } from '../../utils/imageUtils';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  label?: string;
  multiple?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export const PhotoUpload = memo<PhotoUploadProps>(({
  photos,
  onPhotosChange,
  label = '写真',
  multiple = true,
  maxWidth = 800,
  maxHeight = 800,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos: string[] = [];
    
    // 並列処理でパフォーマンス向上
    const processPromises = files
      .filter(file => file.type.startsWith('image/'))
      .map(async (file) => {
        try {
          // 画像をリサイズ
          const resizedFile = await resizeImage(file, maxWidth, maxHeight);
          
          // Base64に変換
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert file to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(resizedFile);
          });
          return base64;
        } catch (error) {
          console.error('Failed to process image:', error);
          return null;
        }
      });

    const results = await Promise.all(processPromises);
    const validPhotos = results.filter((photo): photo is string => photo !== null);

    if (validPhotos.length > 0) {
      if (multiple) {
        onPhotosChange([...photos, ...validPhotos]);
      } else {
        onPhotosChange(validPhotos.slice(0, 1));
      }
    }

    // 入力フィールドをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [photos, onPhotosChange, multiple, maxWidth, maxHeight]);

  const handleRemove = useCallback((index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }, [photos, onPhotosChange]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          {multiple ? '写真を追加' : '写真を選択'}
        </Button>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <LazyImage
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  width={96}
                  height={96}
                  className="w-full h-24 object-cover rounded border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-[var(--color-error)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-90 transition-opacity"
                  aria-label="写真を削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PhotoUpload.displayName = 'PhotoUpload';



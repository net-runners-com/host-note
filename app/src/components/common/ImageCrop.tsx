import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './Button';
import { fileToBase64 } from '../../utils/imageUtils';

interface ImageCropProps {
  src: string | null;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
  circular?: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCrop: React.FC<ImageCropProps> = ({
  src,
  onCropComplete,
  onCancel,
  aspect = 1,
  circular = false,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect]
  );

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * scaleX * pixelRatio;
      canvas.height = crop.height * scaleY * pixelRatio;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      if (circular) {
        // 円形に切り抜く
        ctx.beginPath();
        ctx.arc(
          canvas.width / (2 * pixelRatio),
          canvas.height / (2 * pixelRatio),
          Math.min(canvas.width, canvas.height) / (2 * pixelRatio),
          0,
          2 * Math.PI
        );
        ctx.clip();
      }

      ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert blob to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          'image/png',
          0.95
        );
      });
    },
    [circular]
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  if (!src) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        className="bg-[var(--color-surface)] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">画像を切り抜く</h2>
          
          <div className="mb-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circular}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                style={{ maxHeight: '70vh', maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleCropComplete}
              disabled={!completedCrop}
            >
              適用
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImageCropUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  circular?: boolean;
  size?: number;
}

export const ImageCropUpload: React.FC<ImageCropUploadProps> = ({
  value,
  onChange,
  label = '画像',
  circular = false,
  size = 200,
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setSrc(base64);
      setShowCrop(true);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onChange(croppedImage);
    setShowCrop(false);
    setSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setShowCrop(false);
    setSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className={`${circular ? 'rounded-full' : 'rounded-lg'} border-2 border-[var(--color-border)] object-cover`}
              style={{ width: `${size}px`, height: `${size}px` }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-[var(--color-error)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-90"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            className={`${circular ? 'rounded-full' : 'rounded-lg'} border-2 border-dashed border-[var(--color-border)] flex items-center justify-center bg-[var(--color-background)]`}
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <span className="text-[var(--color-text-secondary)] text-sm">
              画像なし
            </span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {value ? '画像を変更' : '画像を選択'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRemove}
            >
              削除
            </Button>
          )}
        </div>
      </div>

      {showCrop && src && (
        <ImageCrop
          src={src}
          onCropComplete={handleCropComplete}
          onCancel={handleCancel}
          aspect={1}
          circular={circular}
        />
      )}
    </div>
  );
};


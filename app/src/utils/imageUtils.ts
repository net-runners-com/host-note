/**
 * ファイルをBase64文字列に変換
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Base64文字列からBlob URLを作成
 */
export function base64ToBlobUrl(base64: string): string {
  return base64; // Base64はそのまま使用可能
}

/**
 * WebP形式をサポートしているかチェック
 */
function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

/**
 * 画像ファイルをリサイズ（最適化版）
 * WebP形式をサポートし、品質を調整可能
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    // ファイルサイズが小さい場合はリサイズ不要
    if (file.size < 100 * 1024) {
      // 100KB未満
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 元のサイズがmaxWidth/maxHeight以下の場合はリサイズ不要
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve(file);
          return;
        }

        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // アスペクト比を保ちながらリサイズ
        const aspectRatio = width / height;
        if (width > height) {
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        } else {
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", {
          alpha: false, // 透明度不要の場合はfalseでパフォーマンス向上
          willReadFrequently: false,
          desynchronized: true, // GPUアクセラレーションを有効化
        });
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // 画像の描画品質を最適化
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // WebP形式をサポートしている場合はWebPを使用（JPEG/PNG以外の場合）
        let outputType = file.type;
        if (
          supportsWebP() &&
          file.type !== "image/png" &&
          file.type !== "image/gif"
        ) {
          outputType = "image/webp";
        } else if (file.type === "image/png") {
          outputType = "image/png";
        } else {
          outputType = "image/jpeg";
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") +
                  (outputType === "image/webp"
                    ? ".webp"
                    : outputType === "image/png"
                      ? ".png"
                      : ".jpg"),
                { type: outputType }
              );
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to resize image"));
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = reject;
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function compressImageAdvanced(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = function () {
      try {
        // 计算新尺寸，保持宽高比
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // 高质量绘制设置
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, width, height);

        // 根据原文件类型确定输出格式
        let mimeType = "image/jpeg";
        if (file.type === "image/png") {
          mimeType = "image/png";
        } else if (file.type === "image/webp") {
          mimeType = "image/webp";
        }

        // 获取压缩后的DataURL
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // 将DataURL转换为Blob
        const byteString = atob(dataUrl.split(",")[1]);
        const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeString });

        resolve({
          dataUrl: dataUrl,
          blob: blob,
          compressedSize: blob.size,
          name: file.name,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = URL.createObjectURL(file);
  });
}

function compressImage(file, quality = 0.8, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("无效的图片文件"));
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      try {
        // 计算新尺寸，保持宽高比
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;

        // 绘制图片到canvas（高质量缩放）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 获取压缩后的数据URL
        const mimeType = file.type || "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // 将DataURL转换为Blob
        const byteString = atob(dataUrl.split(",")[1]);
        const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeType });
        const compressedFile = new File([blob], file.name, {
          type: mimeType,
          lastModified: Date.now(),
        });

        resolve({
          file: compressedFile,
          blob: blob,
          dataUrl: dataUrl,
          originalSize: file.size,
          compressedSize: blob.size,
          reduction: (((file.size - blob.size) / file.size) * 100).toFixed(1),
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("图片加载失败"));

    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

// 执行批量压缩
export async function batchCompressPhotos(photos, options = {}) {
  this.loadingStates.photos = true;

  const { quality = 0.8, maxWidth = 1920, maxHeight = 1080, preserveMetadata = false } = options;

  try {
    console.log("开始压缩照片:", photos);

    const compressionResults = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      if (!photo.file && !photo.raw) {
        console.warn(`照片 ${photo.name} 没有文件数据，跳过`);
        continue;
      }

      photo.loading = true;
      photo.compressionProgress = 0;

      try {
        // 更新进度
        photo.compressionProgress = 30;

        // 执行压缩
        const result = await compressImage(photo.file || photo.raw, quality, maxWidth);

        photo.compressionProgress = 100;

        // 更新照片信息
        photo.originalSize = result.originalSize;
        photo.size = result.compressedSize;
        photo.compressed = true;
        photo.compressedFile = result.file;
        photo.compressedBlob = result.blob;
        photo.dataUrl = result.dataUrl;
        photo.reduction = result.reduction;

        // 如果原照片有url，更新为压缩后的url
        if (photo.url) {
          photo.url = result.dataUrl;
        }

        compressionResults.push({
          index: i,
          photo: photo,
          success: true,
          reduction: result.reduction,
        });

        console.log(`压缩照片 ${i + 1}/${photos.length}: ${photo.name} 
          (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} 
          减小 ${result.reduction}%)`);
      } catch (error) {
        console.error(`压缩照片失败 ${photo.name}:`, error);
        compressionResults.push({
          index: i,
          photo: photo,
          success: false,
          error: error.message,
        });

        photo.loading = false;
        photo.compressionProgress = 0;
      }

      // 短暂延迟，避免界面卡顿
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 计算统计信息
    const successfulCompressions = compressionResults.filter((r) => r.success);
    const totalReduction = successfulCompressions.reduce((sum, r) => sum + parseFloat(r.reduction), 0);
    const avgReduction = successfulCompressions.length > 0 ? (totalReduction / successfulCompressions.length).toFixed(1) : 0;

    this.localPhotos = photos;

    console.log("压缩完成", {
      total: photos.length,
      successful: successfulCompressions.length,
      failed: compressionResults.length - successfulCompressions.length,
      averageReduction: avgReduction + "%",
    });

    if (successfulCompressions.length > 0) {
      this.$message.success(`成功压缩 ${successfulCompressions.length} 张照片，平均减小 ${avgReduction}%`);
    }

    if (compressionResults.length > successfulCompressions.length) {
      this.$message.warning(`${compressionResults.length - successfulCompressions.length} 张照片压缩失败`);
    }

    return {
      results: compressionResults,
      statistics: {
        total: photos.length,
        successful: successfulCompressions.length,
        failed: compressionResults.length - successfulCompressions.length,
        averageReduction: avgReduction,
      },
    };
  } catch (error) {
    console.error("压缩过程发生错误:", error);
    this.$message.error("压缩过程发生错误，请重试");
    throw error;
  } finally {
    this.loadingStates.photos = false;
  }
}

// 高级压缩选项（支持更多格式和优化）
async function advancedCompressImage(file, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = "auto", // 'jpeg', 'png', 'webp', 'auto'
    progressive = true,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      try {
        // 计算缩放比例，保持宽高比
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        // 高质量绘制
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 确定输出格式
        let outputFormat = format;
        if (format === "auto") {
          outputFormat = file.type === "image/png" ? "image/png" : "image/jpeg";
        }

        // 压缩图片
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("压缩失败"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              blob: blob,
              originalSize: file.size,
              compressedSize: blob.size,
              reduction: (((file.size - blob.size) / file.size) * 100).toFixed(1),
              width: width,
              height: height,
            });
          },
          outputFormat,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("图片加载失败"));

    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

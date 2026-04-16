function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// 高级压缩函数（优化版本，使用 toBlob 提高性能）
export function compressImageAdvanced(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      reject(new Error("无效的文件对象"));
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let objectUrl = null;

    // 清理函数
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = function () {
      try {
        // 计算新尺寸，保持宽高比
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

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

        // 使用 toBlob 代替 toDataURL，性能更好
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("图片压缩失败"));
              return;
            }

            resolve({
              dataUrl: null, // 不再生成 dataURL，节省内存
              blob: blob,
              compressedSize: blob.size,
              name: file.name,
              width: width,
              height: height,
            });
          },
          mimeType,
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("图片加载失败"));
    };

    // 创建 object URL
    objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
}

// 优化的图片压缩函数，使用 canvas.toBlob 提高性能
function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("无效的文件对象"));
      return;
    }

    // 验证文件类型
    if (!file.type || !file.type.startsWith("image/")) {
      reject(new Error("不支持的文件类型，仅支持图片文件"));
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let objectUrl = null; // 用于跟踪创建的 URL，以便后续释放

    // 清理函数
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        // 计算新尺寸，保持宽高比
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const originalWidth = width;
        const originalHeight = height;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // 如果尺寸没有变化且质量已经是1.0，直接返回原文件
        if (width === originalWidth && height === originalHeight && quality >= 1.0) {
          cleanup();
          resolve({
            file: file,
            blob: file,
            dataUrl: null,
            originalSize: file.size,
            compressedSize: file.size,
            reduction: "0.0",
            skipped: true,
          });
          return;
        }

        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;

        // 高质量绘制设置
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, width, height);

        // 确定输出格式
        let mimeType = file.type || "image/jpeg";
        // 对于不支持的类型，默认使用 JPEG
        if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
          mimeType = "image/jpeg";
        }
        if (!file.name) {
          file.name = `image_${Date.now()}.jpg`; // 默认文件名，如果原文件没有名字
        }
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("图片压缩失败"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            // 计算压缩率
            const originalSize = file.size;
            const compressedSize = blob.size;
            const reduction = originalSize > 0 ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1) : "0.0";

            resolve({
              file: compressedFile,
              blob: blob,
              dataUrl: null, // 不再生成 dataURL，节省内存
              originalSize: originalSize,
              compressedSize: compressedSize,
              reduction: reduction,
              width: width,
              height: height,
            });
          },
          mimeType,
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("图片加载失败，请检查文件是否损坏"));
    };

    // 优先使用 FileReader，如果文件是 Blob URL 则使用 object URL
    if (file instanceof File || file instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        cleanup();
        reject(new Error("文件读取失败"));
      };
      reader.readAsDataURL(file);
    } else if (typeof file === "string") {
      // 如果是 URL 字符串
      img.src = file;
    } else {
      cleanup();
      reject(new Error("不支持的文件格式"));
    }
  });
}

async function urlToBlob(url) {
  if (typeof url !== "string") throw new TypeError("URL must be a string");
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error("Error converting URL to Blob:", error);
    throw error;
  }
}

// 获取文件对象（支持多种格式）
async function getFileFromPhoto(photo) {
  // 优先级：file > raw > blob > compressedFile > compressedBlob> url
  if (photo.file && photo.file instanceof File) {
    return photo.file;
  }
  if (photo.raw && photo.raw instanceof File) {
    return photo.raw;
  }
  if (photo.blob && photo.blob instanceof Blob) {
    return photo.blob;
  }
  if (photo.compressedFile && photo.compressedFile instanceof File) {
    return photo.compressedFile;
  }
  if (photo.compressedBlob && photo.compressedBlob instanceof Blob) {
    return photo.compressedBlob;
  }
  if (photo.url && typeof photo.url === "string") {
    const blob = await urlToBlob(photo.url);
    if (blob) {
      return blob;
    }
  }
  return null;
}

// 执行批量压缩
export async function batchCompressPhotos(photos, options = {}) {
  if (!this || !this.loadingStates) {
    throw new Error("batchCompressPhotos 必须在 Vue 组件上下文中调用");
  }

  this.loadingStates.photos = true;

  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    batchSize = 3, // 并发压缩数量
  } = options;

  try {
    console.log(`开始压缩 ${photos.length} 张照片`, { quality, maxWidth, maxHeight });

    const compressionResults = [];
    const totalPhotos = photos.length;
    let processedCount = 0;

    // 分批处理，避免内存压力过大
    for (let batchStart = 0; batchStart < totalPhotos; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalPhotos);
      const batch = photos.slice(batchStart, batchEnd);

      // 并行处理当前批次
      const batchPromises = batch.map(async (photo, batchIndex) => {
        const globalIndex = batchStart + batchIndex;
        const file = await getFileFromPhoto(photo);

        if (!file) {
          console.warn(`照片 ${photo.name || photo.id} 没有可用的文件数据，跳过`);
          compressionResults.push({
            index: globalIndex,
            photo: photo,
            success: false,
            error: "缺少文件数据",
            skipped: true,
          });
          return;
        }

        // 初始化进度状态
        if (!photo.loading) {
          photo.loading = true;
        }
        photo.compressionProgress = 0;

        try {
          // 更新进度
          photo.compressionProgress = 20;

          // 执行压缩
          const result = await compressImage(file, quality, maxWidth, maxHeight);

          // 如果跳过了压缩（尺寸和质量都没变）
          if (result.skipped) {
            photo.loading = false;
            photo.compressionProgress = 100;
            compressionResults.push({
              index: globalIndex,
              photo: photo,
              success: true,
              reduction: result.reduction,
              skipped: true,
            });
            console.log(`照片 ${photo.name} 无需压缩（尺寸和质量未变化）`);
            return;
          }

          photo.compressionProgress = 80;

          // 创建预览 URL（仅在需要时）
          let previewUrl = null;
          if (photo.url && photo.url.startsWith("blob:")) {
            // 如果原 URL 是 blob，需要释放
            try {
              URL.revokeObjectURL(photo.url);
            } catch {
              // 忽略错误，继续执行
            }
          }

          // 更新照片信息
          photo.originalSize = result.originalSize;
          photo.size = result.compressedSize;
          photo.compressed = true;
          photo.compressedFile = result.file;
          photo.compressedBlob = result.blob;
          photo.reduction = result.reduction;
          photo.compressionProgress = 100;
          photo.loading = false;

          // 更新预览 URL
          if (photo.url) {
            previewUrl = URL.createObjectURL(result.blob);
            photo.url = previewUrl;
            photo.preview = previewUrl;
          }

          compressionResults.push({
            index: globalIndex,
            photo: photo,
            success: true,
            reduction: result.reduction,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
          });

          processedCount++;
          const progress = Math.round((processedCount / totalPhotos) * 100);
          console.log(`[${progress}%] 压缩照片 ${processedCount}/${totalPhotos}: ${photo.name || photo.id}`, `${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`, `减小 ${result.reduction}%`);
        } catch (error) {
          console.error(`压缩照片失败 ${photo.name || photo.id}:`, error);
          compressionResults.push({
            index: globalIndex,
            photo: photo,
            success: false,
            error: error.message || "压缩失败",
          });

          photo.loading = false;
          photo.compressionProgress = 0;
        }
      });

      // 等待当前批次完成
      await Promise.allSettled(batchPromises);

      // 批次间短暂延迟，避免 UI 卡顿
      if (batchEnd < totalPhotos) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 计算统计信息
    const successfulCompressions = compressionResults.filter((r) => r.success);
    const skippedCompressions = compressionResults.filter((r) => r.skipped);
    const failedCompressions = compressionResults.filter((r) => !r.success && !r.skipped);

    const totalReduction = successfulCompressions.filter((r) => !r.skipped).reduce((sum, r) => sum + parseFloat(r.reduction || 0), 0);
    const avgReduction = successfulCompressions.filter((r) => !r.skipped).length > 0 ? (totalReduction / successfulCompressions.filter((r) => !r.skipped).length).toFixed(1) : "0.0";

    // 更新本地照片列表（只更新压缩成功的）
    const compressedPhotos = photos.filter((p, index) => {
      const result = compressionResults[index];
      return result && result.success;
    });

    // 更新 Vue 数据
    if (this.localPhotos && Array.isArray(this.localPhotos)) {
      compressedPhotos.forEach((compressedPhoto) => {
        const index = this.localPhotos.findIndex((p) => p.id === compressedPhoto.id);
        if (index !== -1) {
          // 使用 Vue.set 确保响应式更新
          this.$set(this.localPhotos, index, compressedPhoto);
        }
      });
    }

    const stats = {
      total: totalPhotos,
      successful: successfulCompressions.length,
      skipped: skippedCompressions.length,
      failed: failedCompressions.length,
      averageReduction: avgReduction,
    };

    console.log("压缩完成", stats);

    // 显示结果消息
    if (successfulCompressions.length > 0) {
      const message = skippedCompressions.length > 0 ? `成功处理 ${successfulCompressions.length} 张照片（${skippedCompressions.length} 张无需压缩），平均减小 ${avgReduction}%` : `成功压缩 ${successfulCompressions.length} 张照片，平均减小 ${avgReduction}%`;
      this.$message.success(message);
    }

    if (failedCompressions.length > 0) {
      this.$message.warning(`${failedCompressions.length} 张照片压缩失败`);
    }

    return {
      results: compressionResults,
      statistics: stats,
    };
  } catch (error) {
    console.error("压缩过程发生错误:", error);
    this.$message.error(`压缩过程发生错误: ${error.message || "请重试"}`);
    throw error;
  } finally {
    this.loadingStates.photos = false;
  }
}

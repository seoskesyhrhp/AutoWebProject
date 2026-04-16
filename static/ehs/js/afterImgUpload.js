import { TimeUtils } from "./timeUtils.js";

// 常量配置
const CONFIG = {
  FONT_STYLE: "normal",
  UPDATE_INTERVAL: 1000,
  UPLOAD_TIMEOUT: 300000,
  FONT_SIZE_RATIO: 0.023,
  MIN_FONT_SIZE: 18,
  LINE_GAP_RATIO: 0.5,
  BOTTOM_PADDING_RATIO: 1.2,
  LATITUDE_RANGE: { min: 31.260001, max: 31.269999 },
  LONGITUDE_RANGE: { min: 120.700001, max: 120.799999 },
  WEEKDAYS: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
};

// 状态管理
class StateManager {
  constructor() {
    this.latitude = 0;
    this.longitude = 0;
    this.objData = [];
  }

  updateCoordinates() {
    this.latitude = CONFIG.LATITUDE_RANGE.min + Math.random() * (CONFIG.LATITUDE_RANGE.max - CONFIG.LATITUDE_RANGE.min);
    this.longitude = CONFIG.LONGITUDE_RANGE.min + Math.random() * (CONFIG.LONGITUDE_RANGE.max - CONFIG.LONGITUDE_RANGE.min);
  }

  addObjData(image, moduleId, dateIndex) {
    this.objData.push({
      [image.formData.obj.CheckAreaCode]: {
        CheckAreaCode: image.formData.obj.CheckAreaCode,
        ct_code: image.formData.obj.TemplateList[0].CTCode,
        path: image.name === "_capture.jpg" ? `${moduleId}_capture_.jpg` : image.name,
        createTime: dateIndex,
      },
    });
  }

  getObjData() {
    return this.objData;
  }

  clearObjData() {
    this.objData = [];
  }
}

// 水印工具
class WatermarkUtils {
  static setupWatermarkStyle(ctx, canvas) {
    const baseSize = Math.max(canvas.width, canvas.height);
    const fontSize = Math.max(CONFIG.MIN_FONT_SIZE, Math.floor(baseSize * CONFIG.FONT_SIZE_RATIO));

    ctx.fillStyle = "white";
    ctx.font = `${CONFIG.FONT_STYLE} ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";

    return fontSize;
  }

  static drawWatermark(ctx, canvas, line1, line2) {
    const fontSize = this.setupWatermarkStyle(ctx, canvas);
    const lineGap = Math.floor(fontSize * CONFIG.LINE_GAP_RATIO);
    const adjustY = Math.floor(fontSize * 0.2);
    const centerX = Math.floor(canvas.width / 2);
    const bottomPadding = Math.floor(fontSize * CONFIG.BOTTOM_PADDING_RATIO);
    const maxTextWidth = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    const padding = Math.floor(centerX - maxTextWidth / 2);

    const y2 = canvas.height - bottomPadding + adjustY;
    const y1 = y2 - (lineGap + fontSize) - adjustY;

    ctx.fillText(line1, padding, y1);
    ctx.fillText(line2, padding, y2);
  }
}

// 时间格式化工具
class TimeFormatter {
  static formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const formattedDate = dateFormatter.format(date).replace(/\//g, "-");
    const weekday = CONFIG.WEEKDAYS[date.getDay()];

    return `${formattedDate} ${weekday}`;
  }
}

// 图片处理器
class ImageProcessor {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  async imageToBlob(src, timestamp, type = "image/png") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const watermarkText = this.generateWatermarkText(timestamp);
          WatermarkUtils.drawWatermark(ctx, canvas, watermarkText.line1, watermarkText.line2);

          canvas.toBlob((blob) => {
            blob ? resolve(blob) : reject(new Error("Blob转换失败"));
          }, type);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = src;
    });
  }

  generateWatermarkText(timestamp) {
    return {
      line1: `纬度:${this.stateManager.latitude.toFixed(6)} 经度:${this.stateManager.longitude.toFixed(6)}`,
      line2: TimeFormatter.formatDateTime(timestamp),
    };
  }
}

// 上传服务
class UploadService {
  constructor(stateManager, imageProcessor) {
    this.stateManager = stateManager;
    this.imageProcessor = imageProcessor;
  }

  RandomString() {
    let letters = "";
    for (let i = 0; i < 6; i++) {
      letters += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    return letters;
  }

  RandomNumber() {
    let numbers = "";
    for (let i = 0; i < 6; i++) {
      numbers += Math.floor(Math.random() * 10);
    }
    return numbers;
  }

  generateRandomString() {
    const combined = (this.RandomString() + this.RandomNumber()).split("");
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join("");
  }

  async simulateUpload(image, moduleId, timestamp, maxRetries = 3) {
    console.log("模拟上传开始", moduleId);
    const params = {
      CheckAreaCode: moduleId,
      ct_code: image.formData.obj.TemplateList[0].CTCode,
      CheckStartDate: image.formData.obj.CheckStartDate,
    };

    try {
      const blob = await this.imageProcessor.imageToBlob(image.url, timestamp);
      const fileName = image.name === "_capture.jpg" ? `${moduleId}_capture_.jpg` : image.name;

      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("object_code", JSON.stringify(params));

      const uploadWithRetry = async (retryCount = 0) => {
        try {
          const url = `/api/SaveAfterPhotos/?code=${moduleId}&count=${retryCount}`;
          const response = await axios.post(url, formData, {
            timeout: CONFIG.UPLOAD_TIMEOUT,
          });
          console.log("上传成功:", response.data.data);
          return response;
        } catch (error) {
          if (retryCount < maxRetries) {
            console.warn(`上传失败，正在重试 (${retryCount + 1}/${maxRetries}):`, error.message);
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return uploadWithRetry(retryCount + 1);
          }
          throw new Error(`上传失败，已重试${maxRetries}次: ${error.message}`);
        }
      };

      return await uploadWithRetry();
    } catch (error) {
      console.error("图片处理或上传过程出错:", error);
      throw error;
    }
  }

  async saveObjects() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const url = `/api/SaveObject/?count=${retryCount}`;
        const response = await axios.post(url, this.stateManager.getObjData());
        console.log("保存对象结果:", response.data);
        return response;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error(`保存失败，已重试${maxRetries}次，错误信息:`, error);
          throw error; // 抛出最后一次的错误
        }
        console.log(`保存失败，正在进行第${retryCount}次重试...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

class FileManager {
  constructor() {
    this.url = "/api/clearDirectory/";
  }

  async clearDirectory() {
    const form = new FormData();
    form.append("type", "dir");
    form.append("dir", "image/ehs");
    form.append("filename", "");

    try {
      const response = await axios.post(this.url, form);
      console.log("目录清理结果:", response.data);
      return response;
    } catch (error) {
      console.error("目录清理失败:", error);
      throw error;
    }
  }
}

// 上传管理器
class UploadManager {
  constructor(stateManager, uploadService) {
    this.stateManager = stateManager;
    this.uploadService = uploadService;
  }

  async uploadSelectedImages(modules, moduleId, timestamp) {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      this.showWarning("未找到指定模块");
      return;
    }

    const selectedImages = module.images.filter((img) => img.selected);
    if (selectedImages.length === 0) {
      this.showWarning("请先选择要上传的图片");
      return;
    }

    for (const image of selectedImages) {
      console.log("正在上传图片:", image, moduleId);
      this.stateManager.addObjData(image, moduleId, timestamp);
      await this.uploadService.simulateUpload(image, moduleId, timestamp);
    }
  }

  showWarning(message) {
    console.log({ message, type: "warning" });
  }
}

// 批量处理器
class BatchProcessor {
  constructor(_self, stateManager, uploadManager, uploadService) {
    this.self = _self;
    this.stateManager = stateManager;
    this.uploadManager = uploadManager;
    this.uploadService = uploadService;
  }

  async processModules(modulesWithSelected, modules, timestamps) {
    try {
      const promises = modulesWithSelected.map((module, index) => this.processSingleModule(modules, module.id, timestamps[index]));

      await Promise.allSettled(promises);
      await this.uploadService.saveObjects();
      return true;
    } catch (error) {
      console.log("批量处理出错:", error);
      return false;
    } finally {
      console.log("initImgUpload", this.self);
      this.self.afterBtnStatus = false;
    }
  }

  async processSingleModule(modules, moduleId, timestamp) {
    return this.uploadManager.uploadSelectedImages(modules, moduleId, timestamp);
  }
}

// 主入口类
export class ImageUploadController {
  constructor(_self) {
    this.self = _self;
    this.stateManager = new StateManager();
    this.imageProcessor = new ImageProcessor(this.stateManager);
    this.uploadService = new UploadService(this.stateManager, this.imageProcessor);
    this.uploadManager = new UploadManager(this.stateManager, this.uploadService);
    this.batchProcessor = new BatchProcessor(this.self, this.stateManager, this.uploadManager, this.uploadService);
    this.fileManager = new FileManager();

    this.initAutoUpdate();
  }

  initAutoUpdate() {
    this.stateManager.updateCoordinates();
    setInterval(() => this.stateManager.updateCoordinates(), CONFIG.UPDATE_INTERVAL);
  }

  async initImgUpload(modulesWithSelected, modules) {
    if (!modulesWithSelected?.length || !modules?.length) {
      console.warn("模块数据为空");
      return;
    }

    this.stateManager.clearObjData();

    await this.fileManager.clearDirectory();

    const timestamps = this.generateTimestamps(modulesWithSelected.length);
    console.log("上传时间序列:", timestamps);

    return await this.batchProcessor.processModules(modulesWithSelected, modules, timestamps);
  }

  generateTimestamps(count) {
    return Array.from({ length: count }, (_, i) => TimeUtils.getTimeAfter(30 + 3 * i));
  }
}

// 保持向后兼容的导出
let imageUploadController;

export function initImgUpload(modulesWithSelected, modules) {
  try {
    if (!imageUploadController) {
      imageUploadController = new ImageUploadController(this);
    }
    return imageUploadController.initImgUpload(modulesWithSelected, modules);
  } catch (e) {
    console.error("初始化图片上传出错:", e);
    throw e;
  }
}

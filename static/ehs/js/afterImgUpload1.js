import { TimeUtils } from "./timeUtils.js";

const fontStyleSettings = "normal"; // bold
let latitude, longitude;

function generateRandomLatitude() {
  return 31.260001 + Math.random() * (31.269999 - 31.260001);
}

function generateRandomLongitude() {
  return 120.700001 + Math.random() * (120.799999 - 120.700001);
}

function updateWatermark() {
  latitude = generateRandomLatitude();
  longitude = generateRandomLongitude();
}

updateWatermark();
setInterval(updateWatermark, 1000);

function setupWatermarkStyle(ctx, canvas) {
  const baseSize = Math.max(canvas.width, canvas.height);
  const fontSize = Math.max(18, Math.floor(baseSize * 0.023));

  ctx.fillStyle = "white";
  ctx.font = `${fontStyleSettings} ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
}

// 获取水印文本
function getWatermarkText(times) {
  const now = new Date(times);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formattedDate = dateFormatter.format(now).replace(/\//g, "-");
  const weekday = weekdays[now.getDay()];

  return {
    line1: `纬度:${latitude.toFixed(6)} 经度:${longitude.toFixed(6)}`,
    line2: `${formattedDate} ${weekday}`,
  };
}

function getWatermarkText_one() {
  const now = new Date();
  const minute = new Date(now.getTime() + 60 * 1000);
  const date = new Date(minute);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

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
  const weekday = weekdays[date.getDay()];

  return {
    line1: `纬度:${latitude.toFixed(6)} 经度:${longitude.toFixed(6)}`,
    line2: `${formattedDate} ${weekday}`,
  };
}

// 绘制水印文本
function drawWatermarkText(ctx, canvas, line1, line2) {
  const baseSize = Math.max(canvas.width, canvas.height);
  const fontSize = Math.max(18, Math.floor(baseSize * 0.023));
  const lineGap = Math.floor(fontSize * 0.5);
  const adjustY = Math.floor(fontSize * 0.2);
  const centerX = Math.floor(canvas.width / 2);
  const bottomPadding = Math.floor(fontSize * 1.2);
  const maxTextWidth = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
  const padding = Math.floor(centerX - maxTextWidth / 2);

  const y2 = canvas.height - bottomPadding + adjustY;
  const y1 = y2 - (lineGap + fontSize) - adjustY;

  ctx.fillText(line1, padding, y1);
  ctx.fillText(line2, padding, y2);
}

async function imageToBlob(src, times, type = "image/png") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setupWatermarkStyle(ctx, canvas);

      const { line1, line2 } = getWatermarkText(times);

      drawWatermarkText(ctx, canvas, line1, line2);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Blob 转换失败"));
        }
      }, type);
    };

    img.onerror = reject;
    img.src = src;
  });
}

async function simulateUpload(image, moduleId, times) {
  const TIMEOUT = 150000;
  const params = {
    CheckAreaCode: moduleId,
    ct_code: image.formData.obj.TemplateList[0].CTCode,
    CheckStartDate: image.formData.obj.CheckStartDate,
  };
  const name = image.name;
  const url = image.url;
  const BlobInfo = await imageToBlob(url, times);
  const formData = new FormData();
  formData.append("file", BlobInfo, name);
  formData.append("object_code", JSON.stringify(params));
  const obj = {
    CheckAreaCode: moduleId,
    ct_code: image.formData.obj.TemplateList[0].CTCode,
    path: name,
  };
  const saveObj = await axios.post("/api/SaveObject/", obj, { timeout: TIMEOUT });
  const response = await axios.post("/api/SaveAfterPhotos/", form, { timeout: TIMEOUT });
  console.log(saveObj.data, response.data);
}

async function uploadSelectedImages(modules, moduleId, times, retryCount = 0) {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) {
    return;
  }
  const selectedImages = module.images.filter((img) => img.selected);
  if (selectedImages.length === 0) {
    console.log({
      message: "请先选择要上传的图片",
      type: "warning",
    });
    return;
  }
  for (let i = 0; i < selectedImages.length; i++) {
    const image = selectedImages[i];
    await simulateUpload(image, moduleId, times);
  }
}

function FileEntries(modulesWithSelected, modules, times) {
  for (const [index, module] of modulesWithSelected.entries()) {
    console.log(index, module);
    uploadSelectedImages(modules, module.id, times[index]);
  }
}

export function initImgUpload(modulesWithSelected, modules) {
  const len = modulesWithSelected.length;
  const times = [];

  for (let i = 0; i < len; i++) {
    times.push(TimeUtils.getTimeAfter(30 + 3 * i));
  }
  console.log(times);
  FileEntries(modulesWithSelected, modules, times);
}

/*
*  console.log("当前时间:", TimeUtils.getNow());
  console.log("30分钟后:", TimeUtils.get30MinutesLater());
  console.log("1小时后:", TimeUtils.getTimeAfter(60));
  console.log("自定义格式:", TimeUtils.getNow("YYYY年MM月DD日 HH:mm"));
*/

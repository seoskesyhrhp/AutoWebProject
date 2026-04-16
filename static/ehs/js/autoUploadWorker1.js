// Web Worker: 处理图片上传，避免在主线程中阻塞 UI
/* eslint-disable no-restricted-globals */

self.onmessage = async function (event) {
  const { data } = event || {};
  if (!data || data.type !== "UPLOAD_IMAGE") return;

  const { payload } = data;
  const { id, name, params, endpoint, timeout = 150000, blob } = payload || {};

  if (!blob || !endpoint || !params || !id) {
    self.postMessage({
      type: "UPLOAD_RESULT",
      payload: {
        id,
        success: false,
        error: "缺少必要的上传参数",
      },
    });
    return;
  }

  try {
    const form = new FormData();
    form.append("object_code", JSON.stringify(params));
    form.append("file", blob, name || "image.jpg");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal: controller.signal,
      credentials: "include", // 携带 Cookie，兼容现有认证/CSRF 策略
    });

    clearTimeout(timer);

    let success = false;
    let code = null;

    try {
      const json = await response.json();
      code = json && typeof json.code !== "undefined" ? json.code : null;
      success = code === 200;
    } catch {
      // 如果后端不是 JSON，退化为 HTTP 状态码判断
      success = response.ok;
    }

    self.postMessage({
      type: "UPLOAD_RESULT",
      payload: {
        id,
        success,
        status: response.status,
        code,
      },
    });
  } catch (error) {
    self.postMessage({
      type: "UPLOAD_RESULT",
      payload: {
        id,
        success: false,
        error: error && error.message ? error.message : String(error),
      },
    });
  }
};

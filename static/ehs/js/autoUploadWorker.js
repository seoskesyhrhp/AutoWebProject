// Web Worker: 处理图片上传，避免在主线程中阻塞 UI
/* eslint-disable no-restricted-globals */

importScripts("/static/upload/axios.min.js");

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

    const response = await axios.post(endpoint, form, {
      withCredentials: true,
      timeout,
    });

    let success = false;
    let code = null;
    const status = response.status;

    const data = response && response.data;
    if (data && typeof data === "object") {
      code = typeof data.code !== "undefined" ? data.code : null;
      success = code === 200;
    } else {
      success = status >= 200 && status < 300;
    }

    self.postMessage({
      type: "UPLOAD_RESULT",
      payload: {
        id,
        success,
        status,
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

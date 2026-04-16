// 创建一个Axios实例
export const axiosInstance = axios.create();

// 用于存储所有取消令牌源
const pendingRequests = new Map();

// 添加请求到pendingRequests
axiosInstance.interceptors.request.use(
  (config) => {
    const cancelTokenSource = axios.CancelToken.source();
    config.cancelToken = cancelTokenSource.token;
    const requestId = config.url + "&" + new Date().getTime(); // 你可以根据需要自定义请求ID
    pendingRequests.set(requestId, cancelTokenSource);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器中移除请求
axiosInstance.interceptors.response.use(
  (response) => {
    const requestId = response.config.url + "&" + new Date().getTime();
    pendingRequests.delete(requestId);
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log("Request canceled", error.message);
    } else {
      console.error("Error", error);
    }
    const requestId = error.config?.url + "&" + new Date().getTime();
    pendingRequests.delete(requestId);
    return Promise.reject(error);
  }
);

// 取消所有请求的方法
export function cancelAllPendingRequests(message = "Operation canceled by the user.") {
  pendingRequests.forEach((cancelTokenSource) => {
    cancelTokenSource.cancel(message);
  });
  pendingRequests.clear();
}

// 示例：使用axiosInstance发送请求
// axiosInstance
//   .get("https://api.example.com/data")
//   .then((response) => {
//     console.log(response.data);
//   })
//   .catch((error) => {
//     console.error("Error fetching data:", error);
//   });

// 调用取消所有请求的方法
// cancelAllPendingRequests('All pending requests are being canceled.');

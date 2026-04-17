window.addEventListener("DOMContentLoaded", function () {
  const envText = document.getElementById("envText");
  const timeText = document.getElementById("timeText");
  const dateText = document.getElementById("dateText");
  const healthStatus = document.getElementById("healthStatus");
  const getLinks = document.getElementById("getLinks");

  const GET_ENDPOINTS = ["/", "/home", "/task", "/health", "/index", "/ehs", "/ehs/index", "/ehs/taskImg", "/ehs/watermark", "/ehs/chunk", "/system", "/ehs/status/", "/ehs/status/help", "/ehs/json/", "/api/jobs/{id}", "/requestDetailData?ctCode=CT260112000027&enableTest=false"];

  function updateClock() {
    const now = new Date();
    timeText.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
  }

  function detectEnv() {
    const host = location.hostname || "";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    envText.textContent = isLocal ? "LOCAL" : "PROD";
  }

  async function checkHealth() {
    try {
      const r = await fetch("/health");
      if (!r.ok) {
        throw new Error("HTTP " + r.status);
      }
      const data = await r.json();
      healthStatus.classList.remove("error");
      healthStatus.textContent = "健康检查: " + (data.status || "ok");
    } catch (e) {
      healthStatus.classList.add("error");
      healthStatus.textContent = "健康检查失败: " + e.message;
    }
  }

  /**
   * 获取启动信息并显示到页面
   */
  async function loadBootInfo() {
    try {
      const r = await fetch("/api/info/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) {
        throw new Error("HTTP " + r.status);
      }
      const result = await r.json();
      if (result.code === 200 && result.data && result.data.date) {
        // 设置启动时间到 dateText
        if (dateText) {
          dateText.textContent = result.data.date;
        }
        // 同时更新环境文本
        if (result.data.name && envText) {
          envText.textContent = result.data.name.toUpperCase();
        }
        console.log("[BootInfo] 启动时间:", result.data.date);
      } else {
        console.warn("[BootInfo] 未获取到启动时间");
      }
    } catch (e) {
      console.error("[BootInfo] 获取启动信息失败:", e.message);
    }
  }

  function renderGetLinks() {
    if (!getLinks) return;
    getLinks.innerHTML = GET_ENDPOINTS.map(function (path) {
      const href = path.includes("{") ? "#" : path;
      const title = path.includes("{") ? "该链接包含路径参数，请先替换参数后再访问" : "点击访问该 GET 接口";
      return '<a href="' + href + '" title="' + title + '">' + "GET " + path + "</a>";
    }).join("");
  }

  detectEnv();
  updateClock();
  setInterval(updateClock, 1000);
  renderGetLinks();
  checkHealth();
  loadBootInfo(); // 加载启动信息
});

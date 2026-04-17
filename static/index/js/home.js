window.addEventListener("DOMContentLoaded", function () {
  const envText = document.getElementById("envText");
  const timeText = document.getElementById("timeText");
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
});

let expirationTime = null;
const maxNumber = 60 * 30 * 1000; // 1小时，以毫秒为单位
let currentPageName = null;

function getPageName() {
  if (currentPageName === null) {
    const { pathname } = window.location;
    const name_str = pathname.split("/");
    if (name_str.length === 0) return "";
    currentPageName = pathname.endsWith("/") ? name_str.slice(-2, -1)[0] || "" : name_str[name_str.length - 1];
  }
  return `${currentPageName}_status`;
}

const msToMinutesAndSeconds = (milliseconds) => `${Math.floor(milliseconds / 60000)}分${Math.round((milliseconds % 60000) / 1000)}秒`;

window.onload = () => {
  const app = document.querySelector("#app");
  const name = getPageName();
  expirationTime = localStorage.getItem(name);
  if (expirationTime) {
    const timeSinceLastHidden = new Date().getTime() - expirationTime;
    if (!app) console.log(`${name}:${msToMinutesAndSeconds(timeSinceLastHidden)}`);
    app && app.__vue__?.$message.warning(`${name}:${msToMinutesAndSeconds(timeSinceLastHidden)}`);
    if (timeSinceLastHidden > maxNumber) {
      app &&
        setTimeout(() => {
          app.__vue__.$message.warning("超时");
        }, 100);
      localStorage.removeItem(name);
      if (/Android/.test(navigator.userAgent && localStorage.getItem(name))) {
        localStorage.removeItem(name);
        setTimeout(() => {
          jsBridge.exit(true);
        }, 3000);
      } else {
        setTimeout(() => {
          location.reload(true);
        }, 1000);
      }
    }
  }
};

window.addEventListener("visibilitychange", () => {
  const app = document.querySelector("#app");
  const name = getPageName();
  if (document.visibilityState === "hidden") {
    app && app.__vue__?.$message.warning("应用已切换至后台");
    expirationTime = new Date().getTime();
    localStorage.setItem(name, expirationTime);
  } else {
    const storage = localStorage.getItem(name);
    if (storage) {
      const currentTime = new Date().getTime();
      const timeSinceLastHidden = currentTime - parseInt(storage, 10); // 确保将存储的值转换为整数
      app && app.__vue__?.$message.warning(`应用已切换至前台 ${msToMinutesAndSeconds(timeSinceLastHidden)}`);
      if (timeSinceLastHidden > maxNumber) {
        app &&
          setTimeout(() => {
            app.__vue__.$message.warning("超时");
          }, 100);
        localStorage.removeItem(name);
        if (/Android/.test(navigator.userAgent)) {
          jsBridge.exit(true);
        } else {
          setTimeout(() => {
            location.reload(true);
          }, 1000);
        }
      }
    }
  }
});

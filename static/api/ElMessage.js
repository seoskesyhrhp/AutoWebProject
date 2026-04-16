var FoldingEnable = false;
function clearDom() {
  const elList = document.querySelectorAll(".el-badge");
  const lastEl = elList[elList.length - 1];
  if (lastEl) {
    lastEl.remove();
  }
}
clearDom.all = function () {
  const elList = document.querySelectorAll(".el-badge");
  const list = [...elList];
  list.splice(0, 1);
  list.forEach((el) => el.remove());
};
window.clearDom = clearDom;

function createElement(options) {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("App element not found");
    return;
  }

  let valueIndex = app.__vue__?.valueIndex || 0;
  valueIndex = Math.max(valueIndex, 0);
  if (valueIndex > 200) {
    valueIndex = 0;
    return;
  }
  const existingDom = document.querySelector(".el-badge");
  if (!existingDom) {
    app.__vue__.valueIndex = 0;
    valueIndex = 0;
  }

  const delay = (options.duration || 2000) + 100 * valueIndex;

  const badge = document.createElement("div");
  badge.className = `el-badge item ElBadge`;

  function createMessageElement(options) {
    // console.log(options, "options 配置信息");
    if (!options.type) options.type = "info";

    const div = document.createElement("div");
    const offset = options.offset || 0;
    div.style.cssText = `top: ${20 + 70 * offset}px; z-index: 200${valueIndex}`;
    div.className = `el-message el-message--${options.type}`;
    div.role = "alert";

    const icon = document.createElement("i");
    icon.className = `el-message__icon el-icon-${options.type}`;

    const content = document.createElement("p");
    content.className = "el-message__content";
    content.innerHTML = options.message;

    const sup = document.createElement("sup");
    sup.className = "el-badge__content is-fixed";
    sup.style.cssText = `top: 11px; right: 6%; -webkit-transform: translateY(-50%) translateX(100%);transform: translateY(-50%) translateX(50%)`;
    sup.innerHTML = valueIndex;
    sup.dataset.index = valueIndex;

    div.appendChild(sup);
    div.appendChild(icon);
    div.appendChild(content);
    return div;
  }

  const messageElement = createMessageElement(options);
  badge.appendChild(messageElement);
  document.body.appendChild(badge);

  valueIndex++;
  app.__vue__.valueIndex = valueIndex;

  setTimeout(() => {
    valueIndex--;
    app.__vue__.valueIndex = valueIndex;
    // Ensure clearDom is defined or remove this part
    if (typeof clearDom === "function") {
      clearDom();
    } else {
      console.error("clearDom function is not defined");
    }
  }, delay);
}

function showMessage(type, options) {
  const FoldingEnable = options?.FoldingEnable || false;
  const app = document.querySelector("#app");
  const doms = document.querySelectorAll(".ElBadge");

  if (typeof options === "string") {
    options = { message: options, type, FoldingEnable: true };
    if (type === "info") {
      return createElement(options);
    }
  }

  if (FoldingEnable && typeof options === "object") {
    return createElement(options);
  }
  app?.__vue__?.$message({ message: options.message, type: options.type, offset: 20 + 70 * doms?.length > 150 ? 160 : 20 + 70 * doms?.length || 20 });
}

export function ElMessage(options) {
  if (!options) return;
  if (options.type === "info" || options.type === "success" || options.type === "warning" || options.type === "error") {
    showMessage(options.type, options);
  } else {
    showMessage("info", options);
  }
}
ElMessage.info = (options) => showMessage("info", options);
ElMessage.success = (options) => showMessage("success", options);
ElMessage.warning = (options) => showMessage("warning", options);
ElMessage.error = (options) => showMessage("error", options);

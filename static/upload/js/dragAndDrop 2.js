function domainNameVerification() {
  const { pathname } = window.location;
  if (pathname.includes("pake/search")) {
    document.body.style.height = window.innerHeight + "px";
  }
}
window.addEventListener("DOMContentLoaded", function () {
  Date.prototype.format = function (fmt) {
    var o = {
      "y+": this.getFullYear, //年
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return fmt;
  };
  const { pathname } = window.location;
  if (pathname.includes("pake/indexTable.html")) {
    setInterval("document.querySelector('.time').innerHTML = (new Date()).format('yyyy年MM月dd日 hh时mm分ss秒');", 1000);
  }
});

window.addEventListener("load", function () {
  const menuAction = document.querySelector(".menuAction");
  if (!menuAction) return;
  domainNameVerification();
  let initialTouchX, initialTouchY, initialElementX, initialElementY;
  let isDragging = false;
  window.addEventListener("resize", function (event) {
    menuAction.style.left = `${innerWidth / 2}px`;
    menuAction.style.top = `${innerHeight / 2}px`;
  });
  // console.log("menuAction", menuAction);
  menuAction.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    initialTouchX = touch.clientX;
    initialTouchY = touch.clientY;
    initialElementX = menuAction.offsetLeft;
    initialElementY = menuAction.offsetTop;
    isDragging = true;
  });

  menuAction.addEventListener("touchmove", (event) => {
    if (!isDragging) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - initialTouchX;
    const deltaY = touch.clientY - initialTouchY;

    const newX = initialElementX + deltaX;
    const newY = initialElementY + deltaY;
    if (newX > window.innerWidth + 20 || newY > document.body.getBoundingClientRect().height + 20) return;
    menuAction.style.left = `${newX}px`;
    menuAction.style.top = `${newY}px`;
    localStorage.setItem("style", JSON.stringify({ x: newX, y: newY }));

    event.preventDefault(); // 阻止默认行为，避免页面滚动
  });

  menuAction.addEventListener("touchend", () => {
    isDragging = false;
    menuAction.style.opacity = 0.4;
    // 这里可以添加拖拽结束后的处理逻辑
  });
  menuAction.addEventListener("mousedown", (e) => {
    let x = e.pageX - menuAction.offsetLeft;
    let y = e.pageY - menuAction.offsetTop;
    // console.log({ title: "mousedown", x, y });
    window.onmousemove = (e) => {
      const cx = e.pageX - x;
      const cy = e.pageY - y;
      // console.log({ title: "onmousedown", cx, cy, e });
      if (cx > window.innerWidth + 20 || cy > document.body.getBoundingClientRect().height + 20) return;
      menuAction.style.left = cx + "px";
      menuAction.style.top = cy + "px";
      menuAction.style.opacity = 1;
      document.onselectstart = function () {
        return false;
      };
    };
    window.onmouseup = () => {
      window.onmousemove = null;
      window.onmouseup = null;
      menuAction.style.opacity = 0.4;
      document.onselectstart = function () {
        return true;
      };
    };
  });
});

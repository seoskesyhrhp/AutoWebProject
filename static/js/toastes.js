const toast = function (params) {
  const time = params.time || 1500;
  const type = params.type || "normal";
  const el = document.createElement("div");
  el.setAttribute("class", "web-toast " + type);
  el.innerHTML = params.message;
  document.body.appendChild(el);
  el.style.display = "block";
  el.classList.add("fadeIn");
  setTimeout(function () {
    el.classList.remove("fadeIn");
    el.classList.add("fadeOut");
    el.addEventListener(
      "animationend",
      function () {
        document.body.removeChild(el);
      },
      { once: true }
    );
    el.addEventListener(
      "webkitAnimationEnd",
      function () {
        document.body.removeChild(el);
      },
      { once: true }
    );
  }, time);
};

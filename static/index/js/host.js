window.addEventListener("DOMContentLoaded", function () {
    const domPort = document.querySelector(".port");
    if (!domPort) {
        return;
    }
    domPort.innerHTML = location.port;
});
function getStylesheetLinks() {
  const urlPath = window.location.pathname;
  const urlPathArray = urlPath.split("/");
  const urlStr = urlPathArray.pop().split(".").shift() || urlPathArray.pop();
  const defaultStylesheetArray = ["index", "bootstrap", "PseudoSelectors"];
  const StylesheetLinkMap = {
    search: ["weather", ...defaultStylesheetArray],
    index: ["elevator", "nprogress", ...defaultStylesheetArray],
  };
  const defaultLinkArray = ["/static/upload/index.css", "/static/upload/css/bootstrap-icons.min.css", "/static/upload/css/PseudoSelectors.css"];
  const linkMap = {
    search: ["/static/css/weather.css", ...defaultLinkArray],
    index: ["/static/upload/elevator.css", "/static/upload/css/nprogress.css", ...defaultLinkArray],
  };
  const mainStylesheetLinkArray = StylesheetLinkMap[urlStr] || defaultStylesheetArray;
  const links = linkMap[urlStr] || defaultLinkArray;
  return { mainStylesheetLinkArray, links, urlStr };
}
function addPrimary(callback, deley = 1000) {
  return setTimeout(callback, deley);
}

document.addEventListener("DOMContentLoaded", async function () {
  const { mainStylesheetLinkArray, links, urlStr } = getStylesheetLinks();
  console.log(`The current style sheet "${urlStr}" has been successfully loaded continue loading other style sheets...`);
  console.log({ mainStylesheetLinkArray, links, urlStr });
  const prim = [];
  mainStylesheetLinkArray.forEach((item, index) => {
    const linkStr = `link[data-type="${item}"]`;
    const mainStylesheetLink = document.querySelector(linkStr);
    if (mainStylesheetLink) {
      mainStylesheetLink.onload = function () {
        console.log(`The current style sheet "${item}"(dom form 'document.querySelector('${linkStr}')' has been successfully loaded continue loading other style sheets...`);
        prim.push(
          addPrimary(() => {
            console.log(`The current style sheet "${item}"(dom form 'document.querySelector('${linkStr}')' has been successfully loaded continue loading other style sheets...`);
          }, 1000)
        );
      };
      mainStylesheetLink.addEventListener("error", function () {
        mainStylesheetLink.dataset.type = item;
        mainStylesheetLink.rel = "stylesheet";
        mainStylesheetLink.href = links[index];
        mainStylesheetLink.onerror = function () {
          console.warn("Failed to load main stylesheet!");
        };
        document.head.appendChild(mainStylesheetLink);
        if (document.styleSheets[0].href === mainStylesheetLink.href) {
          mainStylesheetLink.remove();
        } else {
          console.log(`The current style sheet "${item}" has been successfully loaded continue loading other style sheets...`);
        }
      });
    } else {
      console.warn(`Main stylesheet link not found for ${item}!`);
    }
  });
  const result = await Promise.all(prim);
  console.log(result, "done");
});

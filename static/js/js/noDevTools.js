document.onselectstart = function () {
  return false;
};
window.oncontextmenu = function (e) {
  return false;
};
window.onkeydown =
  window.onkeyup =
  window.onkeypress =
    function (e) {
      window.event.returnValue = false;
      return false;
    };
const h = window.innerHeight,
  w = window.innerWidth;

window.onresize = function () {
  if (h !== window.innerHeight || w !== window.innerWidth) {
    location.reload();
    window.location = "about:blank";
  }
};
if (window.addEventListener) {
  window.addEventListener(
    "DOMCharacterDataModified",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMAttributeNameChanged",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMCharacterDataModified",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMElementNameChanged",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMNodeInserted",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMNodeInsertedIntoDocument",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMNodeRemoved",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMNodeRemovedFromDocument",
    function () {
      window.location.reload();
    },
    true
  );
  window.addEventListener(
    "DOMSubtreeModified",
    function () {
      window.location.reload();
    },
    true
  );
}

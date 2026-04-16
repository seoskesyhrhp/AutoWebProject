const ob = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        ob._self.goBacktop = true;
      } else {
        ob._self.goBacktop = false;
      }
    });
  },
  {
    threshold: 0,
  }
);
export function CheckMonitor(_self, nodeDom) {
  const itemBars = document.querySelectorAll(nodeDom);
  const lastItemBar = itemBars.length > 0 ? itemBars[itemBars.length - 1] : null;
  ob.observe(lastItemBar);
  ob._self = _self;
}

export function CancelMonitor(dom) {
  if (ob) {
    ob.unobserve(dom);
  }
  ob.disconnect();
}

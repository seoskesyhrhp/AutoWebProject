export function scrollToRightmostColumn() {
  const s_domArr = [
    { selector: ".el-table__body", isStart: true },
    { selector: ".el-table__body-wrapper", isStart: true },
    { selector: ".showList", isStart: true },
  ];
  s_domArr.forEach((s_dom) => {
    const domElement = document.querySelector(s_dom.selector);
    if (domElement) {
      const scrollOptions = {
        // top: `${innerHeight * 10}`,
        // left: 0,
        behavior: "smooth",
        block: s_dom.isStart ? "start" : "end",
      };
      // console.log({ scrollOptions, domElement });
      domElement.scrollIntoView(scrollOptions);
    } else {
      console.error(`Element not found for selector: ${s_dom.selector}`);
    }
  });

  const table = document.querySelector(".el-table__body");
  if (!table) return;
  const tableLen = table.rows[0]?.cells?.length - 1 || 5;
  const dom_striped = document.querySelector(".el-table__row--striped");
  const rightmostColumn = table.rows[0]?.cells[tableLen] || dom_striped?.children[dom_striped?.children.length - 1 || 5];
  const container = document.querySelector(".el-table__body-wrapper");
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  const rightmostCellOffset = rightmostColumn?.offsetLeft + rightmostColumn?.offsetWidth / 2 - clientWidth / 2;
  console.log({ rightmostColumn, rightmostCellOffset });
  container.scrollTo({ top: 0, left: rightmostCellOffset, behavior: "smooth" });
}

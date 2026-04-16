const objShortcuts = {};
const stTimeType = ["今天", "昨天", "最近三天", "最近一周", "最近半个月", "最近一个月", "最近三个月", "最近半年", "最近一年"];

const ONE_DAY = 24 * 60 * 60 * 1000;
const timeMap = {
  今天: 0,
  昨天: 1,
  最近三天: 3,
  最近一周: 7,
  最近半个月: 15,
  最近一个月: 30,
  最近三个月: 90,
  最近半年: 180,
  最近一年: 365,
};

function calculateDateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setTime(start.getTime() - days * ONE_DAY);
  return [start, end];
}

const arrShortcuts = stTimeType.map((item) => ({
  text: item,
  onClick: (picker) => {
    const days = timeMap[item];
    const dateRange = calculateDateRange(days);
    picker.$emit("pick", dateRange);
  },
}));

objShortcuts.shortcuts = arrShortcuts;
export default objShortcuts;

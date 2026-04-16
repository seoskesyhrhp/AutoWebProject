import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

const cos = console.log;

export class CalculationInspectionData {
  /*
   * const calculator = new CalculationInspectionData();
   * console.log(calculator.getYearType(2008));
   */
  constructor(_self) {
    this.self = _self;
    this.detection = "检测";
    this.inspection = "检验";
    this.supervision = "监督检验";
    this.loadTest = "(125%)";
    this.unknown = "";
    this.calculateData = {};
    this.nowYear = 2023; // new Date().getFullYear();
    this.year = new Date().getFullYear();
    this.month = new Date().getMonth();
    this.detectionYears = Array.from({ length: 2030 - 2005 + 1 }, (_, i) => 2005 + i); // startYear: 2005, endYear: 2030
    this.inspectionYears = Array.from({ length: 2040 - 2023 + 1 }, (_, i) => 2023 + i); // startYear: 2023, endYear: 2040
    this.initializeData();
  }

  createEntry(oldYear) {
    const entry = {};
    for (let j = 0; j < this.inspectionYears.length; j++) {
      entry[this.inspectionYears[j]] = this.calculateYears(oldYear, this.inspectionYears[j]);
    }
    return entry;
  }

  calculateYears(oldYear, nowYear) {
    const yearDifference = nowYear - oldYear;
    const detectionYears = [2, 3, 5, 6, 8, 10, 12, 14, 18, 24, 30];
    const loadTestDetectionYears = [6, 12];
    const loadTestInspectionYears = [18, 24, 30];
    if (yearDifference === 0) {
      return this.supervision;
    }
    if (yearDifference < 0) {
      return this.unknown;
    }
    if (detectionYears.includes(yearDifference)) {
      if (loadTestInspectionYears.includes(yearDifference)) {
        return this.inspection + this.loadTest;
      }
      if (loadTestDetectionYears.includes(yearDifference)) {
        return this.detection + this.loadTest;
      } else {
        return this.detection;
      }
    } else {
      return this.inspection;
    }
  }

  initializeData() {
    for (let i = 0; i < this.detectionYears.length; i++) {
      this.calculateData[this.detectionYears[i]] = this.createEntry(this.detectionYears[i]);
    }
    return this.calculateData;
  }

  getYearType(year, load, month) {
    const result = this.calculateData;
    const currentYear = this.year - 1;
    if ([11, 12].includes(month) && [1, 2, 3].includes(this.month)) {
      this.year = currentYear;
    }
    console.log({ result, year, month });
    let calculationData;
    if (result && result[year]) {
      calculationData = result[year];
    } else {
      calculationData = this.initializeData() && this.initializeData()[year];
    }
    if (!calculationData) {
      return this.unknown;
    }
    let calculationStr = calculationData[this.year];
    if (load && +load <= 1000) {
      calculationStr = calculationStr.replace("(125%)", "");
    }
    return calculationStr;
  }
}

const classMap = {
  检验: "inspection",
  检测: "detect",
  监督检验: "surveillanceInspection",
};

function setTdClassName(lastTd, text) {
  if (text.includes("检验研究")) {
    lastTd.className = "el-descriptions-item__cell el-descriptions-item__content";
  } else {
    for (const [key, value] of Object.entries(classMap)) {
      if (text.includes(key)) {
        lastTd.className = "el-descriptions-item__cell el-descriptions-item__content Calculation";
        lastTd.classList.add(value);
        break;
      }
    }
  }
}

export function AutoToolsStyle() {
  const Calculation = document.querySelector(".number");
  const sLeftDom = document.querySelector(".index_table_item");
  const sLeft = Calculation.getBoundingClientRect().left - 50;
  sLeftDom.style.setProperty("--s--left", `${sLeft}px`);
  requestAnimationFrame(AutoToolsStyle);
}

export function FuncCalculatorStyle() {
  const descriptions = document.querySelectorAll(".el-descriptions-item__content");
  setTimeout(() => {
    descriptions.forEach((lastTd) => {
      const lastTdText = lastTd.textContent;
      setTdClassName(lastTd, lastTdText);
    });
    NProgress.done();
  }, 100);
}

export function open() {
  this.$prompt("请输入请求Token", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /\S/, // /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,
    inputErrorMessage: "Token格式不能为空",
  })
    .then(({ value }) => {
      this.loadinged = this.$loading({
        lock: true,
        text: "Loading",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      localStorage.setItem("userToken", value);
      this.headers.Token = value;
      setTimeout(async () => {
        this.loadinged.close();
        await this.info();
      }, 3000);
    })
    .catch(() => {
      this.$message.info("取消输入");
    });
}
export function storeData(key) {
  const raw = {
    MaintenanceList: () => {
      const MaintenanceList = store.get("MaintenanceList");
      if (MaintenanceList) {
        const { time, value, expire } = JSON.parse(MaintenanceList);
        this.maintenanceList = value;
        this.total = value.length;
      }
    },
    ListOfPeople: () => {
      const ListOfPeople = store.get("ListOfPeople");
      if (ListOfPeople) {
        const { time, value, expire } = JSON.parse(ListOfPeople);
        this.maintenanceList = value;
        this.total = value.length;
      }
    },
  };
  return raw[key]();
}

async function clearToken() {
  const resp = await axios.post("/pake/clear");
  cos(resp.data);
}
async function setToken() {
  const storage = localStorage.getItem("userToken");
  if (storage) {
    const resp = await axios.post("/api/maintenance", { userToken: localStorage.getItem("userToken") });
    cos(resp.data);
  }
}
function addTest() {
  const storage = JSON.parse(getItemWithExpiry("p_test"));
  if (!storage) {
    setItemWithExpiry("p_test", JSON.stringify({ msg: "test", time: new Date() }), 10800);
    this.$message.info("已添加测试数据");
    this.enableTest = true;
    setTimeout(() => {
      this.menuActionHandle("reload");
    }, 1000);
    return;
  }
  this.$message.error("暂不支持添加");
}
function CancelTheTest() {
  localStorage.removeItem("p_test");
  this.$message.info("已清除测试数据");
  this.enableTest = false;
  this.clearLoaded();
}

export async function setParams(str) {
  const clearCommon = () => {
    this.ElevatorNumber = "";
    localStorage.clear();
    this.$message.info("已清除缓存");
    setTimeout(() => {
      this.menuActionHandle("reload");
    }, 1000);
  };
  const actions = {
    空: async () => {
      clearCommon();
      await clearToken();
    },
    Token: async () => {
      clearCommon();
      await clearToken();
    },
    uploadToken: async () => {
      localStorage.removeItem("userToken");
      await this.RequestingToken.resetToken();
      setTimeout(() => {
        this.$message.info("已重置Token");
      }, 1000);
      return true; // 如果每个分支都需要返回true，可以保留这里
    },
    add: async () => {
      this.ElevatorNumber = "";
      await setToken();
      this.$message.info("已设置");
    },
    test: () => {
      this.ElevatorNumber = "";
      addTest.call(this);
    },
    clearTest: () => {
      this.ElevatorNumber = "";
      CancelTheTest.call(this);
    },
    enableSimplify: () => {
      this.canBeSimplified = true;
      this.$message.info("已启用");
      this.loadinged.close();
    },
    disableSimplify: () => {
      this.canBeSimplified = false;
      this.$message.info("已禁用");
      this.loadinged.close();
    },
    clearParams: () => {
      this.ElevatorNumber = "";
      location.search = "";
      this.$message.info("已清除");
      this.loadinged.close();
    },
  };
  const action = actions[str];
  if (action) {
    await action();
    return true; // 如果每个分支都需要返回true，可以保留这里
  }
  console.error(`Unknown parameter: ${str}`);
  return false;
}
const specificArray = ["安装单位", "层/站/门数", "电梯出厂编号", "使用单位地址", "电梯位置", "电梯型号", "额定速度", "额定载荷", "内部编号", "使用单位", "提升高度", "维保单位", "制造单位", "注册代码"];
const specificSet = new Set(specificArray); // 将数组转换为 Set
export function specificTitleStyle() {
  const cells = document.querySelectorAll(".el-descriptions-item__cell");
  cells.forEach((lastTd) => {
    const lastTdText = lastTd.textContent;
    if (specificArray.includes(lastTdText)) {
      lastTd.classList.add("Specific-item");
    }
  });
}
export function dataSimplification(arr) {
  return Object.fromEntries(Object.entries(arr).filter(([key, value]) => value && value.length > 0)); // filter(Boolean));
}

export function dataSimplifyAgain(arr) {
  return Object.entries(arr).reduce((acc, [key, value]) => {
    if (specificSet.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

let countDown = 90;
let startTime;
let timer;
export function startCountDown(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsedTime = timestamp - startTime; // 已过去的时间
  const remainingTime = Math.max(0, Math.floor((90 * 1000 - elapsedTime) / 1000)); // 剩余时间
  console.log(remainingTime);
  if (remainingTime < 1) {
    cancelAnimationFrame(timer);
    timer = null;
    console.log("倒计时结束");
  } else {
    timer = requestAnimationFrame(startCountDown.bind(this));
  }
}
// timer = requestAnimationFrame(startCountDown.bind(this));

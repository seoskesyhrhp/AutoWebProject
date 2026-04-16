import { getWeather, getalarmScrPath } from "./getWeather.js";
import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

const maxTime = 800;
const ELEVATOR_DATA = "elevatorData";
const ELEVATOR_LINK = "/pake/search";
const WeeklyTime = 604800;
const EXPIRE_TIME = 60 * 60 * 1000 * 6;
const ElevatorListURL = location.href.includes("localhost") ? "http://cleanm.cn:8001/" : "/";
const HOSTSNAME = `${location.protocol}//${location.hostname}`;

async function request(url, method, data = {}, headers, maxCount, _self) {
  try {
    const response = await axios({
      url,
      method,
      data,
      headers,
    });
    return response.data.data.map((item) => ({ value: item.id, label: item.name }));
  } catch (error) {
    if (maxCount > 0) {
      const resToken = await getToken();
      headers.Token = resToken;
      const resData = await request(url, method, data, headers, maxCount - 1);
      return resData;
    } else {
      _self.$message.error("获取用户列表失败");
      throw new Error("Max retry count reached");
    }
  }
}
async function getToken() {
  const url = "/search/cache";
  const res = await axios.post(url);
  const token = res.data.token.token;
  if (token) {
    localStorage.setItem("userToken", token);
    return token;
  }
}

export async function getPersons(_self) {
  try {
    let token = localStorage.getItem("userToken");
    if (!token) {
      token = await getToken();
    }
    const companyId = "VqlvuZOb9qTVYpSYGQ3Dgg==";
    const url = "https://dtwzh.scjgj.suzhou.com.cn/wisdomElevator/maintenanceRecords/findMaintenanceUser";
    const resData = await request(url, "post", { companyId }, { "Content-Type": "application/json", Token: token }, 3, _self);
    return resData;
  } catch (error) {
    localStorage.removeItem("userToken");
    if (_self.loginCaching) return;
    await _self.loginCache();
    return [];
  }
}
export function getStudentInfo(studentId) {
  const row = {};
  const arr = [370, 110, 122, 133, 144, 156, 166, 177, 188, 194, 200, 216, 232, 248, 264, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480];
  arr.slice(0, 36).forEach((value, index) => (row[index.toString()] = value));
  return row[studentId];
}

export function debounce(fn, delay = 500) {
  let timer;
  return function (...args) {
    console.log(args);
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
export function queryData(array, elevatorNum) {
  if (!array || !elevatorNum) return;
  return new Promise((resolve, reject) => {
    const index = array.findIndex((item) => item.elevatorNum === elevatorNum);
    const result = array[index];
    if (result) {
      resolve(result);
    } else {
      reject(new Error(`Not Found,${elevatorNum}`));
    }
  });
}
async function login(_self) {
  try {
    const resp = await axios.get("/user/islogin");
    const userInfo = JSON.parse(resp.data.data);
    if (resp.data.success) {
      return {
        userInfo,
        success: true,
        msg: "登录成功",
      };
    } else {
      return {
        userInfo: {},
        success: false,
        msg: "登录失败",
      };
    }
  } catch (err) {
    console.error(err);
    return {
      userInfo: {},
      success: false,
      msg: "登录失败",
    };
  }
}

function getTime(str) {
  const targetTime = new Date(str);
  if (isNaN(targetTime)) {
    console.error("无效的目标时间字符串:", str);
    return false;
  }
  const now = Date.now();
  const expireTimeLimit = now + EXPIRE_TIME;
  return targetTime <= expireTimeLimit && targetTime >= now;
}
async function PreloadingData(_self) {
  _self.$message({
    message: "正在预加载数据，请稍后!",
    type: "info",
    duration: 0,
  });
  const pageObj = {
    page: 1,
    pageSize: 1000,
  };
  try {
    const responses = await axios.post(`${ElevatorListURL}api/Token`, { ...pageObj });
    const data = responses.data;
    const result = data.data;
    if (data.code === 200 && result.length > 100) {
      setItemWithExpiry(ELEVATOR_DATA, JSON.stringify(result), WeeklyTime);
      return result;
    } else {
      _self.$message({
        message: data.code + "预加载数据失败，请稍后重试!",
        type: "error",
        duration: 3000,
      });
      return [];
    }
  } catch (error) {
    _self.$message({
      message: "预加载数据失败，请稍后重试!",
      type: "error",
      duration: 3000,
    });
    return [];
  }
}
function getRemainingTime(targetTime) {
  const now = new Date().getTime();
  const target = new Date(targetTime).getTime();
  const remaining = target - now;
  if (remaining <= 0) return { expired: true };
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const format = (n) => n.toString().padStart(2, "0");
  return {
    days: format(days),
    hours: format(hours),
    minutes: format(minutes),
    seconds: format(seconds),
    totalMs: remaining,
  };
}

function isPreloadingData() {
  const currentSearch = location.href.includes(ELEVATOR_LINK);
  if (!currentSearch) return false;
  const storage = localStorage.getItem(ELEVATOR_DATA);
  if (!storage) return false;
  const expiry = JSON.parse(storage).expiry;
  // console.log("isPreloadingData", getTime(expiry));
  return getTime(expiry);
}
function linkJump(options, url) {
  try {
    const targetTime = JSON.parse(localStorage.getItem(ELEVATOR_DATA)).expiry;
    const result = getRemainingTime(targetTime);
    const message = result.expired ? "已过期" : `${result.days}天 ${result.hours}时 ${result.minutes}分 ${result.seconds}秒`;
    if (options) {
      jsBridge.toast(message);
      setTimeout(() => {
        jsBridge.setOptions(options);
      }, maxTime);
    } else {
      this.$message.info(message);
      setTimeout(() => {
        location.href = url;
      }, maxTime);
    }
  } catch (e) {
    console.error(e);
    this.$message.error("数据加载失败了,即将4秒后重新加载数据!");
    setTimeout(() => {
      linkJump(options, url);
    }, 4000);
  }
}
async function handleRedirection(url, _self, redirect) {
  if (redirect) {
    open(url, "_blank");
    return;
  }

  let options = {
    url: url,
    screenOrientation: _self.itAuthation,
    refresh: false,
    fullScreen: false,
  };
  if (/LT-APP/.test(navigator.userAgent)) {
    if (isPreloadingData()) {
      _self.Loading = true;
      _self.isShow = true;
      const result = await PreloadingData(_self);
      if (result) {
        jsBridge.setOptions(options);
      }
    } else {
      linkJump(options, (url = null));
    }
  } else {
    if (isPreloadingData()) {
      _self.Loading = true;
      _self.isShow = true;
      const result = await PreloadingData(_self);
      console.log(result);
      result && (location.href = url);
    } else {
      linkJump.call(_self, (options = null), url);
    }
  }
}

export function FunMenuAction(row, _self) {
  const Vertical = _self.Vertical;
  const FullScreen = _self.EnterFullScreen;

  const items = {
    logout: async () => {
      const isLogin = await login(_self);
      const userInfo = isLogin.userInfo;
      if (isLogin.success) {
        try {
          const config = await _self.$confirm(`用户 <em>"${userInfo?.user?.username}"</em> 即将进行登出操作,是否进行此操作,此操作不可逆! 是否继续?`, "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "info",
            dangerouslyUseHTMLString: true,
          });
          if (config == "confirm") {
            _self.$message({
              type: "success",
              message: "请注意,将于3秒后登出",
            });
            _self.menudialogVisible = false;
            setTimeout(() => {
              window.location.href = "/logout";
            }, 3000);
          }
        } catch (e) {
          _self.$message({
            type: "info",
            message: "已取消",
          });
        }
      } else {
        _self.menudialogVisible = false;
        _self.$message.error("用户未登录,请重新登录");
      }
    },
    updateVideo: () => {
      location.href = `${HOSTSNAME}:12345/images`;
    },
    async WeatherReset() {
      localStorage.removeItem("p_precipitation");
      localStorage.removeItem("p_weather");
      localStorage.removeItem("p_LatitudeAndLongitude");
      _self.StartTheRequest = false;
      _self.StartRequestTQ = false;
      _self.notifyShow = false;
      _self.weather = {};
      _self.RealTimePrecipitation = "";
      clearInterval(_self.timer);
      _self.timers = null;
      await Promise.allSettled([getWeather(_self), getalarmScrPath(_self), getWeather(_self)]);
      setTimeout(() => {
        _self.timers = setInterval(() => {
          _self.setPropertyes();
          _self.notify();
          _self.setPweather();
        }, 100);
      }, 1000);
    },
    amapLocStop: () => {
      jsBridge.amapLoc.stop();
    },
    appSettings: () => {
      _self.appSettings();
    },
    Swapping: () => {
      const urlMap = {
        [`${HOSTSNAME}:8001/pake/index.html`]: `${HOSTSNAME}:5672/pake/index.html`,
        [`${HOSTSNAME}:5672/pake/index.html`]: `${HOSTSNAME}:8001/pake/index.html`,
        [`${HOSTSNAME}:8001/pake/indexTable.html`]: `${HOSTSNAME}:5672/index.html`,
        [`${HOSTSNAME}:5672/index.html`]: `${HOSTSNAME}:8001/pake/indexTable.html`,
        [`${HOSTSNAME}:5673/pake/index.html`]: `${HOSTSNAME}:8001/pake/index.html`,
        [`${HOSTSNAME}:5674/pake/index.html`]: `${HOSTSNAME}:8001/pake/index.html`,
        [`${HOSTSNAME}:5675/pake/index.html`]: `${HOSTSNAME}:8001/pake/index.html`,
        [`${HOSTSNAME}:5673/index.html`]: `${HOSTSNAME}:8001/pake/indexTable.html`,
        [`${HOSTSNAME}:5674/index.html`]: `${HOSTSNAME}:8001/pake/indexTable.html`,
        [`${HOSTSNAME}:5675/index.html`]: `${HOSTSNAME}:8001/pake/indexTable.html`,
      };
      let formUrl = location.href;
      if (formUrl.includes("www.")) {
        formUrl = formUrl.replace("www.", "");
        urlMap[formUrl] && (location.href = urlMap[formUrl]);
      }
      urlMap[formUrl] && (location.href = urlMap[formUrl]);
    },
    back: () => {
      history.back();
    },
    index: () => {
      // const currentSearch = location.href.includes(ELEVATOR_LINK);
      // const url = currentSearch ? `${location.origin}/pake/indexTable.html` : `${location.origin}/pake/index.html`;
      const url = location.origin;
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.setOptions({
          url: url,
          screenOrientation: _self.itAuthation,
          refresh: false,
          fullScreen: false,
        });
      } else {
        location.href = url;
      }
    },
    records: async () => {
      const url = `${location.origin}/pake/index.html`;
      await handleRedirection(url, _self);
    },
    management: async () => {
      const url = `${location.origin}/pake/indexTable.html`;
      await handleRedirection(url, _self);
    },
    toSong: async () => {
      const redirect = true;
      const protocol = "https:";
      const host = location.hostname;
      const url = `${protocol}//${host}/pake/play`;
      await handleRedirection(url, _self, redirect);
    },
    phinoceros: () => {
      const Link = `${location.origin}/pake/phinoceros`;
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.setOptions({
          url: Link,
          screenOrientation: _self.itAuthation,
          refresh: false,
          fullScreen: false,
        });
      } else {
        window.open(Link, "_blank");
      }
    },
    search: () => {
      const url = `${location.origin}${ELEVATOR_LINK}`;
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.setOptions({
          url: url,
          screenOrientation: _self.itAuthation,
          refresh: false,
          fullScreen: false,
        });
      } else {
        location.href = url;
      }
    },
    TextLink: () => {
      const Link = "https://www.yimenapp.com/doc/demo.cshtml";
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.setOptions({
          url: Link,
          screenOrientation: 2,
          refresh: false,
          fullScreen: false,
        });
      } else {
        window.open(Link, "_blank");
      }
    },
    copy: () => {
      const text = location.href;
      jsBridge.setClipboardText(text);
      jsBridge.toast("已复制到剪贴板");
    },
    reload: () => {
      location.reload();
    },
    EnterFullScreen: () => {
      if (!FullScreen) {
        jsBridge.setOptions({
          refresh: true,
          showTitle: false,
          fullScreen: true,
          screenOrientation: 1,
        });
        _self.FullScreenContent = "退出全屏";
        _self.EnterFullScreen = true;
      } else {
        jsBridge.setOptions({
          titleColor: "#56BC94",
          titleTextColor: "#FFFFFF",
          statusBarColor: "#56BC94",
          refresh: true,
          showTitle: true,
          fullScreen: false,
          screenOrientation: 1,
        });
        _self.FullScreenContent = "进入全屏";
        _self.EnterFullScreen = false;
      }
    },
    VerticalScreen: () => {
      console.log(_self.Vertical);
      if (Vertical) {
        jsBridge.setOptions({
          titleColor: "#56BC94",
          titleTextColor: "#FFFFFF",
          statusBarColor: "#56BC94",
          showTitle: true,
          fullScreen: false,
          refresh: true,
          screenOrientation: 2,
        });
        _self.VerticalScreenContent = "竖屏";
        _self.Vertical = false;
      } else {
        jsBridge.setOptions({
          refresh: true,
          showTitle: true,
          fullScreen: false,
          screenOrientation: 1,
        });
        _self.VerticalScreenContent = "横屏";
        _self.Vertical = true;
      }
    },
    ClearCache: () => {
      localStorage.clear();
      jsBridge.clearCache(function () {
        jsBridge.toast("缓存已清除");
      });
    },
    getCache: () => {
      jsBridge.cacheSize(function (size) {
        var txt = size + "字节\n";
        txt += (size / 1024 / 1024.0).toFixed(2) + "MB";
        jsBridge.toast(txt);
      });
    },
    OpenInBrowser: () => {
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.openInBrowser(location.href);
      } else {
        open(location.href, "_top");
      }
    },
    ToHome: () => {
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.backToHome(true);
      } else {
        open(ELEVATOR_LINK, "_top");
      }
    },
    Edit: () => {
      if (/LT-APP/.test(navigator.userAgent)) {
        jsBridge.exit(true);
      } else {
        window.close();
      }
    },
  };
  return items[row];
}

export function handleBadgeClick(e) {
  e.stopPropagation();
  this.TableReset();
  this.TableShow = true;
  this.indexes = [];
  const dom = e.target;
  if (dom?.children?.length > 1) return;
  const name = dom.innerText.trim();
  const number = dom.parentElement.parentElement.querySelector("sup")?.innerHTML; // 使用closest寻找最近的父级sup元素
  const tableRows = document.querySelectorAll("tbody > tr"); // 直接选择tbody下的所有tr元素
  if (name === "收起") {
    this.flexData = this.flexDataBak?.length > this.number ? this.flexDataBak.slice(0, this.number) : this.flexDataBak;
    this.theListExpands = !this.theListExpands;
    this.TableShow = false;
  } else if (name === "展开") {
    this.flexData = this.flexDataBak; // 展开时直接赋值，无需条件判断
    this.theListExpands = !this.theListExpands;
  } else {
    this.showMessageAndHighlightRows(name, number, tableRows, dom.innerText);
  }
}

// 维护记录图片展示
function getsElevatorMaintenanceData(row) {
  const elevatorMaintenanceData = this.elevatorMaintenanceBackup;
  if (elevatorMaintenanceData) {
    return elevatorMaintenanceData.filter((item) => item.elevatorBuildingNum.includes(row));
  }
}
// 判断字符串是日期
function isValidDateTime(str) {
  const regex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  if (!regex.test(str)) return false;
  const [_, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = str.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 月份从0开始
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = parseInt(secondStr, 10);
  const date = new Date(year, month, day, hour, minute, second);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day && date.getHours() === hour && date.getMinutes() === minute && date.getSeconds() === second;
}
function getElevatorMaintenanceData(row) {
  if (!isValidDateTime(row)) return [];
  const elevatorMaintenanceData = this.elevatorMaintenanceBackup;
  // console.log({ title: "getElevatorMaintenanceData", elevatorMaintenanceData, row });
  if (elevatorMaintenanceData) {
    return elevatorMaintenanceData.find((item) => item.createDateStr.includes(row));
  }
}

function getImageJson(array) {
  if (!Array.isArray(array)) {
    console.error("Expected an array, received:", array);
    return [];
  }

  return array.map((item) => {
    if (!item || typeof item !== "object") {
      console.warn("Invalid item format:", item);
      return item;
    }

    const { result } = item;
    let parsedResult;
    try {
      parsedResult = typeof result === "string" ? JSON.parse(result) : result;
    } catch (e) {
      console.error("JSON parse error for result:", result, "Error:", e);
      return item;
    }

    const picUrlStr = parsedResult?.picUrl;
    if (!picUrlStr) return item;

    try {
      const picUrl = typeof picUrlStr === "string" ? picUrlStr.split(",").filter((url) => url.trim() !== "") : [];

      return {
        ...item,
        picURLArray: picUrl,
      };
    } catch (e) {
      console.error("Error processing picUrl:", picUrlStr, "Error:", e);
      return item;
    }
  });
}

const DEFAULT_IMAGE_LABELS = new Set(["机房", "轿顶", "底坑环境", "96333标识牌", "特种设备使用标志", "控制柜铭牌", "扶梯全景图", "上机舱", "下机舱"]);

function getImageLabel(array, labelSet = DEFAULT_IMAGE_LABELS) {
  if (!Array.isArray(array)) {
    console.warn("Expected an array, got:", array);
    return [];
  }

  if (!(labelSet instanceof Set)) {
    console.warn("labelSet should be a Set, got:", labelSet);
    labelSet = new Set(labelSet || []);
  }

  return array.filter((item) => {
    return item && item.checkItem && labelSet.has(item.checkItem);
  });
}

async function getImageData(obj) {
  const headers = this.headers;
  const url = "maintenanceRecords/maintenanceDetailsById";
  const fullUrl = `${this.ip}/${url}`;
  const response = await axios.post(fullUrl, obj, { headers });
  if (response.data.status === 200) {
    if (this.multiGraphMode) {
      const imagesList = getImageJson(response.data.data);
      const imagesData = imagesList.map((item) => {
        if (!item.picURLArray) {
          item["picURLArray"] = [];
        }
        return item;
      });
      this.maintenanceImageArray = getImageLabel(imagesData);
    } else {
      this.maintenanceImageArray = getImageLabel(response.data.data);
    }
  } else {
    this.$message.error("数据获取失败");
  }
}

export async function maintenanceImage() {
  this.maintenanceDiagram = !this.maintenanceDiagram;
  if (!this.maintenanceDiagram) return;
  this.maintenanceImageArray = [];
  const target = getsElevatorMaintenanceData.call(this, this.DetailsElevatorNumber);
  // console.log("getsElevatorMaintenanceData", target, this.DetailsElevatorObject, this.DetailsElevatorNumber);
  if (target && target.length > 0) {
    const { completionTime, maintenanceElevatorNumber } = this.DetailsElevatorObject;
    const _target = target.length > 1 ? getElevatorMaintenanceData.call(this, completionTime) : target[0];
    const obj = {
      maintenanceCycle: _target.maintenanceCycle,
      id: _target.id,
      elevatorTypeId: _target.elevatorTypeId,
    };
    await getImageData.call(this, obj);
  }
}

import { axiosInstance, cancelAllPendingRequests } from "./request.js";
import { ElMessage } from "./ElMessage.js";
import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

var i = 0;
var cnt = null;
var result = null;
var options = {};
var freeObject = {};
const statusTime = 100;

/**
 * 案例 console.log(objectsAreEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })); // true
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
function objectsAreEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (typeof obj1[key] !== typeof obj2[key] || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}

// export function getDistance(lat1, lng1, lat2, lng2) {
//   // if (!/LT-APP/.test(navigator.userAgent)) return;
//   if (lat1 === "未知" || lng1 === "未知" || lat1 === "" || lng1 === "" || lat2 === "" || lng2 === "") return;
//   const R = 6371;
//   const dLat = degressToRadians(lat2 - lat1);
//   const dLng = degressToRadians(lng2 - lng1);
//   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degressToRadians(lat1)) * Math.cos(degressToRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c;
//   if (isNaN(distance)) return;
//   return distance;
// }

/**
 * 计算两个经纬度坐标之间的球面距离（单位：公里）
 * @param {number|string} lat1 - 第一个点的纬度
 * @param {number|string} lng1 - 第一个点的经度
 * @param {number|string} lat2 - 第二个点的纬度
 * @param {number|string} lng2 - 第二个点的经度
 * @returns {number|undefined} 返回距离（公里），无效输入返回undefined
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  console.log("getDistance is Testting", { lat1, lng1, lat2, lng2 });

  if (!areValidCoordinates(lat1, lng1) || !areValidCoordinates(lat2, lng2)) {
    return undefined;
  }

  // 转换坐标为数值类型
  lat1 = Number(lat1);
  lng1 = Number(lng1);
  lat2 = Number(lat2);
  lng2 = Number(lng2);

  // 使用Haversine公式计算距离
  const R = 6371; // 地球半径（公里）
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // 确保结果是有效数字
  return Number.isFinite(distance) ? distance : undefined;
}

/**
 * 验证坐标是否有效
 * @param {number|string} lat - 纬度
 * @param {number|string} lng - 经度
 * @returns {boolean}
 */
function areValidCoordinates(lat, lng) {
  // 排除空值、字符串"未知"和非数字值
  if (lat === "未知" || lng === "未知" || lat === "" || lng === "" || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return false;
  }

  // 转换为数字后验证范围
  const numLat = Number(lat);
  const numLng = Number(lng);

  return numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180;
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度值
 * @returns {number} 弧度值
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function degressToRadians(deg) {
  return (deg * Math.PI) / 180;
}

function writeTextCallback(succ, msg) {
  jsBridge.toast(succ ? "写入成功" : msg);
}

function existCallback(succ) {
  jsBridge.toast(succ ? "存在" : "不存在");
}

function openCallback(succ, msg) {
  if (!succ) {
    jsBridge.toast("数据写入错误");
    alert(msg);
  }
}
function isEmptyObject(obj) {
  return obj && typeof obj === "object" && Object.keys(obj).length === 0;
}

function setPrecipitation(storage, _self) {
  if (storage.msg) {
    _self.RealTimePrecipitation = `${storage.msg}(${storage.time}-update: ${storage.updateInterval}M)`;
    storage.status
      ? setTimeout(() => {
          ElMessage({ message: "最近无下雨", FoldingEnable: true, offset: 0.6 });
        }, statusTime)
      : setTimeout(() => {
          ElMessage({ message: "在下雨", FoldingEnable: true, offset: 0.6 });
        }, statusTime);
  }
}

function isWithinDistanceRange(distanceStr, min, max) {
  const distance = parseFloat(distanceStr.replace("km", ""));
  return distance >= min && distance <= max;
}

// 节流单参函数
export function throttle(func, delay) {
  let lastTime = 0;
  return function (param) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      func(param);
      lastTime = now;
    }
  };
}

// 节流异步函数
export function throttleAsync(func, delay) {
  let lastTime = 0;
  let timer = null;
  let throttled = false;

  return function (...args) {
    const now = Date.now();
    if (throttled) {
      clearTimeout(timer);
      return;
    }
    if (now - lastTime < delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        return func(...args);
      }

      return new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          lastTime = now;
          try {
            const result = func(...args);
            if (result instanceof Promise) {
              result.then(resolve).catch((err) => {
                reject(new Error("Throttled function threw an error: " + err.message));
              });
            } else {
              throttled = true;
              resolve(result);
            }
          } catch (err) {
            reject(new Error("Throttled function threw an error: " + err.message));
          }
          timer = null;
        }, delay - (now - lastTime));
      });
    }

    lastTime = now;
    return func(...args);
  };
}

export async function setDistance(row) {
  if (isWithinDistanceRange(row.distance, 0.0, 0.5)) return;
  const url = `/pake/json/getlations`;
  return await axiosInstance.post(url, row);
}

async function getPrecipitation(_self) {
  const storage = JSON.parse(getItemWithExpiry("p_precipitation"));
  if (storage) {
    if (storage.errcode === 100) {
      jsBridge.toast("请求次数超过限制，请明天再试");
      localStorage.removeItem("p_precipitation");
      jsBridge.amapLoc.stop();
    }
    return setPrecipitation(storage, _self);
  }
  const url = "/pake/precipitation";
  const resp = await axiosInstance.post(url);
  resp.data.data.msg ? setItemWithExpiry("p_precipitation", JSON.stringify(resp.data.data), 300) : jsBridge.toast("获取实时降水信息失败");
  return setPrecipitation(resp.data.data, _self);
}
async function getWeatherData(_self) {
  if (_self.StartRequestTQ) return;
  const storage = JSON.parse(getItemWithExpiry("p_weather"));
  try {
    if (storage) {
      if (storage.errcode === 100) {
        jsBridge.toast("请求次数超过限制，请明天再试");
        localStorage.removeItem("p_weather");
        jsBridge.amapLoc.stop();
      }
      return setContentWeather(storage, _self);
    }
    const url = "/pake/getweather";
    const resp = await axiosInstance.post(url);
    if (resp.data.data.errcode === 100 || resp.data.data.errmsg) {
      _self.StartRequestTQ = true;
      _self.$message.error(resp.data.data.errmsg);
      jsBridge.toast("请求次数超过限制，请明天再试");
      localStorage.removeItem("p_weather");
      jsBridge.amapLoc.stop();
      return;
    }
    resp.data.data.city ? setItemWithExpiry("p_weather", JSON.stringify(resp.data.data), 300) : jsBridge.toast("获取天气信息失败");
    return setContentWeather(resp.data.data, _self);
  } catch (err) {
    const item = JSON.parse(getItemWithExpiry("p_weather"));
    const st = item ? item : {};
    const obj = {
      status: "error",
      message: "获取天气信息失败",
    };
    st.errorObj = obj;
    return setContentWeather(st, _self);
  }
}

function compareLatLngDecimals(value1, value2) {
  const decimalPart1 = (String(value1).split(".")[1] || "").substring(0, 6);
  const decimalPart2 = (String(value2).split(".")[1] || "").substring(0, 6);
  return decimalPart1 === decimalPart2;
}

async function WriteWeather(options, _self) {
  const storage = JSON.parse(getItemWithExpiry("p_weather"));
  if (storage) {
    if (options.lat || options.lng) {
      options.city = storage.city;
    }
  }
  if (isEmptyObject(options)) return await Promise.allSettled([getWeatherData(_self), getPrecipitation(_self)]);
  if (compareLatLngDecimals(options.lng, _self.weather.lng) || compareLatLngDecimals(options.lat, _self.weather.lat)) {
    _self.$message.info("不支持经纬度变化");
    return;
  }
  console.log({ localLng: _self.weather.lng, persistentLng: options.lng, localLat: _self.weather.lat, persistentLat: options.lat });
  try {
    if (_self.StartTheRequest || !options.city) return;
    const url = "/pake/writeweather";
    const resp = await axiosInstance.post(url, options);
    if (resp.data) {
      _self.StartTheRequest = false;
      freeObject = resp.data;
      return await Promise.allSettled([getWeatherData(_self), getPrecipitation(_self)]);
    }
  } catch (err) {
    console.log(err, "error");
    _self.StartTheRequest = true;
    if (err.response.status === 400) return await Promise.allSettled([getWeatherData(_self), getPrecipitation(_self)]);
    const text = err.response.data;
    const file = "fs://file/error/my.html";
    jsBridge.fs.writeText(file, text, writeTextCallback);
    jsBridge.fs.exist(file, existCallback);
    jsBridge.fs.open(file, openCallback);
  }
}
async function initialFun(options, _self) {
  return await WriteWeather(options, _self);
}
function LocationAuthorization(_self) {
  jsBridge.requestPermissions(["ReadPhotos", "WritePhotos", "Camera", "Microphone", "Location", "ReadContacts", "WriteContacts", "BlueTooth", "ReadPhoneState", "PostNotifications"], function (res) {
    if (res.granted) {
      jsBridge.toast("已授权");
      setTimeout(() => {
        getWeather(_self);
      }, 3000);
    } else {
      jsBridge.toast("用户拒绝授权");
      // jsBridge.appSettings();
      jsBridge.openSettings(1);
    }
  });
}

function ClearNode() {
  const progress = document.querySelector(".progress-bar-info");
  if (progress) progress.innerHTML = "";
}
function addNode() {
  const progress = document.querySelector(".progress-bar-info");
  const span = document.createElement("span");
  span.className = "progress-item";
  progress.appendChild(span);
}

export async function getWeather(_self) {
  if ((i > 19 && i <= 25) || i > 26) {
    location.reload(true);
    return;
  }
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    var storage = JSON.parse(getItemWithExpiry("p_LatitudeAndLongitude"));

    jsBridge.amapLoc.getCurrentPosition(
      {
        watch: true,
        watchInterval: 8,
        notAddress: true,
        notifyTitle: "我的APP",
        notifyContent: "持续定位中...",
      },
      async function (succ, data) {
        cnt = "第 " + ++i + " 次位置回调: ";
        result = {
          cnt: cnt,
          succ: succ,
          data: data,
        };
        if (data.errorMessage === "没有地理定位权限") {
          jsBridge.toast("需授权始终允许");
          setTimeout(() => {
            LocationAuthorization(_self);
          }, 10000);
          return;
        }
        if (result.succ) {
          options = {
            city: result.data.city,
            cityid: "",
            adcode: "",
            lng: result.data.longitude,
            lat: result.data.latitude,
          };
          _self.Location.longitude = result.data.longitude;
          _self.Location.latitude = result.data.latitude;

          if (!storage) {
            return await Promise.all([getWeatherData(_self), WriteWeather(options, _self), getPrecipitation(_self)]);
          }
          setItemWithExpiry("p_LatitudeAndLongitude", JSON.stringify(result), 300);
          return await Promise.all([getWeatherData(_self), getPrecipitation(_self)]);
        } else {
          addNode();
          console.log(cnt);
          if ((i > 19 && i <= 25) || i > 26) {
            ClearNode();
            location.reload(true);
            return;
          }
          return await initialFun(options, _self);
        }
      }
    );
  } else {
    return await initialFun(options, _self);
  }
}
const weather_img = {
  qing: { img: "/static/image/yahoo/qing.png" },
  yin: { img: "/static/image/yahoo/yin.png" },
  duoyun: { img: "/static/image/yahoo/duoyun.png" },
  leizhenyu: { img: "/static/image/yahoo/leizhenyu.gif" },
  lei: { img: "/static/image/yahoo/lei.png" },
  shachen: { img: "/static/image/yahoo/shachen.png" },
  zhenyu: { img: "/static/image/yahoo/zhenyu.png" },
  雷阵雨伴有冰雹: { img: "/static/image/yahoo/" },
  yujiaxue: { img: "/static/image/yahoo/yujiaxue.png" },
  xiaoyu: { img: "/static/image/yahoo/xiaoyu.png" },
  zhongyu: { img: "/static/image/yahoo/zhongyu.png" },
  dayu: { img: "/static/image/yahoo/dayu.png" },
  yun: { img: "/static/image/yahoo/yun.png" },
  xue: { img: "/static/image/yahoo/xue.png" },
  yin: { img: "/static/image/yahoo/yin.gif" },
  yu: { img: "/static/image/yahoo/yu.png" },
  wu: { img: "/static/image/yahoo/wu.png" },
  zhongyu: { img: "/static/image/yahoo/zhongyu.png" },
  dayu: { img: "/static/image/yahoo/dayu.png" },
  baoyu: { img: "/static/image/yahoo/yu.png" },
  dabaoyu: { img: "/static/image/yahoo/yu.png" },
  特大暴雨: { img: "/static/image/yahoo/" },
  阵雪: { img: "/static/image/yahoo/" },
  小雪: { img: "/static/image/yahoo/" },
  中雪: { img: "/static/image/yahoo/" },
  大雪: { img: "/static/image/yahoo/" },
  暴雪: { img: "/static/image/yahoo/" },
  mai: { img: "/static/image/yahoo/mai.jpg" },
};

function setContentWeather(objdata, _self) {
  objdata = optionData(objdata);
  objdata.weaImg = weather_img[objdata.wea_img]?.img;
  objdata.weaDayImg = weather_img[objdata.wea_day_img]?.img;
  objdata.weaNightImg = weather_img[objdata.wea_night_img]?.img;
  objdata.distance = objdata.distance ? objdata.distance : "0.00km";
  _self.weatherBak = objdata;
  _self.weather = objdata;
}
function setpinyinPro(value) {
  const { pinyin } = pinyinPro;
  const py = pinyin(value, { toneType: "none", type: "array" });
  const concatenatedString = py.join("");
  return concatenatedString;
}
function optionData(obj) {
  obj.wea_img = setpinyinPro(obj.wea);
  obj.wea_day_img = setpinyinPro(obj.wea_day);
  obj.wea_night_img = setpinyinPro(obj.wea_night);
  return obj;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
    context.alarm_StartTheRequest = true;
  };
}

export async function getalarmScrPath(_self) {
  if ((i > 19 && i <= 25) || i > 26) {
    location.reload(true);
    return;
  }

  if (_self.alarm_StartTheRequest) return;
  const debouncedRequest = debounce(async () => {
    try {
      const url = "/pake/getalarm";
      const resp = await axiosInstance.post(url);
      const { data } = resp.data;
      _self.getalarmScr = data.alarmScr;
    } catch (error) {
      console.error("请求失败:", error);
      _self.alarm_StartTheRequest = true;
    }
  }, 200);
  debouncedRequest.call(_self);
}

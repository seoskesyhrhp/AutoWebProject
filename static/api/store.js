import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

const ElevatorListURL = location.href.includes("localhost") ? "http://cleanm.cn:8001/" : "/";
const MAX_EXPIRE = Date.now() + 24 * 60 * 60 * 1000; // 最大过期时间

function removeEmptyAndSpecialValues(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter((item) => item !== null && item !== undefined && item !== "" && item !== " " && item !== "  " && item !== 0);
}
function getList(arr) {
  const items = typeof arr === "string" ? [...arr] : arr;
  const filteredAndUniqueItems = [...new Set(items)].filter(removeEmptyAndSpecialValues);
  return typeof arr === "string" ? filteredAndUniqueItems.join("") : filteredAndUniqueItems;
}

const StringData = {
  fuzzyQuery: (array, query) => {
    // console.log({ array, query });
    return array?.filter((item) => {
      return item?.elevatorBuildingNum?.includes(query);
    });
  },
  getClientIp: async (row) => {
    const url = `${ElevatorListURL}api/clientip`;
    const { data } = await axios.get(url);
    const address = data.data.province;
    row.clientIp = address || "未知";
    row.clientIpType = address ? "success" : "danger";
  },
  getClientIpBak: async (row) => {
    const url = `${ElevatorListURL}api/clientip`;
    const { data } = await axios.get(url);
    let { address } = data.data.data;
    address = getList(address);
    row.clientIp = address || "未知";
    row.clientIpType = address ? "success" : "danger";
  },
  getCaptcha: async () => {},
  getElevatorDate: async (_self) => {
    const pageObj = {
      page: 1,
      pageSize: 1000,
    };
    const storage = JSON.parse(getItemWithExpiry("elevatorData"));
    try {
      if (!storage) {
        const responses = await axios.post(`${ElevatorListURL}api/Token`, { ...pageObj });
        _self.personlistBak = responses.data.data;
        _self.$message.info(responses.data.msg);
        _self.totalBak = responses.data.total;
        _self.elevatorQuantity = responses.data.total;
        setItemWithExpiry("elevatorData", JSON.stringify(responses.data), 604800);
        return responses.data.data;
      } else {
        _self.personlistBak = storage;
        _self.$message.info(storage.msg || "获取成功!");
        _self.totalBak = storage.length;
        _self.elevatorQuantity = storage.length;
        return storage;
      }
    } catch (error) {
      _self.$message.error("获取失败,func->(getDataElevator)");
      console.log(error, "获取失败,func->(getDataElevator)");
      return Promise.reject(error);
      // throw new Error(error);
    }
  },
  /* 从缓存中获取数据
   * @param {string} key 缓存的key
   * @param {string} value 缓存的value
   * @param {number} expire 缓存的过期时间
   * @description 过期时间不能超过24小时
   * @description key和value都不能为空
   * @description expire为0时，永不过期
   * @description expire为-1时，删除缓存
   * @return {string} 缓存的value
   * */
  get: (key) => {
    const currentTime = new Date().getTime();
    const data = localStorage.getItem(key);
    if (data) {
      const { time, value, expire } = JSON.parse(data);
      if (currentTime - time > expire) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    }
    return null;
  },
  /* 将数据存到缓存
   * @param {string} key 缓存的key
   * @param {string} value 缓存的value
   * @param {number} expire 缓存的过期时间
   * @description 过期时间不能超过24小时
   * @description key和value都不能为空
   * @description expire为0时，永不过期
   * @description expire为-1时，删除缓存
   * */
  set: (key, value, expire) => {
    const currentTime = new Date().getTime();
    if (expire > MAX_EXPIRE) {
      throw new Error(`过期时间不能超过24小时 form ${key}`);
    }
    if (!key || !value) {
      throw new Error(`key和value都不能为空 form ${key}`);
    }
    const data = {
      time: currentTime,
      value,
      expire,
    };
    localStorage.setItem(key, JSON.stringify(data));
  },
  commit: () => {},
};
export default StringData;

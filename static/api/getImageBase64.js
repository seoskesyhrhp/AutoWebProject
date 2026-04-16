import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";
import { axiosInstance, cancelAllPendingRequests } from "./request.js";

let { protocol, hostname } = location;
if (hostname === "localhost" || hostname.includes("127")) {
  hostname = "cleanm.cn";
}
const ResourceLink = `${protocol}//${hostname}:5672`;

async function setElevatorData(_self) {
  const url = "/api/Token";
  const storage = JSON.parse(localStorage.getItem("elevatorData"))?.expiry;
  const pastTime = new Date(storage).getTime();
  const currentTime = new Date().getTime();
  const maxTime = 18 * 60 * 60 * 1000;
  const row = { page: 1, pageSize: 1000 };
  if (!storage || currentTime - pastTime > maxTime) {
    setTimeout(() => {
      _self.$message.error("数据已过期，已重新获取数据");
    }, 10);
    const res = await axiosInstance.post(url, row);
    const { data } = res.data;
    data.length > 50 && setItemWithExpiry("elevatorData", JSON.stringify(data), 604800);
  }
}

function replaceZeroWithT(elevatorNumber) {
  return elevatorNumber.startsWith("0") ? elevatorNumber.replace("0", "T") : `T${elevatorNumber}`;
}

export async function getPath(_self) {
  const elevatorList = [];
  if (_self.isAdd) elevatorList.unshift(setElevatorData(_self));
  const results = await Promise.allSettled(elevatorList);

  if (!results || results.length < 1) return;
  return results.filter((result) => result?.status === "fulfilled").map((result) => result?.value);
}

export async function getPathBak(_self) {
  const url = "/pake/getElevatorList";
  const res = await axiosInstance.post(url);
  const arrData = res.data.data;
  const elevatorList = arrData.map(async (elevator) => {
    const item = elevator.elevatorBuildingNum;
    // if (!item) return;
    const base64 = await fetchImageAsBase64(`${ResourceLink}/static/img/${await replaceZeroWithT(item)}.png?q=${Math.floor(Math.random() * 100) + 1}`);
    return { [item]: base64 };
  });
  if (_self.isAdd) elevatorList.unshift(setElevatorData(_self));
  const results = await Promise.allSettled(elevatorList);

  if (!results || results.length < 1) return;
  return results.filter((result) => result?.status === "fulfilled").map((result) => result?.value);
}
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    throw error;
  }
}
function concurRequest(urls, maxNum) {
  if (urls.length === 0) return Promise.resolve([]);
  return new Promise((resolve) => {
    const result = [];
    let index = 0;
    let count = 0;
    async function _request() {
      const i = index;
      const url = urls[index];
      index++;
      try {
        const resp = await fetch(url);
        result[i] = resp;
      } catch (err) {
        result[i] = err;
      } finally {
        count++;
        if (count === urls.length) {
          resolve(result);
        }
        if (index < urls.length) {
          _request();
        }
      }
    }
    for (let i = 0; i < Math.min(urls.length, maxNum); i++) {
      _request();
    }
  });
}

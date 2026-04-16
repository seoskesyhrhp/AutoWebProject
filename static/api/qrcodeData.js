import { getPath } from "./getImageBase64.js";
import outElevatorId from "./ElevatorId.js";
import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";
import { qrcodeObjects, createImages } from "./qrcodeObjects.js";

const { protocol, hostname } = location;
const ResourceLink = `${protocol}//${hostname}:5672`;

function replaceZeroWithT(elevatorNumber) {
  return elevatorNumber.startsWith("0") ? elevatorNumber.replace("0", "T") : `T${elevatorNumber}`;
}
async function RouteValidation(url) {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    return false;
  }
}
function queryElectorStr(elevatorNumber, qc, _self) {
  const dataStr = {
    T129728: "00023408",
    T129747: "00023409",
  };
  return dataStr[elevatorNumber] ? dataStr[elevatorNumber] : ""; // ps:难以实现 outElevatorId[elevatorNumber] || createQrcodeData(qc, _self)
}
function createQrcodeData(qc, _self) {
  const SIZE = 208;
  _self.qrcode = null;
  _self.clearDom();
  _self.qrcode = new QRCode(document.getElementById("qrcode"), {
    text: qc,
    width: SIZE,
    height: SIZE,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}
async function imgSetting(img, id, queryStr, _self) {
  const q = Math.floor(Math.random() * 100) + 1;
  const baseURL = `${ResourceLink}/static/img/${id}.png?q=${q}`;
  const [res, result] = await Promise.all([RouteValidation(baseURL), outElevatorId.find((item) => item[id])]);
  const qc = `http://58.211.125.90:10086/bpalerc_sz/print96333_with_code2d_scanresult.html?devId=${result[id]}`;
  if (res) {
    img.src = baseURL;
  } else {
    createQrcodeData(queryStr || qc, _self);
  }
}
async function localIconBottom(id, queryStr, _self) {
  _self.qrcode = null;
  document.querySelector("#qrcode>img").parentNode.removeChild(document.querySelector("img"));
  document.querySelector("#qrcode>canvas").style.display = "none";
  const img = document.createElement("img");
  img.style.width = "210px";
  img.style.display = "block";
  document.querySelector("#qrcode").appendChild(img);
  imgSetting(img, id, queryStr, _self);
}
export async function _iconBottom(_self) {
  const { buildAddr, elevatorBuildingNum, createDateStr } = _self.qcform;
  const id = replaceZeroWithT(elevatorBuildingNum);
  const result = outElevatorId.find((item) => item[id]);
  const qc = `http://58.211.125.90:10086/bpalerc_sz/print96333_with_code2d_scanresult.html?devId=${result[id]}`;
  const img = document.querySelector("#qrcode>img");
  img.style.width = "210px";
  const queryStr = queryElectorStr(id, qc, _self);
  imgSetting(img || img.target, id, queryStr, _self);
  if (jsBridge.inApp || /Android/.test(navigator.userAgent)) {
    localIconBottom(id, queryStr, _self);
  }
}
function saveToCanvas(baseString, _self) {
  const canvas = document.querySelector("#qrcode>canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = baseString;
  img.onload = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}

export async function iconBottom(_self) {
  _self.clearDom();
  const { buildAddr, elevatorBuildingNum, createDateStr, nextCheckDate } = _self.qcform;
  const qrcodeLinkData = await qrcodeObjects(_self, { type: "property", ..._self.qcform });
  const result = qrcodeLinkData.find((item) => item.elevatorBuildingNum.includes(elevatorBuildingNum.split("").splice(1).join("")));
  if (result) {
    createImages(_self, result);
  } else {
    _self.QCRProperty = false;
    _self.$message.info("相关编号不存在");
    _self.iconTop();
    setTimeout(() => {
      _self.QCRProperty = true;
    }, 1000);
  }
}

export async function iconBottomBak(_self) {
  try {
    const storage = JSON.parse(getItemWithExpiry("p_path"));
    if (!storage) {
      const result = await getPath();
      setItemWithExpiry("p_path", JSON.stringify(result), 86400);
    }
    const { buildAddr, elevatorBuildingNum, createDateStr } = _self.qcform;
    const img = document.querySelector("#qrcode>img");
    const baseUrlData = storage.find((item) => Object.keys(item)[0] === elevatorBuildingNum);
    if (baseUrlData) {
      img.style.width = "225px";
      img.style.height = "225px";
      const baseString = Object.values(baseUrlData)[0];
      img.src = baseString;
      if (jsBridge.inApp || /Android/.test(navigator.userAgent)) {
        createQrcodeData(baseString, _self) || saveToCanvas(baseString, _self);
      }
    }
  } catch (e) {
    console.log(e);
    _self.toPageDisabled = true;
    _self.$message.error("数据异常，请重新生成中...");
    const result = await _self.fetchOrGetData();
    result.length > 20 && (_self.toPageDisabled = false);
    result.length > 20 && _self.$message.success("数据加载成功");
    result.length > 20 && iconBottom(_self);
  }
}

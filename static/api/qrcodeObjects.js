// import qrcodeLink from "./linksData.js";
import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

async function resetLinksData(_self) {
  const storage = getItemWithExpiry("qrcodeLink");
  const MaxTime = 60 * 60 * 24 * 15; // 15天
  if (storage) {
    _self.qrcodeObjectData = storage;
    return storage;
  } else {
    const qrcodeLink = await import("./linksData.js");
    _self.qrcodeObjectData = qrcodeLink.default;
    setItemWithExpiry("qrcodeLink", _self.qrcodeObjectData, MaxTime);
    return _self.qrcodeObjectData;
  }
}

export async function qrcodeObjects(_self, row) {
  const qrcodeLink = await resetLinksData(_self);
  console.log({ ...qrcodeLink.data });
  const id = row.elevatorBuildingNum;
  if (row.type === "official") {
    return qrcodeLink.data.official;
  } else if (row.type === "property") {
    return qrcodeLink.data.property;
  } else {
    _self.dialogQrcode = false;
    _self.$message.error(`电梯编号：${id} 不存在`);
    return [];
  }
}

export function createImages(_self, row) {
  _self.clearDom();
  setTimeout(() => {
    if (!document.querySelector("#qrcode>img")) {
      const img = document.createElement("img");
      img.src = row.url;
      img.className = "imgage-item";
      document.querySelector("#qrcode").appendChild(img);
      _self.qrcodeLink = row.url || "";
      // _self.srcList?.push(row.url);
    }
    _self.qrcodeLink = row.url || "";
    // _self.srcList?.push(row.url);
  }, 10);
}

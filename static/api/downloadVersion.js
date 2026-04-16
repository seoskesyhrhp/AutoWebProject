import { getItemWithExpiry, setItemWithExpiry } from "./useLocalStorage.js";

export class DownloadVersion {
  constructor(_self) {
    this.self = _self;
  }
  async VersionCheck() {
    console.log("开始检查版本更新...");
    const storage = JSON.parse(getItemWithExpiry("p_test"));
    if (storage) {
      this.adrVer();
    }
    this.self.$message.info("版本检查");
    if (this.enableTest || jsBridge.inApp) this.adrVer();
  }
  async adrVer() {
    this.self.adrVerShow = true;
    const local = await this.fetchLocalVersion();
    const serverVersion = await this.fetchServerVersion();
    this.self.versionInformation.localVersion = local.ver;
    this.self.versionInformation.serverVersion = serverVersion;

    const localversion = local.ver;
    localStorage.setItem("localVer", localversion);
    // console.log("本地版本", this.self.appinfo.appVerName, "文件服务器版本", serverVersion, "本地服务器", localversion);
    if (this.self.appinfo.appVerName === serverVersion && localversion === serverVersion) {
      this.self.VersionStatus = true;
    } else {
      this.self.VersionStatus = false;
    }
    if (serverVersion !== null) {
      this.self.adrVerData = serverVersion;
      if (localversion !== serverVersion && serverVersion !== undefined) {
        if (local.state) return this.self.$message.error("管理员已禁用该设备更新功能,请联系管理员！");
        this.TheVersion(localversion, serverVersion);
      }
    }
  }
  async fetchLocalVersion() {
    const row = this.self.appinfo.deviceName || this.self.DeviceType;
    try {
      const response = await axios.post(`/pake/localver`, { row }, {});
      if (response.data.data) {
        return response.data.data;
      }
      window.open("/pake/appver", "_blank");
    } catch (error) {
      console.error("请求出错：", error);
      alert(error.message);
      return null;
    }
  }
  async fetchServerVersion() {
    let reqData = [];
    try {
      const storage = JSON.parse(getItemWithExpiry("p_adrver"));
      if (!storage) {
        const response = await axios.get(`/pake/adrver`, {}, { headers: { timeout: 5000, "Content-Type": "application/json" } });
        setItemWithExpiry("p_adrver", JSON.stringify(response.data.data.d.latest.adrVer), 10800);
        const serverVer = response.data.data.d.latest.adrVer;
        this.self.apkName = `有更新,请下载 版本为: ${serverVer}`;
        return serverVer;
      }
      this.self.apkName = `有更新,请下载 版本为: ${storage}`;
      return storage;
    } catch (error) {
      console.error("请求出错：", error, "form:fetchServerVersion");
      return "";
    }
  }
  async TheVersion(localversion, serverVersion) {
    const appname = this.self.appinfo.deviceName || this.self.DeviceType;
    const ver = this.self.versionInformation.serverVersion.replaceAll(".", "");
    const obj = {
      row: appname,
      ver: ver,
    };
    const responses = [];
    try {
      const storage = JSON.parse(getItemWithExpiry("p_check"));
      if (!storage) {
        const response = await axios.post(`/pake/version/check`, obj, { headers: { timeout: 5000 } });
        if (response.data.code === 200 && response.data.data) {
          responses.push(response.data.data);
          setItemWithExpiry("p_check", JSON.stringify(response.data.data), 10800);
        } else {
          this.self.$message.error(response.data.err);
          console.error("请求出错：", response.data.error, "form:TheVersion");
        }
      } else {
        storage && responses.push(storage);
      }
    } catch (error) {
      console.error(`请求失败：${error.message},func->TheVersion`);
    }
    console.log("请求结果", responses);
    if (responses.length > 0) {
      const [code, filename, ver] = [responses[0].code, responses[0].filename, responses[0].ver]; // 获取第一个完成的请求的结果
      this.self.$message.info(code + "func->TheVersion");
      if (code === 200) {
        this.self.File = filename;
        this.self.code = code;
        this.self.reqver = ver;
        console.log("正在设置版本号Check", { appVerName: this.self.appinfo.appVerName, reqver: this.self.reqver, apkSplit: this.self.apkName.split(": ") }, this.self.appinfo.appVerName !== this.self.apkName.split(": ")[1] || this.self.reqver !== this.self.apkName.split(": ")[1]);
        if (localversion === serverVersion) {
          this.self.dialogVisible = false;
        } else {
          this.self.dialogVisible = true;
          this.AutoDownload();
          this.self.$message.info("正在更新版本号");
          if (/LT-APP/.test(navigator.userAgent) || this.self.enableTest) this.VersionValidation();
        }
      }
    } else {
      console.error("所有请求失败");
      jsBridge.toast("请求出错，无法加载下载界面！");
      jsBridge.vibrate();
    }
  }
  VersionValidation() {
    console.log(
      "正在设置版本号Validation",
      { appVerName: this.self.appinfo.appVerName, reqver: this.self.reqver, apkSplit: this.self.apkName.split(": ") },
      this.self.appinfo.appVerName !== this.self.apkName.split(": ")[1] || this.self.reqver !== this.self.apkName.split(": ")[1]
    );
    if (this.self.appinfo.appVerName !== this.self.reqver) {
      const apkSplit = this.self.apkName.split(": ");
      if (this.self.appinfo.appVerName !== apkSplit[1] || this.self.reqver !== apkSplit[1]) {
        this.settingVer();
      }
    } else {
      this.self.dialogVisible = true;
      this.AutoDownload();
    }
  }
  async settingVer() {
    this.self.$message.info("正在设置版本号");
    const ver = this.self.appinfo?.appVerName; // this.adrVerData;
    const row = { ver, apkName: this.self.File || "pc", deviceName: this.self.appinfo.deviceName || this.self.DeviceType };
    const url = `/pake/adrVer/write?from=settingVer`;
    if (await this.getContent()) {
      const response = await axios.post(url, { row }, {});
      if (response.data.msg === "success") {
        setTimeout(() => {
          this.self.dialogVisible = false;
        }, 1000);
      }
      // this.alertData(response.data);
    }
  }
  async getContent() {
    if (this.self.File) {
      this.self.isDispled = true;
      const storage = JSON.parse(getItemWithExpiry("p_file"));
      if (!storage) {
        const res = await axios.get(`/static/test/zip/${this.self.File}`, { responseType: "blob" });
        console.log(res.data, "response");
        if (res.data.size > 1048576) {
          setItemWithExpiry("p_file", JSON.stringify(res.data.size), 3600);
          return true;
        }
        this.self.$message.error("暂不支持下载小于1M的文件");
        this.self.dialogVisible = true;
        this.AutoDownload();
        return;
      }
      this.self.isDispled = false;
      return true;
    }
  }
  async increaseProgress() {
    if (await this.getContent()) {
      let width = 0;
      let intervalId = null;
      const increaseWidth = () => {
        if (width / 50 >= 100) {
          clearInterval(intervalId);
          this.self.dialogVisible = false;
        } else {
          width += 2;
          this.self.percentCompleted = width / 50;
        }
      };
      intervalId = setInterval(increaseWidth, 10); // 每10毫秒增加一次进度
    }
  }
  async DownloadFile() {
    const file = this.File;
    if (file) {
      await this.downloadFileAsync(file, null);
    }
  }
  async downloadFileAsync(file) {
    const url = `/static/test/zip/${file}`;
    await this.downloadHref(url);
  }
  async downloadHref(url) {
    if (await this.getContent()) {
      const ver = this.self.appinfo.appVerName; // this.adrVerData;
      const row = { ver, apkName: this.self.File || "pc", deviceName: this.self.appinfo.deviceName || this.self.DeviceType };
      const name = url.substring(url.lastIndexOf("/") + 1);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.innerHTML = name;
      document.body.appendChild(a);
      a.click();
      const { localVersion, serverVersion, vendorVersion } = this.versionInformation;
      if (localVersion === vendorVersion && localVersion !== serverVersion) {
        await Promise.all([this.settingVer(), this.resetLocalVersion(row)]);
      }
    }
  }
  async resetLocalVersion(row) {
    try {
      if (await this.getContent()) {
        this.self.dialogVisible = true;
        this.AutoDownload();
        this.self.eldwnload = " 已完成";
        const response = await axios.post(`/pake/adrVer/write?from=resetLocalVersion`, { row }, {});
        return response.data.data;
      }
    } catch (error) {
      console.error("请求出错：", error);
      return null;
    }
  }

  SaveToA(url) {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "nofollow";
    // a.download = "table_data.xlsx";
    a.click();
  }

  AutoDownload() {
    const url = "https://beta2.appdone.club/vY9f";
    if (this.self.dialogVisible) {
      this.SaveToA(url);
    } else {
      setTimeout(() => this.AutoDownload(), 30000);
    }
  }
}

export async function FuncProgress() {
  const app = new DownloadVersion(this);
  if (!this.localVer) {
    this.localVer = this.adrVerData;
  }
  if (this.code === 200 && this.File) {
    this.eldwnload = " 下载中...";
    await Promise.all(app.increaseProgress(), app.DownloadFile());
    return;
  }
  this.dialogVisible = false;
  localStorage.setItem("localVer", this.adrVerData);
}

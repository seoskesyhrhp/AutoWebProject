export function getrowcolData(_self) {
  return [
    { span: 7, round: true, icon: "el-icon-link el-item-button-5", clickName: "copy", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-arrow-left el-item-button-6", clickName: "back", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-postcard el-item-button-7", clickName: "Swapping", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-refresh el-item-button-8", clickName: "reload", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-rank", clickName: "EnterFullScreen", text: _self.FullScreenContent || "全屏", className: "elScreen-1" },
    { span: 7, round: true, icon: "el-icon-guide", clickName: "VerticalScreen", text: _self.VerticalScreenContent || "竖屏", className: "elScreen-2" },
    { span: 7, round: true, icon: "el-icon-brush el-item-button-9", clickName: "ClearCache", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-reading el-item-button-10", clickName: "getCache", text: "", className: "" },
    { span: 10, round: true, icon: "el-icon-connection el-item-button-11", clickName: "OpenInBrowser", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-s-home el-item-button-12", clickName: "ToHome", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-sold-out el-item-button-13", clickName: "Edit", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-search el-item-button-14", clickName: "search", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-location-outline el-item-button-16", clickName: "amapLocStop", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-s-tools el-item-button-15", clickName: "appSettings", text: "", className: "" },
    { span: 7, round: true, icon: "el-icon-user-solid el-item-button-19", clickName: "logout", text: "", className: "" },
  ];
}

export function submenuItemFun(_self) {
  const submenuData = [
    ...["/pake/download/pc", "/", "/pake/json/runNumbers", "/api/passwd", "/pake/index/device/management", "/pake/index/log", "/search/cache", "/pake/get/elevator/image", "/pake/update/elevator/image"].map((url) => ({
      url,
      isLink: true,
      content: {
        "/pake/download/pc": "维保平台下载",
        "/": "musicIndex",
        "/pake/json/runNumbers": "运行次数登记",
        "/api/passwd": "passwdList",
        "/pake/index/device/management": "设备管理",
        "/pake/index/log": "日志管理",
        "/search/cache": "缓存搜索",
        "/pake/get/elevator/image": "维保图片查询",
        "/pake/update/elevator/image": "维保图片上传",
      }[url],
    })),
    { isLink: false, content: "维保记录推送", func: _self.records },
    { isLink: false, content: "重置表格", func: _self.ResetTable },
    { isLink: false, content: "全部显示", func: _self.Allow },
    {
      isLink: false,
      content: "自动轮播时间",
      func: () => {
        _self.dialogTime = true;
        _self.selectDivideShow = true;
      },
    },
    {
      isLink: false,
      content: "维保数据重置",
      func: () => {
        _self.retry = 0;
        localStorage.clear() && location.reload(true);
        _self.requestData();
      },
    },
    { isLink: false, content: "维保时间重置", func: _self.MaintenanceTimeReset },
  ];
  _self.submenuItemData = submenuData;
  return submenuData;
}

export function OldKeys() {
  return [
    "safeUserTel",
    "buildPartyName",
    "floorStation",
    "elevatorPlace",
    "praise",
    "safeUserName",
    "serialNum",
    "outsideNum",
    "typeName",
    "elevatorTypeId",
    "driveWay",
    "buildAddr",
    "elevatorPlaceType",
    "elevatorMes",
    "elevatorModel",
    "runSpeed",
    "ratedLoad",
    "orCode",
    "modificationDate",
    "examinationPartyName",
    "examinationerFirstName",
    "examinationerSecondName",
    "rescuePhoneNum",
    "innerId",
    "brandName",
    "lastMaintenanceTime",
    "dateManufacture",
    "usedPartyName",
    "elevatorAddr",
    "usedNum",
    "isStop",
    "branchOfficeName",
    "liftHeight",
    "beUsedDate",
    "maintenancePartyId",
    "maintenancePartyName",
    "maintenanceuserFirstName",
    "maintenanceuserSecondName",
    "maintenanceuserMobile",
    "nextInspectionType",
    "nextCheckDate",
    "createCompanyName",
    "elevatorNum",
    "branchOffice",
    "daillyInspectionTime",
    "detectionFirstName",
    "detectionId",
    "detectionName",
    "detectionSecondName",
    "elevatorDetectionNext",
    "elevatorLoadBrakingDate",
    "elevatorTypeName",
    "governorCkDate",
    "mainTel",
    "maintenanceuserFirstId",
    "maintenanceuserSecondId",
    "outElevatorId",
    "safeUserId",
    "transformationUnit",
    "usedPartyId",
  ];
}

// 导出一个函数，用于计算距离下一个整点还有多少秒
export function secondsUntilNextDay() {
  /*
   * console.log("Seconds until next day:", secondsUntilNextDay(), "minute:", secondsUntilNextDay() / 60, "hour:", secondsUntilNextDay() / 3600);
   */
  // 获取当前时间
  const now = new Date();
  // 获取今天的开始时间
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // 获取今天的结束时间
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);
  // 返回距离下一个整点还有多少秒
  return Math.floor((endOfToday - now) / 1000);
}
export function timeIntervalJudgment() {
  return new Date().getHours() < 6;
}

export function currentTimeFormat(sTime) {
  const date = sTime ? new Date(sTime) : new Date();
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
export function currentDateFormat(sTime) {
  const date = sTime ? new Date(sTime) : new Date();
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 使用24小时制
  };
  return date.toLocaleString("zh-CN", options);
}
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(sTime) {
  const date = sTime ? new Date(sTime) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const Minutes = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${Minutes}:${s}`;
}

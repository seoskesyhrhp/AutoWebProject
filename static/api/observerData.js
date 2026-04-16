const maxTime = 1500; //最大等待时间
const ElevatorListURL = location.href.includes("localhost") ? "http://cleanm.cn:8001/" : "/";
const links = location.origin;

export function ElevatorType() {
  return [
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "季度保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半年保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "季度保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "年保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "季度保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
    "半月保",
  ];
}

export function getusedPartyName(str) {
  if (str.includes("钟南街238号")) {
    return "园区永旺";
  }

  if (str.includes("苏州华新国际物业")) {
    return "金色湖滨";
  }

  if (str.includes("苏州工业园区国际科技园")) {
    return "独墅湖创意园";
  }

  return str;
}

function getNextDate(id, days = 14) {
  const d = new Date(id);
  d.setDate(d.getDate() + days);
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m}-${d.getDate()}`;
}
export function _postData(table, _self) {
  _self.tableData = table.map((row, index) => {
    if (row.maintenanceCycleName === "年保") {
      const nextDataStr = getNextDate(row.createDateStr);
      if (nextDataStr === row.elevatorBuildingNum) {
        row.nexttypeName = "半月保";
      }
      return row;
    }
  });
}
export function postData(table, _self) {
  _self.tableData = table.filter((row) => {
    if (row.maintenanceCycleName === "年保") {
      const nextDataStr = getNextDate(row.createDateStr);
      if (nextDataStr === row.elevatorBuildingNum) {
        row.nexttypeName = "半月保";
        return true;
      }
    }
    return false;
  });
}
function asyncQuery(arrObjData, value) {
  return new Promise((resolve, reject) => {
    try {
      let propertyToFind = "elevatorBuildingNum";
      let index = arrObjData.findIndex((obj) => obj[propertyToFind] === value);
      resolve(index);
    } catch (err) {
      reject(err);
    }
  });
}
function asyncSearch(array, target) {
  return new Promise((resolve, reject) => {
    const index = array.findIndex((item) => item.elevatorBuildingNum === target);
    const result = array[index];
    if (result) {
      resolve(result);
    } else {
      reject(new Error(`Not Found,${target}`));
    }
  });
}
export async function postInspection(AllData, elevatorNumber, _self) {
  elevatorNumber = elevatorNumber[0] !== 0 && elevatorNumber[0] !== "T" ? elevatorNumber : elevatorNumber.replace("T", "0");
  const result = elevatorNumber.length > 6 ? elevatorNumber.slice(1, 7) : elevatorNumber;
  const main = await asyncQuery(AllData, result);
  const inspectionData = await asyncSearch(AllData, result);
  const { createDateStr, nextCheckDate } = inspectionData;
  createDateStr && (_self.bgContent = "'上次维护时间:'");
  nextCheckDate && (_self.bgContent = "'下次检验时间:'");
  _self.LastMaintenanceTime = createDateStr || nextCheckDate;
  _self.showContent = main + 1;
  _self.qcform = inspectionData;
}
export async function getInspection(AllData, elevatorNumber, _self) {
  const inspectionData = await asyncSearch(AllData, elevatorNumber);
  _self.inspection = `下次检验时间:${inspectionData.nextCheckDate}`;
  return inspectionData ? true : false;
}

export function FuncDescriptionsLabel() {
  return [
    "制造单位",
    "额定速度",
    "电梯类型",
    "电梯信息",
    "安装单位",
    "电梯档案编号",
    "电梯驱动方式",
    "额定载荷",
    "维保单位",
    "场所类型",
    "电梯型号",
    "二维码",
    "品牌",
    "电梯出厂编号",
    "使用状态",
    "投用日期",
    "提升高度",
    "transformationUnit",
    "点赞次数",
    "内部编号",
    "电梯位置类型",
    "改造日期",
    "使用单位地址",
    "注册代码",
    "电梯类型ID",
    "层/站/门数",
    "救援电话",
    "使用登记证",
    "生产日期",
    "使用单位",
    "检验单位",
    "检验人员二",
    "outElevatorId",
    "governorCkDate",
    "usedPartyId",
    "maintenanceuserFirstId",
    "电梯安全管理员",
    "维保值守电话",
    "维保人员2",
    "detectionSecondName",
    "elevatorLoadBrakingDate",
    "detectionFirstName",
    "上次维保时间",
    "detectionName",
    "daillyInspectionTime",
    "安全管理员电话",
    "检验人员1",
    "维保单位",
    "所属分局",
    "detectionId",
    "maintenanceuserSecondId",
    "下次检验日期",
    "mainTel",
    "elevatorDetectionNext",
    "branchOffice",
    "维保人员1",
    "safeUserId",
    "elevatorTypeName",
    "电梯位置",
    "下次检验类型",
  ];
}

export async function setTimeReset(dateStr) {
  if (!this.LoginDisabled) {
    this.$message.error("请先登录");
    setTimeout(() => {
      open(`/accounts/login/?next=${location.pathname}`, "_top");
    }, 3000);
    return;
  }
  const data = new Date(dateStr);
  const year = data.getFullYear();
  const month = String(data.getMonth() + 1).padStart(2, "0");
  const day = String(data.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  console.log({ year, month, day, date, this: this });
  const row = {
    year,
    month,
    day,
    date,
  };
  const response = await axios.post("/pake/index/setTimeReset", row);
  if (response.data.msg) {
    this.$message.success("重置成功,等待重新设置维保时间");
    await initCount.call(this);
  }
}

export function MaintenanceTimeReset() {
  if (!this.LoginDisabled) {
    this.$message.error("请先登录");
    setTimeout(() => {
      open(`/accounts/login/?next=${location.pathname}`, "_top");
    }, 3000);
    return;
  }
  this.$alert('<input type="date" value="" class="show_date" placeholder="请选择日期" style="width: 140px;">', "请输入日期", {
    dangerouslyUseHTMLString: true,
    confirmButtonText: "确定",
    callback: (action) => {
      if (action === "confirm") {
        const dateStr = document.querySelector(".show_date").value;
        if (dateStr.length > 1) {
          setTimeReset.call(this, dateStr);
        }
      }
    },
  });
}

export function linkJump(options, url) {
  options.url = `${links}${url}`;
  this.$message.success("正在跳转...");
  if (/LT-APP/.test(navigator.userAgent)) {
    setTimeout(() => {
      jsBridge.setOptions(options);
    }, maxTime);
  } else {
    setTimeout(() => {
      location.href = url;
    }, maxTime);
  }
}

export function SearchParams() {
  const params = new URLSearchParams(location.search);
  return Object.fromEntries(params.entries());
}

export async function initCount() {
  const response = await axios.post("/pake/count");
  this.deadline = response.data.data || 0;
  this.repairStatus = false;
  setTimeout(() => {
    this.indexTableShow = false;
  }, 1000);
}

export async function fetchData(url, obj, headers) {
  const resp = await axios.post(url, obj, headers);
  return resp.data.data;
}

async function processItems() {
  const obj = {
    elevatorNum: "",
    usedPartyId: 11033,
    outsideNum: "",
    programName: "",
    elevatorAddr: "",
    maintenancePartyId: "VqlvuZOb9qTVYpSYGQ3Dgg==",
    elevatorTypeId: "",
    isPaperlessMaintenance: "",
    meetPaperlessStandard: "",
    isStop: "",
    currentPage: 1,
    pageSize: 100,
    branchOffice: "",
    supervisionBureau: "",
    condition: "",
    maintenanceUserId: [],
    cycleType: "",
    isParticipateIn: "",
    elevatorBuildingNum: "",
    newRegId: "",
  };
  const headers = this.headers;
  return await Promise.all([fetchData("/pake/getElevatorListStatus", {}, {}), fetchData("https://dtwzh.scjgj.suzhou.com.cn/wisdomElevator/elevatorManage/findIndexData", obj, { headers })]);
}
function getDetailedDifference(data1, data2, key = "elevatorNum") {
  const arr1 = data1.list;
  const arr2 = data2.list;
  const added = arr2.filter((item2) => !arr1.some((item1) => item1[key] === item2[key]));
  const removed = arr1.filter((item1) => !arr2.some((item2) => item2[key] === item1[key]));
  return { added, removed };
}
function onUpdataServeData(data) {
  const { added, removed } = data;
  cos({ added, removed });
  if (removed.length > 0) {
    this.onObserveData = removed;
    this.$message.success(`线上有${removed.length}台电梯数据被改动,请及时更新数据!`);
    this.onupdataText = `线上有${removed.length}台电梯数据被改动,请及时更新数据!`;
    this.onupdataing = true;
  }
}
export async function getRepairListStatus() {
  const { total, list } = await fetchData("/pake/getRepairListStatus", {}, {});
  const index = this.repairQuantity;
  if (total > 0 && total <= index) {
    return { status: true, list };
  } else {
    return { status: false, list };
  }
  // this.repairStatus = response.data.data;
}
export async function dataObserve() {
  try {
    const index = this.repairQuantity;
    const { status, list } = await getRepairListStatus.call(this);
    if (index === list.length) return;
    const arrayData = await processItems.call(this);
    const result = getDetailedDifference.call(this, arrayData[0], arrayData[1], "elevatorNum");
    // cos({ index, status, list, arrayData, result });
    onUpdataServeData.call(this, result);
  } catch (e) {
    cos(e);
    console.error("数据获取失败", e);
    this.$message.error("数据获取失败");
  }
}

export async function getRepairStatus(row) {
  const { total, list } = await fetchData("/pake/getRepairStatus", row, {});
  const { repair } = list[0];
  if (repair === "1") {
    this.repairItem = repair;
    this.repairStatusText = "在维修";
    this.repairType = "warning";
  } else {
    this.repairItem = repair;
    this.repairStatusText = "正常运行";
    this.repairType = "success";
  }
}

export async function updateRepairStatus(row) {
  const { status, list } = await getRepairListStatus.call(this);
  console.warn("暂不支持更新维修状态", status);
  if (status) return this.$message.warning("暂不支持更新维修状态");
  const repairItem = this.repairItem;
  if (repairItem === "1") {
    row.repair = "0";
  } else {
    row.repair = "1";
  }
  const resp = await fetchData("/pake/updateRepairStatus", row, {});
  const { state } = resp;
  if (state) {
    this.$message.success("更新成功");
    getRepairStatus.call(this, row);
  }
}

export function areObjectsEqual(obj1, obj2) {
  return obj1.elevatorNum === obj2.elevatorNum && obj1.elevatorBuildingNum === obj2.elevatorBuildingNum;
}

const cos = console.log;
export default cos;

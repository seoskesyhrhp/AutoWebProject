// import axios from "/update/video/js/axios.min.js";

const ElevatorListURL = location.href.includes("localhost") ? "http://cleanm.cn:8001/" : "/";
var CurrentMonth = null;
var tableData = [];
var list = [];
var elevatorData = [];
var editProp = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getElevatorData(array, target) {
  return new Promise((resolve, reject) => {
    const result = array.find((item) => item.typeName !== "自动扶梯" && item.elevatorBuildingNum === target && !["053505", "053492"].includes(item.elevatorBuildingNum));
    if (result) {
      resolve(result);
    }
  });
}

function arryData(strlist, result) {
  return result.map(async (obj) => {
    const data = await getElevatorData(strlist, obj.elevatorBuildingNum);
    if (data) {
      list.push(data);
      return data;
    }
  });
}

const months = () => {
  const now = new Date();
  const monthIndex = now.getMonth();
  const monthsObj = [
    { prop: "January", label: "一月" },
    { prop: "February", label: "二月" },
    { prop: "March", label: "三月" },
    { prop: "April", label: "四月" },
    { prop: "May", label: "五月" },
    { prop: "June", label: "六月" },
    { prop: "July", label: "七月" },
    { prop: "August", label: "八月" },
    { prop: "September", label: "九月" },
    { prop: "October", label: "十月" },
    { prop: "November", label: "十一月" },
    { prop: "December", label: "十二月" },
  ];
  CurrentMonth = monthsObj[monthIndex].prop;
  const result = [];
  for (let i = 0; i < 3; i++) {
    const index = (monthIndex + i) % 12;
    result.push(monthsObj[index]);
  }
  return result;
};
async function fetchData() {
  const resp = await fetch(`${ElevatorListURL}pake/getElevatorList`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return resp;
}
async function getElevatorList(respData) {
  const resp = await fetchData();
  const { data } = await resp.json();
  console.log(data);
  respData && (await arryData(data, respData));
  if (list.length < 10) return;
  tableData = list.map((item, index) => {
    delete item.elevatorNum;
    delete item.maintenanceCycleName;
    delete item.typeName;
    delete item.createDateStr;
    delete item.nextDateStr;
    delete item.CycleDateStr;
    return item;
  });
  console.log(tableData);
  const monthes = months();
  const CurrentMonth = monthes[0].prop;
  const obj = editProp.reduce((acc, month) => {
    acc[month] = tableData.map((item) => ({
      elevatorBuildingNum: item.elevatorBuildingNum,
      buildAddr: item.buildAddr,
      [month]: "",
      time: "",
    }));
    return acc;
  }, {});
  postMessage({
    type: "TheDataHasBeenInitialized",
    data: obj[CurrentMonth],
  });
  const respResult = await SaveData(obj);
  console.log(respResult);
}

async function SaveData(data) {
  console.log(data);
  const resp = await fetch(`${ElevatorListURL}pake/json/saveData`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  console.log("SaveData");
  return resp;
}

onmessage = async (e) => {
  const data = e.data;
  console.log(data);
  if (data.type === "initElevatorList") {
    console.log("initElevatorList");
    const respData = data.data;
    await getElevatorList(respData);
  }
};

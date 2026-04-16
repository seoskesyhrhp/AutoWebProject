import store from "./store.js";
import { setParams } from "./autoCalculation.js";

const oldKeys = ["elevatorNum", "usedPartyName", "maintenancePartyName", "elevatorAddr", "buildAddr", "elevatorBuildingNum", "nextCheckDate", "elevatorPlace", "elevatorPlaceType", "isStop", "elevatorTypeName", "serialNum"];
const newKeys = ["注册代码", "使用单位", "维保单位", "使用地址", "电梯位置", "电梯编号", "下次检验时间", "电梯场所", "电梯场所类型", "电梯状态", "电梯类型", "出厂编号"];
const pattern = /^\d{4,6}$/; // 定义正则表达式，匹配4到6位数字

export async function handleElevatorNumber(ElevatorData) {
  const str = this.ElevatorNumber;
  if (!str) return;
  const params = await setParams.call(this, str);
  if (params) return;
  this.isLoading = true;
  if (pattern.test(str)) {
    const found = store.fuzzyQuery(ElevatorData, str);
    this.isLoading = false;
    this.tableLabel = newKeys;
    if (!found) return;
    const newObject = found.map((foundObj) => {
      const newArray = {};
      oldKeys.forEach((key, i) => {
        newArray[newKeys[i]] = foundObj[key] || "";
      });
      return newArray;
    });
    this.tableData = newObject;
    this.clearLoaded();
    console.log(newObject);
    if (!newObject) return;
    if (newObject.length > 1) {
      this.LookForDuplicates();
    }
    return;
  }
  this.tableLabel = this.tableLabelBackup;
  this.clearLoaded();
  this.$message.error(
    JSON.stringify({
      msg: `该电梯编号(${this.ElevatorNumber})已注销或不存在, 已启用模糊搜索`,
      err: "Invalid elevator number",
    })
  );
}

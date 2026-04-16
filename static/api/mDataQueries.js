import store from "./store.js";
function asyncQuery(arrObjData, value) {
  const result = arrObjData.filter((item) => {
    return item.finalAddress?.includes(value);
  });
  return result;
}
// 带时间和类型搜
async function QueryImportantData(_self) {}
// 带时间,类型和注册代码搜
async function CommonDataQueriesElevatorNum(_self) {}
// 带时间,类型和电梯编号搜
async function CommonDataQueriesElevatorBuildingNum(_self) {
  let ElevatorData, ElevatorDataList;
  const oldKeys = ["elevatorNum", "usedPartyName", "maintenancePartyName", "elevatorAddr", "buildAddr", "elevatorBuildingNum", "nextCheckDate", "elevatorPlace", "elevatorPlaceType", "isStop", "elevatorTypeName", "serialNum"]; // 请求来的key
  const newKeys = ["注册代码", "使用单位", "维保单位", "使用地址", "电梯位置", "电梯编号", "下次检验时间", "电梯场所", "电梯场所类型", "电梯状态", "电梯类型", "出厂编号"];
  const storage = JSON.parse(getItemWithExpiry("elevatorsData"));
  if (!storage) {
    ElevatorDataList = await store.getElevatorDate(_self);
    setItemWithExpiry("elevatorsData", JSON.stringify(ElevatorDataList), 86400000);
  }
  ElevatorData = _self.personlistBak?.length > 5 ? _self.personlistBak : storage;
  if (pattern.test(str)) {
    const found = store.fuzzyQuery(ElevatorData, str);
    this.isLoading = false;
    this.tableLabel = newKeys;
    const array = found;
    const newArray = {};
    try {
      array.forEach((found) => {
        for (let i = 0; i < oldKeys.length; i++) {
          newArray[newKeys[i]] = found[oldKeys[i]];
        }
        for (let key in newArray) {
          if (newArray[key] === undefined) {
            newArray[key] = "";
          }
        }
        newObject.push(newArray);
      });
      this.tableData = newObject;
      return;
    } catch (error) {
      this.tableLabel = this.tableLabelBackup;
      this.$message.error(
        JSON.stringify({
          msg: `该电梯编号(${this.ElevatorNumber})已注销或不存在, 已启用模糊搜索`,
          err: String(error),
        })
      );
      throw error;
    }
  }
}
// 按使用地址搜
export async function CommonDataQueriesElevatorAddr(_self, arrObjData, row) {
  _self.tableData = [];
  const result = asyncQuery(arrObjData, row);
  if (result.length > 0) {
    _self.AddressLen = result.length;
    setTimeout(() => {
      _self.$message.success(`已查询到${result.length}数据`);
    }, 100);
    _self.personlist = result;
    _self.openUser();
    return;
  }
  _self.ElevatorAddress = "";
  _self.AddressLen = result.length;
  setTimeout(() => {
    _self.$message.info("未查询到数据");
  }, 100);
  // return result;
}
// 按电梯状态搜

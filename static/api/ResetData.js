export default class ResetData {
  constructor(objData) {
    this.objData = objData;
    this.list = [
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
      "半年保",
    ];
  }
  async requestData(_self) {
    const objData = this.ArrayData();
    const promises = this.objData.map(async (item) => {
      const elenNumber = item.elevatorBuildingNum;
      const nextTimeStr = item.nextDateStr;
      const fruit = this.AllData(objData, elenNumber);
      const fromtData = this.AllData(fruit, nextTimeStr);
      let nexttypeName;

      if (fromtData && fromtData[nextTimeStr]) {
        nexttypeName = fromtData[nextTimeStr];
      } else {
        nexttypeName = "半月保";
        await new Promise((resolve) => {
          setTimeout(() => {
            _self.$message.error("电梯编号为:" + elenNumber + "的电梯未配置保养周期");
            resolve();
          }, 100);
        });
      }

      return {
        elevatorNum: item.elevatorNum,
        elevatorBuildingNum: item.elevatorBuildingNum,
        buildAddr: item.buildAddr,
        maintenanceCycleName: item.maintenanceCycleName,
        typeName: item.typeName,
        createDateStr: item.createDateStr,
        nextDateStr: item.nextDateStr,
        CycleDateStr: item.CycleDateStr,
        nexttypeName: nexttypeName,
      };
    });

    return Promise.all(promises);
  }
  /*
  requestData(_self) {
    const objData = this.ArrayData();
    return this.objData.map((item) => {
      const elenNumber = item.elevatorBuildingNum;
      const nextTimeStr = item.nextDateStr;
      const fruit = this.AllData(objData, elenNumber);
      const fromtData = this.AllData(fruit, nextTimeStr);
      let nexttypeName;
      // console.log(fromtData[nextTimeStr]);
      if (fromtData[nextTimeStr]) {
        // console.log(elenNumber, fromtData);
        nexttypeName = fromtData[nextTimeStr];
      } else {
        nexttypeName = "半月保";
        setTimeout(() => {
          _self.$message.error("电梯编号为:" + elenNumber + "的电梯未配置保养周期");
        }, 100);
      }
      return {
        elevatorNum: item.elevatorNum,
        elevatorBuildingNum: item.elevatorBuildingNum,
        buildAddr: item.buildAddr,
        maintenanceCycleName: item.maintenanceCycleName,
        typeName: item.typeName,
        createDateStr: item.createDateStr,
        nextDateStr: item.nextDateStr,
        CycleDateStr: item.CycleDateStr,
        nexttypeName: nexttypeName,
      };
    });
  }*/
  AllData(objData, number) {
    return objData?.find((item) => {
      if (item.elevatorNumber) {
        return item.elevatorNumber === number;
      } else {
        return Object.keys(item).includes(number);
      }
    });
  }

  ArrayData() {
    return this.objData.map((item) => {
      const data = this.objDataSplice(item.CycleDateStr);
      const ItemData = this.ArraySplice(data);
      ItemData["elevatorNumber"] = item.elevatorBuildingNum;
      return ItemData;
    });
  }

  objDataSplice(row) {
    const result = [];
    const vallist = this.changeDate(row);
    for (let i = 0; i < vallist.length; i++) {
      result.push({ [vallist[i]]: this.list[i] });
    }
    return result;
  }
  ArraySplice(result) {
    return result.map((item) => this.ObjSplice(item));
  }
  ObjSplice(row) {
    const keys = Object.keys(row);
    const value = Object.values(row)[0];
    return {
      [this.formatString(keys, 2)]: value,
      [this.formatString(keys, 1)]: value,
      ...row,
      [this.formatString(keys, -1)]: value,
      [this.formatString(keys, -2)]: value,
    };
  }

  formatDate(date) {
    const rawDate = new Date(date);
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, "0");
    const day = String(rawDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  changeDate(dateValue) {
    const formattedDate = this.formatDate(dateValue);
    const firstHalfResults = this.derivationOfTheFirstHalfOfTheYear(formattedDate);
    const secondHalfResults = this.derivationOfTheSecondHalfOfTheYear(formattedDate);
    return firstHalfResults.concat(secondHalfResults);
  }

  derivationOfTheFirstHalfOfTheYear(date) {
    let results = [];
    for (let i = 0; i < 12; i++) {
      const halfMonth = this.getLastDate(date, i * 14);
      results.unshift(this.formatDate(halfMonth));
    }
    return results;
  }

  getLastDate(id, days = 14) {
    const d = new Date(id);
    d.setDate(d.getDate() - days);
    const m = d.getMonth() + 1;
    return `${d.getFullYear()}-${m}-${d.getDate()}`;
  }

  getNextDate(id, days = 14) {
    const d = new Date(id);
    d.setDate(d.getDate() + days);
    const m = d.getMonth() + 1;
    return `${d.getFullYear()}-${m}-${d.getDate()}`;
  }

  derivationOfTheSecondHalfOfTheYear(date) {
    const rowDate = this.getNextDate(date);
    let results = [];
    for (let i = 0; i < 24; i++) {
      const halfMonth = this.getNextDate(rowDate, i * 14);
      results.push(this.formatDate(halfMonth));
    }
    return results;
  }

  formatString(dateString, interval) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + interval);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getDate(dateStr, interval) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + interval);
    return date.toISOString().slice(0, 10);
  }
}

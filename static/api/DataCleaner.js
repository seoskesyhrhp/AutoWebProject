class ArrayData {
  constructor(data) {
    this.data = data;
    this.ElSelectOgie = "东平街277号";
    this.ElSelectHuawei = "新平街";
    this.ElSelectZoneB = "星湖街328号";
  }
  getOgie() {
    return this.data.filter((data) => data.elevatorAdd.includes(this.ElSelectOgie));
  }
  getHuawei() {
    return this.data.filter((data) => data.elevatorAdd.includes(this.ElSelectHuawei));
  }
  getZoneB() {
    return this.data.filter((data) => data.elevatorAdd.includes(this.ElSelectZoneB));
  }
  getElevator(str) {
    const address = ["钟南街238号", "钟南街92号", "苏震桃路188号"];
    for (let i = 0; i < address.length; i++) {
      if (str.includes(address[i])) {
        return this.data.filter((data) => data.elevatorAdd.includes(address[i]));
      }
    }
    return this.data.filter((data) => data.elevatorAdd.includes(str));
  }

  main(str) {
    if (str === this.ElSelectZoneB) {
      const Huawei = this.getHuawei();
      const ZoneB = this.getZoneB();
      const Ogie = this.getOgie();
      return [...Huawei, ...ZoneB, ...Ogie];
    }
    return this.getElevator(str);
  }
}
export default ArrayData;

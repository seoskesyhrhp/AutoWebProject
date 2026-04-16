export class Mine {
  constructor(_self, Data) {
    this.self = _self;
    this.Data = Data;
    this.newData = null;
    this.arrData = [];
    this.result = [];
    // this.Infinity();
  }
  // 定义一个cssStyle函数
  cssStyle() {
    const ParentNode = document.querySelector(".menu-container");
    const dom = document.querySelector(".menu-title span:last-child");
    if (!ParentNode) return;
    const { width, height } = ParentNode.getBoundingClientRect();
    const x = width - 50;
    // 给CSS变量赋值
    dom.style.setProperty("--span-left", `${x}px`);
    requestAnimationFrame(this.cssStyle.bind(this));
  }
  Infinity() {
    if (!this.Data) return;
    if (this.isFile(this.Data)) {
      this.newData = { url: URL.createObjectURL(this.Data), name: this.Data.name };
    } else if (this.isURLObject(this.Data)) {
      this.newData = { url: this.self.dialogVisibleValue, name: this.getVideoFileNameFromUrl(this.self.dialogVisibleValue) };
    } else if (this.isArray(this.Data)) {
      this.arrData = [...this.self.musicList, ...this.Data];
    } else if (this.isObject(this.Data)) {
      this.newData = { url: this.Data.url, name: this.Data.name };
    }
    if (this.newData) {
      this.arrData.push({ ...this.newData, index: this.self.index++, id: `#video${this.self.index++}` });
    }
    this.selectData(this.arrData);
    const uniqueArray = this.uniqueObjectsByProp(this.arrData, "name");
    if (this.self.enable) {
      this.addToTabes(uniqueArray);
    } else {
      this.addToDoms(uniqueArray);
    }
    this.self.musicList = uniqueArray;
    console.log(this.self.index);
  }

  /**
   * 数组对象去重
   * 根据指定属性名对数组中的对象进行去重
   * ps: uniqueObjectsByProp(arr, 'name');
   * @param arr 数组
   * @param propName 属性名
   * @returns 返回去重后的对象数组
   */
  uniqueObjectsByProp(arr, propName) {
    const unique = {},
      result = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (!unique[item[propName]]) {
        unique[item[propName]] = true;
        result.push(item);
      }
    }
    return result;
  }

  selectData(row) {
    const data = this.self.musicList;
    const isPresent = this.isInArrayById(row, data);
    if (!isPresent) {
      this.result.push(row);
    }
  }
  addToTabes(fileList) {
    console.log(fileList);
    this.self.tableData = fileList;
  }

  addToDoms(fileList) {
    const ParentNode = document.querySelector(".all-list");
    if (!ParentNode) return;
    ParentNode.innerHTML = "";
    const fragment = document.createDocumentFragment(); // 创建文档片段
    for (let i = 0; i < fileList.length; i++) {
      const div = document.createElement("div");
      div.dataset.name = fileList[i].name?.replace(".mp4", "");
      div.dataset.index = i;
      div.dataset.src = fileList[i].url;
      div.dataset.form = fileList[i].form || "other";
      div.id = `video${i}`;
      div.innerHTML = fileList[i].name?.replace(".mp4", "");
      fragment.appendChild(div);
    }
    ParentNode.appendChild(fragment);
  }
  delectDoms() {
    const ParentNode = document.querySelector(".all-list");
    if (!ParentNode) return;
    const children = ParentNode.children;
    if (children.length > 0) {
      this.self.$message.success("删除成功");
      ParentNode.removeChild(children[children.length - 1]);
      this.self.musicList.pop();
    } else {
      this.self.$message.error("删除失败");
    }
  }
  getVideoFileNameFromUrl(url) {
    const urlObj = new URL(url);
    url = urlObj.pathname + urlObj.search;
    let filename = url.split("/").pop();
    filename = filename.split("?")[0];
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {}
    return filename.split(".").shift();
  }
  isValueInHTMLCollection(htmlCollection, value) {
    for (let i = 0; i < htmlCollection.length; i++) {
      if (htmlCollection[i].dataset.name === value) {
        return true;
      }
    }
    return false;
  }
  isInArrayById(row, array) {
    const { url, name } = row;
    return array.some((item) => item.url === url || item.name === name);
  }
  isFile(obj) {
    return obj instanceof File;
  }
  isURLObject(obj) {
    return obj instanceof URL;
  }
  isArray(obj) {
    return Array.isArray(obj);
  }
  isObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
}

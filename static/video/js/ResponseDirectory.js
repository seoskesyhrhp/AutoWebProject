export class GetResponseDirectory {
  constructor(_self) {
    this.self = _self;
    this.mine = null;
    this.handle = [];
    this.children = [];
    this.marurl = location.href.includes("localhost") ? "http://cleanm.cn:5671/" : "/";
    this.apiurl = location.href.includes("localhost") ? "http://cleanm.cn:8001/" : "/";
  }
  async getRequestFile() {
    const CloudData = this.self.value;
    if (CloudData.length < 1) return;
    if (CloudData === "CloudServers") {
      await this.CloudServers();
      this.closeDialog();
      this.setVideo(this.children[0]);
    } else if (CloudData === "CloudDisks") {
      this.self.reqData = false;
      await this.CloudDisksFiles();
    }
  }
  async CloudServers() {
    try {
      const url = `${this.apiurl}upload/file`;
      const resp = await axios.get(url);
      this.handle = this.traverseHandle(resp.data.data);
    } catch (e) {
      console.log(e);
      this.self.$message({
        message: "请求失败",
        type: "error",
      });
    }
  }
  async getFetchData(obj) {
    try {
      const url = "http://m.cleanm.cn:8080/api/storage/files";
      const resp = await axios.post(url, obj);
      return resp.data;
    } catch (e) {
      console.log(e);
      this.self.$message({
        message: "请求失败",
        type: "error",
      });
    }
  }
  async CloudDisksFiles() {
    this.self.LinkData = false;
    this.self.reqData = false;
    const obj = { storageKey: "C", path: "/file/video/64G燕双鹰1-9部", password: "", orderBy: "name", orderDirection: "asc" };
    const resp = await this.getFetchData(obj);
    const FilesData = resp.data.files;
    this.self.CloudFiles = FilesData.map((item) => ({ label: item.name, value: item.name }));
    this.self.CloudData = true;
  }
  async CloudDisks(selectName) {
    this.closeDialog();
    const obj = { storageKey: "C", path: `/file/video/64G燕双鹰1-9部/${selectName}`, password: "", orderBy: "name", orderDirection: "asc" };
    const resp = await this.getFetchData(obj);
    const FilesData = resp.data.files;
    if (FilesData.length < 1) {
      this.self.$message({
        message: "该目录下没有文件",
        type: "error",
      });
      this.self.dialogVisibleInput = true;
      this.self.CloudData = true;
      return;
    }
    this.children = FilesData.map((item) => ({ name: item.name, url: item.url, form: "CloudDisks" }));
    this.self.$message({
      message: "请求成功",
      type: "success",
    });

    this.children.length > 1 && this.setVideo(this.children[0]);
  }
  traverseHandle(handle) {
    const handleData = handle.map((item) => {
      const title = item.name.replace(".mp4", "");
      return { url: `${this.marurl}${item.file}`, name: title };
    });
    this.ArrayPartition(handleData);
  }
  ArrayPartition(row) {
    const Array = row.filter((item) => item.url.includes(".mp4"));
    this.children = [...Array];
  }

  closeDialog() {
    this.self.dialogVisibleInput = false;
    this.self.reqData = false;
    this.self.CloudData = false;
    this.self.valueFile = "";
    this.self.value = "";
  }
  setVideo(row) {
    const { url, name, form } = row;
    this.self.src = url;
    document.title = name;
    const newSearch = `?name=${encodeURIComponent(name)}`;
    const newUrl = window.location.pathname + newSearch + window.location.hash;
    history.pushState({}, "", newUrl);
    this.self.$refs.video.dataset.form = form;
    this.self.initPlayer();
    this.mine.self = this.self;
    this.mine.Data = this.children;
    this.mine.Infinity();
  }
}

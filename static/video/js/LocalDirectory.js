export class GetLocalDirectory {
  constructor(_self) {
    this.self = _self;
    this.mine = null;
    this.directory = null;
    this.input = null;
    // this.self.enable = true;
    this.entries = [];
    this.children = [];
    this.array = [];
    this.obj = {};
    this.files = [];
    // 视频类型后缀
    this.videoType = ["mp4", "avi", "mov", "mkv", "flv", "rmvb"];
  }
  openDirectory() {
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.webkitdirectory = true;
    this.input.directory = true;
    this.input.multiple = true;
    this.input.onchange = (e) => {
      this.files = e.target.files;
      if (this.self.enable) {
        this.getObjectDirectory();
      } else {
        this.getDirectory();
      }
      this.self.dialogVisible = false;
    };
    this.input.click();
  }
  getObjectDirectory() {
    const fileList = [...this.files];
    fileList.forEach((file) => {
      if (file.type.startsWith("video")) {
        this.array.push({
          name: file.name,
          url: URL.createObjectURL(file),
        });
      } else {
        // console.log(file);
      }
    });
    if (this.array.length > 0) {
      this.setObjectVideo(this.array[0]);
    }
  }

  setObjectVideo(row) {
    console.log(row);
    this.mine.self = this.self;
    this.mine.Data = this.array;
    const total = this.mine.Data.length;
    this.mine.Infinity();
    this.self.total = total;
  }

  getDirectory() {
    for (const file of this.files) {
      if (file.type.startsWith("video")) {
        this.children.push({
          name: file.name,
          url: URL.createObjectURL(file),
        });
      } else {
        console.log(file);
      }
    }
    this.setVideo(this.children[0]);
  }
  setVideo(row) {
    const { url, name, file } = row;
    this.self.src = url;
    document.title = name;
    const newSearch = `?name=${encodeURIComponent(name)}`;
    const newUrl = window.location.pathname + newSearch + window.location.hash;
    history.pushState({}, "", newUrl);
    this.self.initPlayer();
    this.mine.self = this.self;
    this.mine.Data = this.children;
    const total = this.mine.Data.length;
    this.mine.Infinity();
    this.self.total = total;
    if (total === 0) return this.self.$message.error("没有找到视频文件!");
    this.self.$message.success(`你已成功加载${total}条视频!`);
  }
}

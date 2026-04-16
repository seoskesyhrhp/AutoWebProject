export class GetLocalFile {
  constructor(_self) {
    this.self = _self;
    this.file = null;
    this.mine = null;
  }
  getFile() {
    this.createFile();
    this.self.dialogVisible = false;
  }
  createFile() {
    this.file = document.createElement("input");
    this.file.type = "file";
    this.file.addEventListener("change", this.onFileChange.bind(this));
    this.file.click();
  }
  onFileChange(e) {
    const [file] = e.target.files;
    const name = file.name;
    const url = URL.createObjectURL(file);
    this.setVideo({ url, name, file });
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
    this.mine.Data = { url, name };
    this.mine.Infinity();
  }
}

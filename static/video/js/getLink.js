export class GetLink {
  constructor(_self) {
    this.self = _self;
    this.mine = null;
    this.url = "http://cleanm.cn:8001/static/audioPlayer/mp4/video0.mp4";
  }
  getLink() {
    if (this.self.dialogVisibleValue.length < 1 || !this.isVideoLink(this.self.dialogVisibleValue)) {
      this.self.dialogVisibleValue = "";
      this.self.$message.error("请输入正确的视频链接");
      return;
    }
    this.self.src = this.self.dialogVisibleValue;
    document.title = this.getVideoFileNameFromUrl(this.self.dialogVisibleValue);
    const newSearch = `?name=${encodeURIComponent(this.getVideoFileNameFromUrl(this.self.dialogVisibleValue))}`;
    const newUrl = window.location.pathname + newSearch + window.location.hash;
    history.pushState({}, "", newUrl);
    this.self.initPlayer();
    this.self.dialogVisibleInput = false;
    this.self.LinkData = false;
    this.mine.self = this.self;
    this.mine.Data = { url: this.self.dialogVisibleValue, name: this.getVideoFileNameFromUrl(this.self.dialogVisibleValue) };
    this.mine.Infinity();
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

  isVideoLink(url) {
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|flv|wmv|mpeg|3gp)$/i;
    return videoExtensions.test(url);
  }
}

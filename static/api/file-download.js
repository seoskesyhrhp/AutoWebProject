export function downloadFile(form) {
  const { link, filename, force, autoOpen } = form;

  const downloadForLTApp = () => {
    if (this.localDownload) {
      downloadForOtherBrowsers();
      return;
    }
    console.log({ link, filename, force, autoOpen });
    jsBridge.fs.download(
      {
        url: link,
        path: `fs://file/Download/${filename}`,
        force: force,
        autoOpen: autoOpen,
        // 下载进度回调
        progress: (total, loaded) => {
          console.log(`共${total}字节，已下载${loaded}`);
        },
      },
      // 下载结束回调
      (succ, msg) => {
        if (succ) {
          this.$message.success("下载成功");
          this.isOK = false;
        }
        this.localDownload = true;
        alert(succ ? "下载成功" : `下载失败:${msg.includes("status line") ? "不支持http协议下载" : msg}`);
        console.log(succ ? "下载成功" : `下载失败:${msg.includes("status line") ? "不支持http协议下载" : msg}`);
      }
    );
  };

  const downloadForOtherBrowsers = () => {
    if (this.isApp) {
      downloadAxiosFileAsync();
      // downloadFileAsync();
      return;
    }
    this.localDownload = false;
    console.log({ link, filename, force, autoOpen });
    const linkDom = document.createElement("a");
    linkDom.style.display = "none";
    linkDom.href = link;
    linkDom.download = filename;
    document.body.appendChild(linkDom);
    linkDom.click();
    document.body.removeChild(linkDom);
    this.$message.success("下载成功");
    this.isOK = false;
  };

  const downloadAxiosFileAsync = async () => {
    this.$message.info("正在尝试使用浏览器下载，如果长时间无响应请切换到APP内");
    try {
      const { data } = await axios.get(link, { responseType: "blob" });
      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const linkDom = document.createElement("a");
      linkDom.href = url;
      linkDom.download = filename;
      document.body.appendChild(linkDom);
      linkDom.click();
      document.body.removeChild(linkDom);
      URL.revokeObjectURL(url);
      this.$message.success("下载成功");
      this.localDownload = true;
      this.isOK = false;
    } catch (error) {
      this.$message.error("下载失败");
      console.error("下载文件时出错:", error);
    }
  };

  const downloadFileAsync = async () => {
    this.$message.info("正在尝试使用浏览器下载，如果长时间无响应请切换到APP内");
    try {
      const response = await fetch(link);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      this.$message.success("下载成功");
      this.localDownload = true;
    } catch (error) {
      this.$message.error("下载失败");
      console.error("下载文件时出错:", error);
    }
  };

  if (/LT-APP/.test(navigator.userAgent)) {
    downloadForLTApp();
  } else {
    downloadForOtherBrowsers();
  }
}

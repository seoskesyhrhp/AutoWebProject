// 完整的文件扩展名数组（按类别组织）
const fileExtensions = {
  // 文本和文档文件
  textDocument: [".txt", ".doc", ".docx", ".docm", ".dot", ".dotx", ".dotm", ".pdf", ".xps", ".oxps", ".rtf", ".odt", ".fodt", ".ott", ".odm", ".pages", ".wps", ".wpt", ".md", ".markdown", ".rst", ".tex", ".latex", ".bib", ".log"],

  // 电子表格文件
  spreadsheet: [".xls", ".xlsx", ".xlsm", ".xlsb", ".xlt", ".xltx", ".xltm", ".xlam", ".ods", ".fods", ".ots", ".numbers", ".et", ".ett", ".csv", ".tsv", ".tab", ".dif", ".slk"],

  // 演示文稿文件
  presentation: [".ppt", ".pptx", ".pptm", ".pot", ".potx", ".potm", ".pps", ".ppsx", ".ppsm", ".odp", ".fodp", ".otp", ".key", ".keynote", ".dps", ".dpt"],

  // 图像文件
  image: [
    ".jpg",
    ".jpeg",
    ".jpe",
    ".jif",
    ".jfif",
    ".jfi",
    ".png",
    ".apng",
    ".gif",
    ".bmp",
    ".dib",
    ".rle",
    ".tiff",
    ".tif",
    ".webp",
    ".heic",
    ".heif",
    ".avif",
    ".ico",
    ".cur",
    ".psd",
    ".xcf",
    ".kra",
    ".clip",
    ".csp",
    ".sai",
    ".svg",
    ".svgz",
    ".ai",
    ".eps",
    ".ps",
    ".cdr",
    ".sketch",
    ".fig",
    ".xd",
    ".afdesign",
    ".afphoto",
    ".afpub",
    ".dwg",
    ".dxf",
    ".emf",
    ".wmf",
    ".indd",
    ".idml",
  ],

  // 音频文件
  audio: [
    ".wav",
    ".wave",
    ".aiff",
    ".aif",
    ".aifc",
    ".flac",
    ".alac",
    ".ape",
    ".dsd",
    ".dff",
    ".dsf",
    ".mp3",
    ".aac",
    ".m4a",
    ".mp4a",
    ".ogg",
    ".oga",
    ".opus",
    ".wma",
    ".ac3",
    ".dts",
    ".amr",
    ".au",
    ".snd",
    ".mid",
    ".midi",
    ".kar",
    ".xm",
    ".mod",
    ".s3m",
    ".it",
    ".gp3",
    ".gp4",
    ".gp5",
    ".gpx",
    ".gp",
  ],

  // 视频文件
  video: [".mp4", ".m4v", ".mov", ".avi", ".mkv", ".wmv", ".asf", ".flv", ".f4v", ".webm", ".ogv", ".ogg", ".mpeg", ".mpg", ".mpe", ".m1v", ".m2v", ".ts", ".mts", ".m2ts", ".vob", ".rm", ".rmvb", ".3gp", ".3g2", ".qt", ".mxf", ".dv"],

  // 压缩和归档文件
  archive: [".zip", ".zipx", ".rar", ".7z", ".tar", ".gz", ".gzip", ".bz2", ".bzip2", ".xz", ".lz", ".lzma", ".z", ".Z", ".arj", ".cab", ".deb", ".rpm", ".pkg", ".dmg", ".iso", ".img", ".bin", ".nrg", ".jar", ".war", ".ear", ".msi", ".msp", ".msu"],

  // 可执行文件和脚本
  executable: [
    ".exe",
    ".com",
    ".scr",
    ".msi",
    ".bat",
    ".cmd",
    ".app",
    ".dmg",
    ".pkg",
    ".command",
    ".deb",
    ".rpm",
    ".run",
    ".sh",
    ".bin",
    ".apk",
    ".ipa",
    ".jar",
    ".war",
    ".ear",
    ".py",
    ".pyc",
    ".pyo",
    ".pyw",
    ".js",
    ".mjs",
    ".cjs",
    ".php",
    ".phar",
    ".pl",
    ".pm",
    ".rb",
    ".rbw",
    ".lua",
    ".ps1",
    ".psm1",
    ".psd1",
    ".vbs",
    ".vbe",
    ".swf",
    ".swc",
  ],

  // 源代码和开发文件
  sourceCode: [
    ".c",
    ".h",
    ".cpp",
    ".cc",
    ".cxx",
    ".c++",
    ".hpp",
    ".hh",
    ".hxx",
    ".h++",
    ".cs",
    ".java",
    ".kt",
    ".kts",
    ".scala",
    ".go",
    ".rs",
    ".swift",
    ".m",
    ".mm",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".coffee",
    ".litcoffee",
    ".vue",
    ".svelte",
    ".elm",
    ".clj",
    ".cljs",
    ".cljc",
    ".edn",
    ".r",
    ".R",
    ".pl",
    ".pm",
    ".t",
    ".py",
    ".pyx",
    ".pxd",
    ".pyi",
    ".rb",
    ".erb",
    ".php",
    ".phtml",
    ".php3",
    ".php4",
    ".php5",
    ".phps",
    ".asp",
    ".aspx",
    ".jsp",
    ".jspx",
    ".html",
    ".htm",
    ".xhtml",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".styl",
    ".xml",
    ".xsl",
    ".xslt",
    ".xsd",
    ".rss",
    ".atom",
    ".json",
    ".json5",
    ".jsonl",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".sql",
    ".sh",
    ".bash",
    ".zsh",
    ".fish",
    ".bat",
    ".cmd",
    ".ps1",
    ".psm1",
    ".psd1",
    ".dockerfile",
    ".makefile",
    ".mk",
    ".cmake",
    ".gradle",
    ".props",
    ".targets",
    ".sln",
    ".csproj",
    ".vbproj",
    ".vcxproj",
    ".pbxproj",
    ".plist",
  ],

  // 字体文件
  font: [".ttf", ".ttc", ".otf", ".woff", ".woff2", ".eot", ".pfa", ".pfb", ".pfm", ".afm", ".fnt", ".fon", ".bdf", ".pcf"],

  // 数据库文件
  database: [".db", ".db3", ".sqlite", ".sqlite3", ".s3db", ".mdb", ".accdb", ".accde", ".accdr", ".accdt", ".frm", ".myd", ".myi", ".dbf", ".mdf", ".ldf", ".odb", ".nsf", ".pdb", ".dbs", ".dbx"],

  // 配置和系统文件
  configSystem: [".ini", ".cfg", ".conf", ".config", ".inf", ".reg", ".sys", ".dll", ".ocx", ".drv", ".cpl", ".so", ".dylib", ".bundle", ".kext", ".vxd", ".386", ".plist", ".desktop", ".lnk", ".url", ".theme", ".msstyles", ".ics", ".torrent"],

  // 虚拟化和磁盘映像
  virtualization: [".iso", ".img", ".bin", ".nrg", ".mdf", ".ccd", ".sub", ".dmg", ".sparseimage", ".toast", ".vhd", ".vhdx", ".avhd", ".avhdx", ".vmdk", ".vmem", ".vmsd", ".vmsn", ".vmss", ".vmtm", ".vmx", ".vmxf", ".ova", ".ovf", ".qcow", ".qcow2", ".qed", ".hdd", ".hds"],

  // 其他专业格式
  professional: [
    ".dwg",
    ".dxf",
    ".dwt",
    ".dws",
    ".stl",
    ".obj",
    ".fbx",
    ".dae",
    ".3ds",
    ".blend",
    ".max",
    ".ma",
    ".mb",
    ".iges",
    ".igs",
    ".step",
    ".stp",
    ".shp",
    ".shx",
    ".dbf",
    ".prj",
    ".sbn",
    ".sbx",
    ".shp.xml",
    ".kml",
    ".kmz",
    ".gpx",
    ".tiff",
    ".tif",
    ".geotiff",
    ".geotif",
    ".mbtiles",
    ".fits",
    ".fit",
    ".hdf",
    ".h4",
    ".hdf4",
    ".h5",
    ".hdf5",
    ".he5",
    ".nc",
    ".cdf",
    ".mat",
    ".sav",
    ".zsav",
    ".root",
    ".epub",
    ".mobi",
    ".azw",
    ".azw3",
    ".kfx",
    ".fb2",
    ".lit",
    ".pdb",
    ".chm",
    ".cbr",
    ".cbz",
    ".cbt",
    ".cba",
  ],
};

// 合并所有扩展名到一个数组
const allFileExtensions = Object.values(fileExtensions).flat();

// 去重版本
const uniqueFileExtensions = [...new Set(allFileExtensions)];

// 工具函数
const fileExtensionUtils = {
  // 数组合并
  arrayMerge(...arrays) {
    return fileExtensions.flat();
  },
  // 获取文件分类
  getFileCategory(filename) {
    const ext = "." + filename.toLowerCase().split(".").pop();

    for (const [category, extensions] of Object.entries(fileExtensions)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }
    return "unknown";
  },

  // 检查是否是特定类型文件
  isImageFile(filename) {
    return fileExtensions.image.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  isAudioFile(filename) {
    return fileExtensions.audio.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  isVideoFile(filename) {
    return fileExtensions.video.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  isArchiveFile(filename) {
    return fileExtensions.archive.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  isExecutableFile(filename) {
    return fileExtensions.executable.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  isSourceCodeFile(filename) {
    return fileExtensions.sourceCode.some((ext) => filename.toLowerCase().endsWith(ext));
  },

  // 获取所有分类
  getAllCategories() {
    return Object.keys(fileExtensions);
  },

  // 按分类获取扩展名
  getExtensionsByCategory(category) {
    return fileExtensions[category] || [];
  },

  // 统计信息
  getStats() {
    const stats = {};
    let total = 0;

    for (const [category, extensions] of Object.entries(fileExtensions)) {
      stats[category] = extensions.length;
      total += extensions.length;
    }

    stats.total = total;
    stats.unique = uniqueFileExtensions.length;

    return stats;
  },
};

// 导出内容
export { fileExtensions, allFileExtensions, uniqueFileExtensions, fileExtensionUtils };

// 默认导出
export default fileExtensions;

// 使用示例
/*
import fileExtensions, { fileExtensionUtils } from './file-extensions.js';

console.log('总扩展名数量:', fileExtensionUtils.getStats().total);
console.log('图片文件:', fileExtensionUtils.isImageFile('photo.jpg'));
console.log('文件分类:', fileExtensionUtils.getFileCategory('document.pdf'));
*/

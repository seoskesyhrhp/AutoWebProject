class Colors {
  constructor() {
    this.css_colors = [
      { name: "red", translate: "红色", hex: "#ff0000", rgb: "rgb(255,0,0)" },
      { name: "green", translate: "绿色", hex: "#00ff00", rgb: "rgb(0,255,0)" },
      { name: "blue", translate: "蓝色", hex: "#0000ff", rgb: "rgb(0,0,255)" },
      { name: "yellow", translate: "黄色", hex: "#ffff00", rgb: "rgb(255,255,0)" },
      { name: "cyan", translate: "青色", hex: "#00ffff", rgb: "rgb(0,255,255)" },
      { name: "magenta", translate: "品红", hex: "#ff00ff", rgb: "rgb(255,0,255)" },
      { name: "black", translate: "黑色", hex: "#000000", rgb: "rgb(0,0,0)" },
      { name: "white", translate: "白色", hex: "#ffffff", rgb: "rgb(255,255,255)" },
      { name: "gray", translate: "灰色", hex: "#808080", rgb: "rgb(128,128,128)" },
      { name: "orange", translate: "橙色", hex: "#ffa500", rgb: "rgb(255,165,0)" },
      { name: "purple", translate: "紫色", hex: "#800080", rgb: "rgb(128,0,128)" },
      { name: "brown", translate: "棕色", hex: "#a52a2a", rgb: "rgb(165,42,42)" },
      { name: "lightpink", translate: "浅粉色", hex: "#ffb6c1", rgb: "rgb(255,182,193)" },
      { name: "pink", translate: "粉色", hex: "#ffc0cb", rgb: "rgb(255,192,203)" },
      { name: "lightblue", translate: "浅蓝色", hex: "#add8e6", rgb: "rgb(173,216,230)" },
      { name: "lightgreen", translate: "浅绿色", hex: "#90ee90", rgb: "rgb(144,238,144)" },
      { name: "lightyellow", translate: "浅黄色", hex: "#ffffe0", rgb: "rgb(255,255,224)" },
      { name: "lightgray", translate: "浅灰色", hex: "#d3d3d3", rgb: "rgb(211,211,211)" },
      { name: "darkblue", translate: "深蓝色", hex: "#00008b", rgb: "rgb(0,0,139)" },
      { name: "darkgreen", translate: "深绿色", hex: "#006400", rgb: "rgb(0,100,0)" },
      { name: "darkgray", translate: "深灰色", hex: "#a9a9a9", rgb: "rgb(169,169,169)" },
      { name: "crimson", translate: "深红色", hex: "#dc143c", rgb: "rgb(220,20,60)" },
      { name: "lavenderblush", translate: "浅粉红", hex: "#fff0f5", rgb: "rgb(255,240,245)" },
      { name: "palevioletred", translate: "苍紫罗兰色", hex: "#db7093", rgb: "rgb(219,112,147)" },
      { name: "hotpink", translate: "热情粉红", hex: "#ff69b4", rgb: "rgb(255,105,180)" },
      { name: "deeppink", translate: "深粉红", hex: "#ff1493", rgb: "rgb(255,20,147)" },
      { name: "mediumvioletred", translate: "中紫罗兰色", hex: "#c71585", rgb: "rgb(199,21,133)" },
      { name: "orchid", translate: "兰花色", hex: "#da70d6", rgb: "rgb(218,112,214)" },
      { name: "thistle", translate: "蓟色", hex: "#d8bfd8", rgb: "rgb(216,191,216)" },
      { name: "plum", translate: "紫梅色", hex: "#dda0dd", rgb: "rgb(221,160,221)" },
      { name: "violet", translate: "紫罗兰", hex: "#ee82ee", rgb: "rgb(238,130,238)" },
      { name: "magenta", translate: "洋红", hex: "#ff00ff", rgb: "rgb(255,0,255)" },
      { name: "fuchsia", translate: "紫红色", hex: "#ff00ff", rgb: "rgb(255,0,255)" },
      { name: "darkmagenta", translate: "深洋红色", hex: "#0b008b", rgb: "rgb(139,0,139)" },
      { name: "purple", translate: "紫色", hex: "#800080", rgb: "rgb(128,0,128)" },
      { name: "mediumorchid", translate: "适中的兰花紫", hex: "#ba55d3", rgb: "rgb(186,85,211)" },
      { name: "mediumblue", translate: "适中的蓝色", hex: "#0000cd", rgb: "rgb(0,0,205)" },
      { name: "mignightblue", translate: "午夜蓝", hex: "#191970", rgb: "rgb(25,25,112)" },
      { name: "darkslateblue", translate: "深岩蓝色", hex: "#483d8b", rgb: "rgb(72,61,139)" },
    ];
    this.css_colors_map = {};
    this.css_colors_array = [];
  }

  isEmpty(obj) {
    return this.isObject(obj) && typeof obj === "object" && Object.keys(obj).length > 0;
  }

  isObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  isObjectEmpty(obj) {
    if (obj === null || obj === undefined) return false;
    if (typeof obj !== "object") return false;
    const objType = Object.prototype.toString.call(obj);
    if (objType !== "[object Object]") return false;
    return Object.keys(obj).length > 0;
  }

  getCssColors(name) {
    const ArrayData = this.css_colors;
    return ArrayData.filter((item) => item.name.includes(name) || item.translate.includes(name));
  }

  get(name) {
    return this.getCssColors(name);
    // return this.css_colors_map[name];
  }
  set(name, value) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("name must be a non-empty string");
    }
    if (!this.isObjectEmpty(value)) {
      throw new Error("value must be an object");
    }
    const values = this.get(name);
    if (values.length < 1) {
      this.css_colors_map[name] = value;
      const key = this.css_colors_map[name];
      this.css_colors.push(key);
      return this.get(name);
    }
    return values;
  }
}
// const css_colors = new CssColors();

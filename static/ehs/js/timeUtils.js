export class TimeUtils {
  /**
   * 获取指定分钟数后的时间，并添加随机秒数
   * @param {number} minutes - 要增加的分钟数
   * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 日期格式
   * @returns {string} 格式化后的日期字符串
   */
  static getTimeAfter(minutes, format = "YYYY-MM-DD HH:mm:ss") {
    if (typeof minutes !== "number" || isNaN(minutes)) {
      throw new TypeError("minutes must be a valid number");
    }
    const targetTime = Date.now() + minutes * 60000;
    const randomSeconds = Math.floor(Math.random() * 60);
    const finalTime = targetTime + randomSeconds * 1000;
    return this.formatDate(new Date(finalTime), format);
  }

  static getTimeAfter_one(minutes, format = "YYYY-MM-DD HH:mm:ss") {
    const date = new Date(Date.now() + minutes * 60000);
    const fullDate = new Date(date + Math.floor(Math.random() * 59) * 1000); // 添加随机秒数
    return this.formatDate(fullDate, format);
  }

  static formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
    const pad = (num) => String(num).padStart(2, "0");

    const replacements = {
      YYYY: date.getFullYear(),
      YY: String(date.getFullYear()).slice(-2),
      MM: pad(date.getMonth() + 1),
      DD: pad(date.getDate()),
      HH: pad(date.getHours()),
      hh: pad(date.getHours() % 12 || 12),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
      SSS: String(date.getMilliseconds()).padStart(3, "0"),
      A: date.getHours() < 12 ? "AM" : "PM",
      a: date.getHours() < 12 ? "am" : "pm",
    };

    return format.replace(/(YYYY|YY|MM|DD|HH|hh|mm|ss|SSS|A|a)/g, (match) => replacements[match]);
  }

  static get30MinutesLater() {
    return this.getTimeAfter(30);
  }

  // 新增：获取当前时间
  static getNow(format = "YYYY-MM-DD HH:mm:ss") {
    return this.formatDate(new Date(), format);
  }

  // 新增：获取指定时间前后的时间
  static getTimeFromDate(date, minutes, format = "YYYY-MM-DD HH:mm:ss") {
    const newDate = new Date(date.getTime() + minutes * 60000);
    return this.formatDate(newDate, format);
  }
}

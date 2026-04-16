const OneSecond = 1000;
const TenSeconds = 10000;
const OneMinute = 60000;
const OneHour = 3600000;
const OneDay = 86400000;
const DefaultAttributes = "default";

class MyDate {
  constructor(data) {
    this.date = (date) => {};
  }
  getDate(data) {
    return new Date(data).getDate();
  }
  getTime(data) {
    return new Date(data).getTime();
  }
  getMonth(data) {
    return new Date(data).getMonth() + 1;
  }
  getFullYear(data) {
    return new Date(data).getFullYear();
  }
  getHours(data) {
    return new Date(data).getHours();
  }
  getMinutes(data) {
    return new Date(data).getMinutes();
  }
  currentTimeFormat(sTime) {
    const date = sTime ? new Date(sTime) : new Date();
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  getDateDifferenceInDays(date1, date2) {
    const start = new Date(date1);
    const end = new Date(date2);
    const timeDifference = end - start;
    const differenceInDays = timeDifference / (1000 * 60 * 60 * 24);
    return Math.abs(differenceInDays);
  }
  getDateDifferenceInHours(date1, date2) {
    const start = new Date(date1);
    const end = new Date(date2);
    const timeDifference = end - start;
    const differenceInHours = timeDifference / (1000 * 60 * 60);
    return Math.abs(differenceInHours);
  }
  getDateDifferenceInDates(date1, date2) {
    const start = new Date(this.currentTimeFormat(new Date(date1))); // 将日期格式化为字符串
    const end = new Date(this.currentTimeFormat(new Date(date2))); // 将日期格式化为字符串
    const timeDifference = end - start;
    const differenceInDays = timeDifference / (1000 * 60 * 60 * 24);
    return Math.abs(differenceInDays);
  }
  FunctionAnnotations() {
    const getCharacter = this.StarCharacter(15);
    console.groupCollapsed("%c✅ 函数注解%c v1.0", "background:linear-gradient(45deg, #ff6b6b, #4ecdc4);color:white;padding:4px 8px;border-radius:5px;", "color:#666;margin-left:8px;"); // "color:#48bb78"
    console.log(`%c${getCharacter}欢迎使用日期计算差函数，以下是它的函数注解${getCharacter}`, "color: #48bb78; font-weight: bold;");
    console.log("%c此函数可以计算两个日期之间的天数差、小时差或日期差。\n此函数接收3个函数,前两个参数为日期(格式为 'YYYY-MM-DD')\n第三个参数为选择计算类型(默认为1),1为天数差,2为小时差,3为日期差。", "color: #48bb78; font-weight: bold;");
    console.log(`%c例如：getDateDiff("2023-10-01T00:00:00", "2023-10-10T00:00:00"))`, "color: #ed8936; font-weight: bold;");
    console.groupEnd();
  }

  StarCharacter(number = 10) {
    return "*".repeat(number) || Array(number).fill("*").join("") || Array(number + 1).join("*");
  }
  getDateDiff(date1, date2, Option = 1) {
    if (typeof date1 !== "string" || typeof date2 !== "string" || (typeof Option !== "number" && typeof Option !== 1 && typeof Option !== 2 && typeof Option !== 3)) {
      return this.FunctionAnnotations();
    }
    if (Option === 1) {
      return this.getDateDifferenceInDays(date1, date2);
    } else if (Option === 2) {
      return this.getDateDifferenceInHours(date1, date2);
    } else if (Option === 3) {
      return this.getDateDifferenceInDates(date1, date2);
    }
  }

  isToday(date) {
    const today = new Date();
    const afferentDate = new Date(date);
    return today.getFullYear() === afferentDate.getFullYear() && today.getMonth() === afferentDate.getMonth() && today.getDate() === afferentDate.getDate();
  }
  formatPast(date, type = "default", zeroFillFlag = true) {
    const now = Date.now();
    date = new Date(date);
    const afferentTime = new Date(date).getTime();
    const timeDiff = now - afferentTime;
    if (timeDiff < TenSeconds) {
      return "刚刚";
    }
    if (timeDiff < OneMinute) {
      return `${Math.floor(timeDiff / OneSecond)}秒前`;
    }
    if (timeDiff < OneHour) {
      return `${Math.floor(timeDiff / OneMinute)}分钟前`;
    }
    if (timeDiff < OneDay) {
      return `${Math.floor(timeDiff / OneHour)}小时前`;
    }
    const daysDiff = Math.floor(timeDiff / OneDay);
    if (type === DefaultAttributes) {
      if (daysDiff > 365) {
        return `${Math.floor(daysDiff / 365)}年前`;
      }
      if (daysDiff >= 30) {
        return `${Math.floor(daysDiff / 30)}个月前`;
      }
      return `${daysDiff}天前`;
    }
    return this.formatDate(date, type, zeroFillFlag);
  }

  formatDate(date, formatType, zeroFillFlag) {
    const Y = date.getFullYear();
    const M = zeroFillFlag && date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    const D = zeroFillFlag && date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();

    const formatMap = {
      "-": `${Y}-${M}-${D}`,
      "/": `${Y}/${M}/${D}`,
      ".": `${Y}.${M}.${D}`,
      年月日: `${Y}${formatType[0]}${M}${formatType[1]}${D}${formatType[2]}`,
      月日: `${M}${formatType[0]}${D}${formatType[1]}`,
      年: `${Y}${formatType}`,
    };

    return formatMap[formatType] || date.toLocaleDateString(); // 默认返回本地日期格式
  }
}

function test() {
  const date = new MyDate();
  console.log(date.formatPast(new Date()));

  // console.log(date.getDateDiff("2023-10-01T00:00:00", "2023-10-10T00:00:00"));
  // console.log(date.getDateDiff("2023-10-01T00:00:00", "2023-10-10T00:00:00", 2));
  console.log(date.getDateDiff("2023-10-01 12:23:09", "2023-10-10 11:22:01", 3));
  console.log(date.getDateDiff());
}
window.onload = test;
// // 示例用法
// const date1 = new Date('2023-10-01T00:00:00');
// const date2 = new Date('2023-10-10T00:00:00');
// const daysDifference = getDateDifferenceInDays(date1, date2);
// console.log(daysDifference); // 输出: -9

// 2
// 示例用法
// const hoursDifference = getDateDifferenceInHours(date1, date2);
// console.log(hoursDifference); // 输出: -216（因为9天 * 24小时/天 = 216小时）

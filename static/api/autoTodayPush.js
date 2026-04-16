async function getTodayPushData() {
  const url = "http://211.154.26.227:8001/api/todayPushData";
  try {
    const response = await axios.post(url);
    if (response.data?.code !== 200) {
      console.error("Invalid response code:", response.data?.code);
      return;
    }
    const item = response.data.data;
    if (!item || typeof item !== "object") {
      console.error("Invalid data format:", item);
      return;
    }
    let content;
    if (item.len === undefined || item.len === null) {
      console.error('Missing required field "len"');
      return;
    }
    if (Object.keys(item).length === 1) {
      content = `当天你无需维保`;
    } else if (Object.keys(item).length > 2) {
      const counts = Object.entries(item)
        .filter(([key]) => key !== "len")
        .map(([type, count]) => `${type}${count}台`)
        .join(",");

      content = `当天你有${item.len}台需维保,其中${counts}`;
    } else {
      const defaultType = "半月保";
      const defaultCount = item[defaultType] || 0;
      content = `当天你有${item.len}台需维保,其中${defaultType}${defaultCount}台`;
    }
    setNotifyShow({
      alarmTitle: "当天维保计划推送",
      alarmContent: content,
    });

    console.log("Notification content:", content);
  } catch (error) {
    console.error("Failed to fetch today push data:", error);
    setNotifyShow({
      alarmTitle: "维保计划获取失败",
      alarmContent: "无法获取当天维保数据，请稍后重试",
    });
  }
}

function setNotifyShow(row) {
  const { alarmTitle, alarmContent } = row;
  if (!alarmTitle || !alarmContent) return;
  jsBridge.notification.notify(
    {
      title: alarmTitle,
      content: alarmContent,
      url: "",
      openUrlInApp: true,
    },
    function (succ, data) {
      if (succ) {
        console.log("已发送");
      } else {
        console.log(JSON.stringify(data), "出错了");
      }
    }
  );
}

function executeInTimeRange(startTime, endTime, callback) {
  console.log("执行时间范围：", startTime, endTime);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  let hasExecuted = false; // 避免重复执行

  const timer = setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 判断是否在时间范围内
    const inRange = (hours > startHour || (hours === startHour && minutes >= startMinute)) && (hours < endHour || (hours === endHour && minutes < endMinute));

    if (inRange && !hasExecuted) {
      callback();
      hasExecuted = true; // 标记已执行
    } else if (!inRange) {
      hasExecuted = false; // 重置状态
    }
  }, 5000);

  return timer;
}

const timerId = executeInTimeRange("08:00", "17:00", () => {
  getTodayPushData();
});

// 清除定时器（需要时调用）
// setTimeout(() => {
// clearInterval(timerId);
// }, 10000);

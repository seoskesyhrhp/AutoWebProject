export function setItemWithExpiry(key, value, ttl) {
  const now = new Date();
  const expiry = new Date(now.getTime() + ttl * 1000);
  const item = {
    maxTime: ttl * 1000,
    value: value,
    expiry: expiry.toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getItemWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const obj = item;
  const now = new Date();
  if (now.getTime() > new Date(item.expiry).getTime()) {
    console.log(`${key} Item expired, removing`);
    localStorage.removeItem(key);
    return null;
  }
  // console.log(item);
  const timeRemaining = (new Date(item.expiry).getTime() - new Date()) / 1000;
  obj["SurplusTime"] = {
    minute: `${(timeRemaining / 60).toFixed(2)}分钟`,
    seconds: `${timeRemaining.toFixed(2)}秒`,
  };
  localStorage.setItem(key, JSON.stringify(obj));
  return item.value;
}

export function ResetFutureTime() {
  setTimeout(() => {
    if (!getItemWithExpiry("elevatorData") && getItemWithExpiry("p_weather")) {
      // if (getItemWithExpiry("p_weather")) {
      const obj = JSON.parse(localStorage.getItem("p_weather"));
      const future = obj.expiry;
      const now = new Date();
      const future_time = new Date(future);
      console.log({ title: "update time", result: future_time - now, this: this, ...obj });
      if (future_time > now && future_time - now > 60000) {
        obj.expiry = new Date(new Date().getTime() + 1000 * 60 * 10).toISOString();
        localStorage.setItem("p_weather", JSON.stringify(obj));
      }
    }
  }, 3000);
}

function getRemainingTime(targetTime) {
  const now = new Date().getTime();
  const target = new Date(targetTime).getTime();
  const remaining = target - now;
  if (isNaN(remaining) || remaining <= 0) return { expired: false };
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const format = (n) => n.toString().padStart(2, "0");
  return {
    expired: true,
    days: format(days),
    hours: format(hours),
    minutes: format(minutes),
    seconds: format(seconds),
    totalMs: remaining,
  };
}
export function allItemWithExpiry() {
  const result = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const storedValue = localStorage.getItem(key);
    const curentTime = new Date(Date.now() + 60000).toISOString();
    let value,
      expiry,
      expired = null,
      other = null;
    try {
      const parsedValue = JSON.parse(storedValue);
      if (typeof parsedValue === "object" && parsedValue !== null) {
        const result = getRemainingTime(parsedValue.expiry);
        value = typeof parsedValue.value === "string" ? parsedValue.value : JSON.stringify(parsedValue.value);
        other = JSON.stringify(parsedValue);
        console.log(key, parsedValue, result);
        expired = result.expired ? `${result.days}天 ${result.hours}时 ${result.minutes}分 ${result.seconds}秒` : null;
        expiry = "expiry" in parsedValue ? parsedValue.expiry : curentTime;
      } else {
        value = storedValue;
        expiry = curentTime;
        other = storedValue;
      }
    } catch (e) {
      value = storedValue;
      expiry = curentTime;
      other = storedValue;
    }
    result.push({ key, value, expiry, expired, other });
  }
  return result;
}

export function SetUpExpiredTemporaryItems(key, value, ttl) {
  const now = new Date();
  const expiry = new Date(now.getTime() + ttl * 1000);
  const item = {
    value: value,
    expiry: expiry.toISOString(),
  };
  sessionStorage.setItem(key, JSON.stringify(item));
}
export function GetUpExpiredTemporaryItems(key) {
  const itemStr = sessionStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  if (now.getTime() > new Date(item.expiry).getTime()) {
    console.log(`${key} Item expired, removing`);
    sessionStorage.removeItem(key);
    return null;
  }
  return item.value;
}

export function modifyTimeValidation() {
  const timeInTheFutureStr = this.elevatorTitle.split(": ")[1];
  const timeInTheFutureTime = new Date(timeInTheFutureStr);
  timeInTheFutureTime.setHours(timeInTheFutureTime.getHours() + 22);
  const timeInTheFuture = new Date(timeInTheFutureTime).getTime();
  const now = new Date().getTime();
  if (timeInTheFuture - now < 0) {
    this.RequestingToken.resetToken();
  }
}

// 防抖
export function debounce(func, delay, immediate = false) {
  console.log({ title: "debounce", func, delay, immediate });
  let timer;
  return function (...args) {
    const context = this;
    clearTimeout(timer);
    if (immediate && !timer) {
      func.apply(context, args);
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    } else {
      timer = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    }
  };
}

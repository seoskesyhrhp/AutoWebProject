import cos, { getusedPartyName, FuncDescriptionsLabel } from "./observerData.js";

export class RequestingToken {
  constructor(self) {
    this.self = self;
  }
  // 校验Token并重置
  //获取请求电梯数据的token
  async resetToken() {
    console.log("验证token");
    const userToken = localStorage.getItem("userToken");
    const [httpToken, elevatorTime] = await this.getuserToken();
    cos({ local: userToken, server: httpToken });
    this.TimeCheck(elevatorTime);
    if (userToken || httpToken) {
      const token = httpToken || userToken;
      this.self.headers.Token = token;
      httpToken && localStorage.setItem("userToken", httpToken);
      this.self.elevatorTitle = `上次修改时间: ${elevatorTime}`;
    }
  }

  // 节流函数
  throttle(func, delay) {
    let timer = null;
    return function () {
      const context = this;
      const args = arguments;
      if (!timer) {
        timer = setTimeout(() => {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }

  TimeCheck(str_time) {
    const checkTime = this.throttle(this.resetToken, 1000 * 60 * 1.5); // 1分钟内只执行一次|3分钟内只执行一次|1.5分钟内只执行一次
    if (this.self.TimeCheckStatus) return;
    const result = this.checkTime(str_time);
    if (result.hasPassed) {
      this.self.$message.error("已经经过了22小时30分钟");
      localStorage.removeItem("userToken");
      // this.resetToken();
      checkTime();
      this.self.TimeCheckStatus = true;
    } else {
      this.self.$message.info(`还没有经过22小时30分钟，还有${result.remainingTime}到`);
    }
  }

  checkTime(str_time) {
    const givenDate = new Date(str_time);
    const currentDate = new Date();
    const timeDiff = currentDate - givenDate;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const hasPassed = hours >= 22 && minutes >= 30;
    const remainingHours = hasPassed ? 0 : 22 - hours;
    const remainingMinutes = hasPassed ? 0 : (30 - minutes + 60) % 60;
    return {
      hasPassed: hasPassed,
      remainingTime: `${remainingHours}小时${remainingMinutes}分钟`,
    };
  }

  async getuserToken() {
    try {
      const response = await axios.post("/search/cache"); //(`${this.ipserver}${endpoint}/pake/cache`);
      const result = response.data.token;
      return [result.token, result.time];
    } catch (error) {
      console.error(`请求失败：${error.message},func->getuserToken`);
    }
  }
}

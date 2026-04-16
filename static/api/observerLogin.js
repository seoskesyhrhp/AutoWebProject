// import axios from "../upload/axios.min.js";

const cos = console.log;
function formatDate(date) {
  const rawDate = new Date(date);
  const year = rawDate.getFullYear();
  const month = String(rawDate.getMonth() + 1).padStart(2, "0");
  const day = String(rawDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getToken() {
  try {
    const response = await axios.post("/search/cache");
    const token = response.data?.token?.token;
    return NetworkStatus(token);
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

async function NetworkStatus(Token) {
  try {
    const baseUrl = "https://dtwzh.scjgj.suzhou.com.cn/wisdomElevator/maintenanceRecords/elevatorMaintenanceList";
    const row = {
      maintenancePartyId: "VqlvuZOb9qTVYpSYGQ3Dgg==",
      maintenanceCycle: "",
      usedPartyId: "",
      elevatorNum: "",
      maintenanceUser: "",
      elevatorCity: "",
      elevatorArea: "",
      elevatorTypeId: "",
      maintenanceIsSure: "",
      startDateStr: formatDate(new Date()),
      endDateStr: formatDate(new Date()),
      additionalRecording: "",
      projectName: "",
      discription: "",
      currentPage: 0,
      pageSize: 10,
    };
    const response = await axios.post(
      baseUrl,
      { ...row },
      {
        headers: {
          Token: Token,
        },
      }
    );
    if (response.data.message === "登录有效期已过，请重新登录") {
      return {
        NetworkType: "danger",
        NetworkText: "失败",
      };
    } else {
      return {
        NetworkType: "success",
        NetworkText: "已连接",
      };
    }
  } catch (error) {
    console.error("Failed to get token:", error);
    return {
      NetworkType: "danger",
      NetworkText: "失败",
    };
  }
}
export async function Login() {
  try {
    const result = await getToken();
    const { NetworkType, NetworkText } = result;
    this.NetworkType = NetworkType;
    this.NetworkText = NetworkText;
  } catch (error) {
    console.error("Failed to get token:", error);
  }
}

export function loginData() {
  if (cache === "") {
    this.$message.error("验证码不能为空");
    document.querySelector('input[name="cacheInput"]').value = "";
    return;
  }
  const URL = `/api/wisdomSys/login`;
  const username = "91320000MA1M94LX2P";
  const password = "fIAyyW2lpUTT4RE729ngHQ==";
  const verificationCode = cache;
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("timestamp", timestamp);
  formData.append("verificationCode", verificationCode);
  axios
    .post(URL, formData)
    .then((response) => {
      cos({ msg: "已添加到本地缓存", Token: response.data.data.data.token || "不存在" });
      this.$message.info(response.data.data.message);
      localStorage.setItem("userToken", response.data.data.data.token);
      this.writeToken(response.data.data.data.token);
    })
    .catch((error) => {
      this.$message.error(String(error));
      cos({ msg: "请求错误", err: error });
    });
}

export async function getIsLogin() {
  try {
    const resp = await axios.get("/user/islogin");
    if (resp.data.success) {
      this.LoginDisabled = true;
      // this.MaintenanceTimeReset();
    }
  } catch (err) {
    console.error(err);
  }
  setTimeout(getIsLogin.bind(this), 30000);
  // requestIdleCallback(getIsLogin.bind(this));
}

function getDeviceStatus() {
  if (/LT-APP/.test(navigator.userAgent)) {
    return { rowStaus: "mobile" };
  } else {
    return { rowStaus: "pc" };
  }
}

async function getText(row) {
  try {
    const result = getDeviceStatus();
    const obj = Object.assign({}, row, result);
    const resp = await axios.post("/pake/json/rows/get", obj);
    return resp.data;
  } catch (error) {
    console.error("Error fetching text:", error);
    throw error;
  }
}

async function uploadValue(row) {
  try {
    const result = getDeviceStatus();
    const obj = Object.assign({}, row, result);
    const resp = await axios.post("/pake/json/rows/update", obj);
    return resp.data;
  } catch (error) {
    console.error("Error fetching value:", error);
    throw error;
  }
}

export const rowsColumnStatus = {
  getText,
  uploadValue
};

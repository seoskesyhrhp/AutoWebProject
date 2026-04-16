import { Type } from "./typeData.js";
import { currentDateFormat } from "./rowcolData.js";

export class pushMessageServe {
  constructor() {
    this.url = "https://www.yimenapp.com/developer/ajax.aspx?id=378907&method=Push";
    this.params = {
      title: "版本推送",
      content: "请更新版本为1.5.3",
      url: "https://beta2.appdone.club/vY9f",
      adr: "true",
      adr_sound: "true",
      adr_vibrate: "true",
      adr_light: "true",
      ios: "false",
      ios_badge: "0",
      ios_env: "2",
      ios_badge_value: "",
      ios_sound: "0",
      ios_sound_value: "",
      target: "0",
      targets: "",
      speed: "0",
      time: "0",
      time_time: currentDateFormat(new Date()),
    };
  }

  setContent(title, content, url) {
    this.params.title = title;
    this.params.content = content;
    this.params.url = url;
  }

  async fetch() {
    const resp = await axios.post(this.url, this.params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie:
          ".x=308784763D31D1AF8F207818FBBDD478D7369D4711CB5856519ADFDDE80924FC26496AD40EE4BB001920AA6FA1E30B95B4243F8E5B235BA546799608FF5B668B18A3ECC326198EEE6A83FF7A5D1880BA5353CED982797042F9BFB949C440EACB4E867D7106502C868292B0CFCD8BD5FE; ASP.NET_SessionId=englpgyuxb0mzchsgzamsdym; Hm_lvt_3da5a313e099b629a89e99f0ef41896c=1743773605; HMACCOUNT=7A924D5E9D75262B; Hm_lvt_acb5b28fbdbef6aadca2373f2329a647=1743773605; Hm_lvt_dc48348eb7396f83f2be5885ea9e07f4=1743774126; Hm_lpvt_dc48348eb7396f83f2be5885ea9e07f4=1743774188; Hm_lpvt_3da5a313e099b629a89e99f0ef41896c=1743783686; Hm_lpvt_acb5b28fbdbef6aadca2373f2329a647=1743783686",
      },
    });
    const { data } = resp;
    console.log(data);
  }
  text() {
    const headers = new Headers();
    headers.append("User-Agent", "Mozilla/5.0 (Linux; Android 15; MAA-AN00 Build/HONORMAA-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36  XiaoMi/MiuiBrowser/10.8.1 LT-APP/47/153/YM-RT/");
    headers.append("Accept-Encoding", "gzip, deflate, br, zstd");
    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("sec-ch-ua-platform", '"Android"');
    headers.append("x-requested-with", "XMLHttpRequest");
    headers.append("sec-ch-ua", '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"');
    headers.append("content-type", "application/x-www-form-urlencoded; charset=UTF-8");
    headers.append("sec-ch-ua-mobile", "?1");
    headers.append("origin", "https://www.yimenapp.com");
    headers.append("sec-fetch-site", "same-origin");
    headers.append("sec-fetch-mode", "cors");
    headers.append("sec-fetch-dest", "empty");
    headers.append("referer", "https://www.yimenapp.com/developer/push.cshtml?id=378907");
    headers.append("accept-language", "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7");
    headers.append("priority", "u=1, i");
    headers.append(
      "Set-Cookie",
      ".x=215959D4623CF17DFEF4C426B0BC3139C7AB1713F0FCC4886AB87E6161BD4453BEBA8F5165E42BB3CC7FDED700827A81256CE0124039918A1950337DC2E3CB78B493922BABE7A9D1063765C6F9F837750E764869D4A410273A7AE610487931DF5B580669F28E7F3ADCF7F46968BDFEB1; ASP.NET_SessionId=xswlneoo2btpru5aaptpojpm; Hm_lvt_3da5a313e099b629a89e99f0ef41896c=1743784480; HMACCOUNT=3CCEABC2DDE61485; Hm_lvt_acb5b28fbdbef6aadca2373f2329a647=1743784480; Hm_lpvt_3da5a313e099b629a89e99f0ef41896c=1743784935; Hm_lpvt_acb5b28fbdbef6aadca2373f2329a647=1743784935"
    );

    const data = new URLSearchParams();
    data.append("title", "小平台");
    data.append("content", "请更新版本为1.5.3");
    data.append("url", "");
    data.append("adr", "true");
    data.append("adr_sound", "true");
    data.append("adr_vibrate", "false");
    data.append("adr_light", "false");
    data.append("ios", "false");
    data.append("ios_badge", "0");
    data.append("ios_env", "2");
    data.append("ios_badge_value", "");
    data.append("ios_sound", "0");
    data.append("ios_sound_value", "");
    data.append("target", "0");
    data.append("targets", "");
    data.append("speed", "0");
    data.append("time", "0");
    data.append("time_time", "2025-04-05 00:44:14");

    const config = {
      method: "POST",
      url: "https://www.yimenapp.com/developer/ajax.aspx?id=378907&method=Push",
      headers: headers,
      data: data,
    };

    axios
      .request(config)
      .then((response) => console.log(response))
      .catch((error) => console.log("error", error));
  }

  push(row) {
    if (Type.isObject(row)) {
      const { title, content, url } = row;
      this.setContent(title, content, url);
      this.fetch();
    }
  }
}

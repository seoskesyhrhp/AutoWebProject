package com.ehs.web.ehs;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 对应 Python TemplateDataBuilder（客梯/扶梯检查项）。
 */
public final class TemplatePayloadBuilder {

    private static final String PASSENGER_NAME = "客梯-岗位日常检查-1";
    private static final String ESCALATOR_NAME = "扶梯-岗位日常检查-1";

    private static final List<String[]> PASSENGER_ITEMS = List.of(
            new String[]{"机房、滑轮间清洁，门窗完好，照明正常。", "Y"},
            new String[]{"手动紧急操作装置齐全，在指定位置。", "Y"},
            new String[]{"曳引机运行时无异常振动和异常声响。", "Y"},
            new String[]{"轿厢照明、风扇、应急照明工作正常。", "Y"},
            new String[]{"轿内报警装置、对讲系统工作正常。", "Y"},
            new String[]{"轿内显示、指令按钮齐全、有效。", "Y"},
            new String[]{"轿门安全装置（安全触板，光幕、光电等）功能有效。", "Y"},
            new String[]{"厅轿门开启和关闭工作正常。", "Y"},
            new String[]{"轿厢平层精度符合标准。", "Y"},
            new String[]{"层站召唤、层楼显示齐全、有效。", "Y"},
            new String[]{"层门地坎清洁。", "Y"},
            new String[]{"底坑环境清洁，无渗水、积水，照明正常。", "Y"},
            new String[]{"消防开关面罩完好。", "Y"},
            new String[]{"安全注意事项、警示标志张贴醒目完好。", "Y"},
            new String[]{"《电梯使用标志》张贴醒目完好，且在有效期内。", "Y"}
    );

    private static final List<String[]> ESCALATOR_ITEMS = List.of(
            new String[]{"梯级或踏板表面完好、清洁。", "Y"},
            new String[]{"设备运行状况正常，没有异响和抖动。", "Y"},
            new String[]{"梳齿板完好无损，梳齿板梳齿与踏板面齿槽、导向胶带啮合正常。", "Y"},
            new String[]{"运行方向显示工作正常。", "Y"},
            new String[]{"扶手带表面无毛刺，无机械损伤，出入口处居中，运行无摩擦。", "Y"},
            new String[]{"扶手带运行速度正常。", "Y"},
            new String[]{"扶手护壁板牢固可靠。", "Y"},
            new String[]{"扶手防攀爬设置合理且完好。", "Y"},
            new String[]{"上下出入口处的照明工作正常。", "Y"},
            new String[]{"上下出入口和扶梯之间保护栏杆牢固可靠。", "Y"},
            new String[]{"防护挡板设置合理且完好。", "Y"},
            new String[]{"防夹装置牢固可靠。", "Y"},
            new String[]{"急停开关工作正常。", "Y"},
            new String[]{"出入口安全警示标志齐全，醒目。", "Y"},
            new String[]{"《电梯使用标志》张贴醒目完好，且在有效期内。", "Y"}
    );

    private TemplatePayloadBuilder() {
    }

    public static List<Map<String, Object>> buildElevatorCheckTemplate(
            String ctCode,
            String checkResult,
            String tCode,
            String tRand,
            String areaCode,
            String areaName
    ) {
        boolean escalator = areaName != null && areaName.contains("扶梯");
        String tName = escalator ? ESCALATOR_NAME : PASSENGER_NAME;
        List<String[]> items = escalator ? ESCALATOR_ITEMS : PASSENGER_ITEMS;

        List<Map<String, Object>> payload = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String itemName = items.get(i)[0];
            String defaultResult = items.get(i)[1];
            String itemResult;
            if (escalator && (i == 3 || i == 8)) {
                itemResult = checkResult;
            } else if (!escalator && i == 0) {
                itemResult = checkResult;
            } else {
                itemResult = defaultResult;
            }
            payload.add(buildItem(ctCode, tRand, tCode, tName, tCode + "_1_" + (i + 1), itemName, itemResult, areaCode, areaName));
        }
        return payload;
    }

    private static Map<String, Object> buildItem(
            String ctCode,
            String tRand,
            String tCode,
            String tName,
            String detailItemFullNo,
            String detailItemName,
            String itemCheckResult,
            String areaCode,
            String areaName
    ) {
        Map<String, Object> m = new HashMap<>();
        m.put("DetailTitle", "");
        m.put("CTCode", ctCode);
        m.put("Origintype", 3);
        m.put("CheckResult", itemCheckResult);
        m.put("Remarks", "");
        m.put("TRand", tRand);
        m.put("TCode", tCode);
        m.put("TName", tName);
        m.put("DetailItemFullNo", detailItemFullNo);
        m.put("DetailItemName", detailItemName);
        m.put("Attachs", "");
        m.put("SourceType", "RentalPatrolRoute");
        m.put("HiddenDangerAreaCode", areaCode);
        m.put("HiddenDangerAreaType", "RmPosition");
        m.put("HiddenDangerArea", areaName);
        return m;
    }
}

export const marketMap = {
  id: "a-map-market",
  kind: "map",
  title: "平面图对比 · 完成与规划",
  prompt:
    "The plans show the layout of Ash Row Market, a fictional neighbourhood market, in 2014 and in 2025. A separate council proposal describes one change scheduled for 2028. Summarise the main changes, compare the layouts, and distinguish completed changes from the proposal. Write at least 150 words.",
  maps: [
    {
      year: "2014",
      cells: [
        "Delivery yard",
        "Store rooms",
        "East gate",
        "Parking bays",
        "Covered stalls",
        "Office",
        "West entrance",
        "Narrow footpath",
        "Bus stop",
      ],
    },
    {
      year: "2025",
      cells: [
        "Community kitchen",
        "Cold store",
        "East gate",
        "Cycle parking",
        "Covered stalls",
        "Help desk",
        "West entrance",
        "Step-free path",
        "Bus stop",
      ],
    },
  ],
  proposal:
    "2028 proposal only: a roof is planned over the existing bus stop in the south-east corner. No roof is shown on either completed plan.",
  overview:
    "The covered stalls stayed at the centre, while several spaces around them acquired public-facing or access-related functions. The roof over the south-eastern bus stop belongs only to a later proposal.",
  weak: "The market became better. The bus stop was covered, and the central stalls were moved to build the kitchen.",
  issue:
    "两个错误都能回到图中检查。候车棚只是 2028 规划；两期中央均为有顶摊位，厨房取代西北角卸货区。",
  strong:
    "By 2025, the former delivery yard in the north-west had been converted into a community kitchen. At the southern edge, a step-free path occupied the position of the earlier footpath; the council also proposes to cover the neighbouring bus stop in 2028.",
  annotation:
    "过去完成时交代至 2025 已完成的用途变化；位置词把相邻设施放在一起；proposes to 明确保留未来项目的状态。",
  revision:
    "二稿用不同的谓语标记已完工项目和未来规划，保留一个没变的位置，并把一处变更准确定位。",
};
export const mapRubric = [
  [
    "任务完成",
    "概述整体布局、功能或通行方式怎样改变；交代一项保留设施，区分两期实况与未来规划。",
  ],
  [
    "连贯与衔接",
    "按北侧、南侧或功能分组。在同一空间内对比前后用途，给读者稳定的参照点。",
  ],
  [
    "词汇资源",
    "区分 remained、was converted into、is proposed 等不同关系；核对 in the north-west 与 to the north-west of 的用法。",
  ],
  [
    "语法多样性与准确性",
    "改建用被动时注意主语与时间；设施本身的位置可用主动结构，拟建用计划或未来表达。",
  ],
];
export const mapExample = {
  title: "完整示例 · Ash Row 市场三种时间状态",
  paras: [
    [
      "The plans illustrate the arrangement of Ash Row Market in 2014 and 2025 and indicate one further change proposed for 2028. Overall, the covered stalls retained their central position, but a number of surrounding facilities were converted to new uses. Access from the west was also altered.",
      "概述同时写出中央保留、周边改用和西侧通行变化。",
    ],
    [
      "In the north-west corner, a community kitchen had replaced the delivery yard by 2025. The store rooms immediately to its east were shown as a cold store on the later plan, while the east gate remained in the north-eastern corner. Farther south, the parking bays west of the central stalls had become cycle parking. On the other side of the stalls, the former office was being used as a help desk.",
      "按从北到南的空间顺序写完整动作；两期图无法推断中间具体施工年份。",
    ],
    [
      "The west entrance and south-eastern bus stop were present on both plans. Between them, however, a step-free path occupied the position of the narrow footpath shown in 2014. A roof over the bus stop is proposed for 2028, so it does not form part of the completed 2025 layout.",
      "对比不变设施与通道变化，最后单独处理未来规划，避免误当成已存在。",
    ],
  ],
};

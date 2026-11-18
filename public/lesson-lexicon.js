// Each line is one day's five additional targets, paired with the case file's principal expression.
const week = (text) =>
  text
    .trim()
    .split("\n")
    .map((row) => row.split("|").map((pair) => pair.split("~")));
export const extraTerms = [
  week(`first name~名字|last name~姓氏|new starter~新员工|team leader~组长|reception desk~接待台
line manager~直属主管|design team~设计团队|main duty~主要职责|office hours~办公时间|staff member~工作人员
main entrance~正门|sign in~登记进入|photo ID~带照片的证件|front desk~前台|waiting area~等候区
security guard~保安|building pass~大楼通行证|name tag~姓名牌|floor plan~楼层平面图|meeting point~集合点
contact number~联系电话|send a message~发消息|leave a voicemail~留言|reply by email~通过邮件回复|call back~回电
start time~开始时间|run late~迟到或晚点|arrive early~提前到达|on time~准时|keep someone informed~及时告知某人进展`),
  week(`appointment book~预约登记簿|time slot~时间段|morning session~上午场次|opening hours~营业时间|make an appointment~预约
delay a visit~推迟拜访|push back a meeting~推迟会议|later that day~当天晚些时候|fully booked~已约满|double booking~重复预订
earlier appointment~较早的预约|before noon~中午前|after lunch~午饭后|at half past nine~九点半|by midday~最迟中午
free on Friday~周五有空|schedule conflict~日程冲突|suit both sides~适合双方|alternative date~备选日期|fit someone in~挤出时间接待某人
delivery van~送货车|front counter~前柜台|driver's schedule~司机日程|drop-off point~送达点|unload boxes~卸下箱子
last-minute change~临时变更|apologise for the delay~为延误道歉|give advance warning~提前提醒|confirm in writing~书面确认|update the calendar~更新日历`),
  week(`bus fare~公交票价|single ticket~单程票|return ticket~往返票|platform number~站台号|board a train~上火车
on the corner~在拐角|beside the bridge~在桥旁|past the bank~经过银行|opposite the library~在图书馆对面|at the crossroads~在十字路口
five minutes on foot~步行五分钟|pedestrian entrance~行人入口|covered walkway~有顶步道|cycle lane~自行车道|nearby station~附近车站
diverted service~绕行班次|road closure~道路封闭|replacement bus~接驳替代巴士|temporary sign~临时标牌|revised route~调整后的路线
follow the signs~跟随标志|turn right~向右转|cross the square~穿过广场|head uphill~向坡上走|double back~折返
change trains~换乘火车|peak hour~高峰时段|departure board~发车信息板|service disruption~交通服务中断|allow extra time~多留时间`),
  week(`damaged item~损坏物品|order reference~订单编号|delivery date~送达日期|refund policy~退款政策|customer service~客服
lamp shade~灯罩|cracked surface~开裂的表面|faulty switch~有故障的开关|spare cable~备用线缆|repair kit~维修套装
original receipt~原始收据|bank statement~银行对账单|payment method~付款方式|purchase date~购买日期|online order~线上订单
pickup window~取件时间段|collection address~取件地址|return label~退货标签|original packaging~原包装|courier service~快递服务
delivery charge~配送费|postage paid~邮资已付|free of charge~免费|refund the difference~退还差价|standard fee~标准费用
case number~个案编号|prompt reply~及时回复|pending request~待处理请求|contact the seller~联系卖家|close a case~结案`),
  week(`volunteer work~志愿工作|practical skill~实用技能|previous experience~以往经验|training session~培训课|entry-level role~入门职位
manage a timetable~管理时间表|support a colleague~支持同事|lead a workshop~主持工作坊|organise materials~整理材料|track attendance~记录出勤
ask for guidance~请求指导|take initiative~主动行动|manage your time~管理自己的时间|set priorities~设定优先级|work without supervision~独立于监督工作
job title~职位名称|career change~转行|part-time role~兼职岗位|current position~现任职位|former employer~前雇主
active listening~积极倾听|problem solving~解决问题|clear communication~清晰沟通|attention to detail~注重细节|team leadership~团队领导能力
shadow a colleague~跟岗学习|observe a lesson~旁听一节课|practise a skill~练习技能|receive coaching~接受指导|review your progress~回顾个人进展`),
  week(`night shift~夜班|morning shift~早班|shift pattern~轮班规律|work overtime~加班|be on duty~值班
handover note~交接记录|incoming team~接班团队|unfinished work~未完成事项|shift supervisor~值班主管|pass on a message~转交消息
due date~截止日期|time limit~时间限制|finish on schedule~按计划完成|urgent task~紧急任务|request more time~请求延期
stock level~库存水平|order supplies~订购物资|storage shelf~货架|spare stock~备用库存|reorder point~补货点
record a reading~记录读数|check again~再次核查|temperature log~温度日志|enter a figure~录入数字|sign the logbook~在日志上签名
pending approval~等待批准|unresolved problem~未解决的问题|corrective action~纠正措施|update a colleague~向同事通报|finish a handover~完成交接`),
  week(`monthly rent~月租|security deposit~租房押金|rental agreement~租赁协议|landlord~房东|tenant~租客
heating cost~取暖费|water charge~水费|electricity meter~电表|shared expenses~共同支出|included in the rent~已含在租金中
bare room~空房间|kitchen appliance~厨房电器|shared bathroom~合用卫生间|private entrance~独立入口|storage cupboard~储物柜
renew a lease~续租|contract length~合同期限|notice period~通知期限|move-in date~入住日期|early termination~提前终止
affordable option~负担得起的选项|monthly allowance~每月预算津贴|hidden cost~隐性费用|price range~价格范围|rent increase~涨租
book a viewing~预约看房|inspect the room~检查房间|ask about repairs~询问维修事宜|sign a contract~签合同|collect the keys~领取钥匙`),
  week(`unclear wording~含糊的措辞|exact meaning~确切含义|rephrase a question~换种方式提问|repeat a detail~重复细节|confirm understanding~确认理解
visitor enquiry~访客问询|ticket price~票价|locker location~储物柜位置|opening date~开放日期|access route~通行路线
meeting agenda~会议议程|action item~待办事项|note taker~记录员|chair a meeting~主持会议|circulate the notes~分发纪要
open discussion~开放讨论|relevant point~相关要点|follow-up question~追问|invite comments~征求意见|interrupt politely~礼貌打断
shared decision~共同决定|mutual consent~双方同意|agree on a plan~商定方案|settle a dispute~解决争议|common ground~共同点
key decision~重要决定|next deadline~下一项截止时间|assign a task~分配任务|confirm ownership~确认负责人|closing remark~结束语`),
  week(`routine inspection~例行检查|visual check~目视检查|test a device~测试设备|identify damage~识别损坏|report a fault~报告故障
online reservation~网上预约|available item~可用物品|confirm a booking~确认预订|reserve equipment~预订设备|borrow a tool~借工具
locker number~储物柜号|access code~取用码|pickup deadline~取件截止时间|scan a code~扫码|retrieve an item~领取物品
book ahead~提前预订|limited supply~供应有限|waiting list~候补名单|early request~早期申请|peak demand~需求高峰
return window~归还时段|loan period~借期|late fee~逾期费|return counter~归还柜台|check for damage~检查是否损坏
reservation expiry~预约到期|cancel a request~取消请求|extend a loan~延长借期|reactivate an account~重新启用账户|receive a notification~收到通知`),
  week(`service failure~服务失误|affected customer~受影响的顾客|formal complaint~正式投诉|missed booking~错失的预订|customer expectation~顾客预期
acknowledge an error~承认错误|offer an apology~致歉|listen carefully~认真听取|show understanding~表示理解|correct a mistake~纠正错误
attach a receipt~附上收据|itemised bill~分项账单|clear photo~清晰照片|expense report~费用报告|submit a claim~提交报销申请
offer compensation~提供补偿|complimentary hour~赠送的一小时|booking credit~预订抵用额度|goodwill gesture~善意补偿|restore confidence~恢复信心
eligible expense~可报销费用|travel allowance~差旅津贴|reimbursement limit~报销上限|approval process~审批流程|repay a fare~退还车费
alternative venue~备选场地|reschedule a visit~重新安排拜访|issue a voucher~发放代金券|transfer a reservation~转移预订|confirm a solution~确认解决方案`),
  week(`upward trend~上升趋势|gradual increase~逐步增长|sharp rise~大幅上升|starting point~起点|annual total~年度总数
slight decline~小幅下降|percentage point~百分点|absolute difference~绝对差值|month-on-month change~环比变化|final figure~最终数值
highest value~最高值|record level~创纪录水平|seasonal peak~季节性高峰|turning point~转折点|maximum capacity~最大容量
steady rate~稳定速率|little variation~变化很小|flat growth~几乎零增长|constant demand~稳定需求|unchanged figure~未变数值
equal share~相同份额|majority share~多数份额|small proportion~小部分|roughly half~约一半|combined total~合计
overall picture~总体情况|significant change~显著变化|minor fluctuation~小幅波动|compare periods~比较时段|describe a pattern~描述规律`),
  week(`contributing factor~促成因素|working condition~工作条件|training quality~培训质量|tool replacement~工具更换|staff experience~员工经验
direct effect~直接影响|unexpected outcome~意外结果|reduce errors~减少差错|increase capacity~提高产能|influence behaviour~影响行为
other factors~其他因素|exclude a case~排除个案|eliminate a fault~消除故障|check an assumption~核查假设|test a theory~检验理论
associated with~与……相关|observed change~观察到的变化|related issue~相关问题|causal link~因果联系|coincide with~与……同时发生
likely cause~可能原因|additional evidence~额外证据|initial observation~初步观察|compare outcomes~比较结果|investigate further~进一步调查
strong evidence~有力证据|tentative conclusion~暂定结论|identify a cause~查明原因|independent variable~自变量|control group~对照组`),
  week(`central argument~核心论点|relevant evidence~相关证据|personal example~个人例子|main point~主要观点|explain your reasoning~解释推理
privacy concern~隐私顾虑|possible drawback~潜在缺点|attendance issue~出勤问题|raise an objection~提出异议|address a worry~回应担忧
practical benefit~实际好处|realistic option~现实可行的选择|actual result~实际结果|put a plan into action~实施计划|practical difficulty~实际困难
partial agreement~部分同意|in some cases~在有些情况下|under certain conditions~在特定条件下|generally speaking~一般来说|reasonable limit~合理限度
illustrate a point~举例说明观点|specific case~具体案例|real-life illustration~现实中的实例|for instance~例如|concrete detail~具体细节
consider the impact~考虑影响|different perspective~不同角度|student privacy~学生隐私|working schedule~工作安排|balance priorities~平衡优先事项`),
  week(`wholesale price~批发价|volume discount~批量折扣|order size~订单规模|initial payment~首付款|purchase budget~采购预算
price per item~每件价格|quoted price~报价|delivery included~含配送|compare quotations~比较报价单|total payable~应付总额
first batch~第一批|partial shipment~部分装运|warehouse space~仓储空间|delivery interval~配送间隔|staged payment~分期付款
negotiate terms~协商条款|offer a discount~提供折扣|compromise on colour~在颜色上妥协|accept an offer~接受报价|counteroffer~还价
minimum order~最低订货量|excess stock~多余库存|purchase limit~采购限额|available capacity~可用容量|fill a cupboard~装满储物柜
lasting quality~耐用品质|affordable price~可承受价格|compare suppliers~比较供应商|worth the cost~值得这项开支|long-term saving~长期节省`),
  week(`target population~目标人群|monthly pass holder~月票持有人|occasional rider~偶尔乘车的人|random sample~随机样本|sampling method~抽样方法
survey link~问卷链接|completed form~已完成的表格|decline to answer~拒绝回答|number of participants~参与人数|incomplete response~不完整回复
selection bias~选择偏差|regular commuter~经常通勤者|under-represented group~代表不足的群体|access to transport~交通可及性|survey invitation~调查邀请
voluntary participation~自愿参与|anonymous response~匿名回复|give consent~表示同意|withdraw at any time~随时退出|record a refusal~记录一次拒绝
conduct interviews~开展访谈|gather opinions~收集意见|observe behaviour~观察行为|record the location~记录地点|compare groups~比较群体
headline result~主要结果|limited scope~范围有限|margin of error~误差范围|response pattern~回应模式|interpret the data~解读数据`),
  week(`loose handrail~松动的扶手|slippery floor~湿滑地面|blocked exit~堵塞的出口|fire door~防火门|injury risk~受伤风险
warning sign~警示标志|protective cover~防护罩|safety check~安全检查|temporary barrier~临时护栏|evacuation route~疏散路线
qualified engineer~有资质的工程师|maintenance team~维护团队|repair request~维修请求|spare component~备用部件|repair schedule~维修日程
closed to visitors~对访客关闭|staff only~仅限工作人员|authorised access~授权通行|guide visitors~引导访客|designated entrance~指定入口
safe distance~安全距离|keep the corridor clear~保持通道畅通|stay behind the line~站在线后|avoid the stairs~避开楼梯|use the lift~使用电梯
severity of harm~伤害严重程度|likelihood of injury~受伤可能性|immediate action~即时行动|lower priority~较低优先级|risk assessment~风险评估`),
  week(`draft instructions~说明初稿|specific comment~具体意见|respectful tone~尊重的语气|balanced response~平衡的回应|peer review~同伴评阅
highlight a problem~指出问题|unclear step~不清楚的步骤|missing information~缺失的信息|suggest an improvement~提出改进|explain the impact~解释影响
updated version~更新后的版本|reorder the steps~调整步骤顺序|revise the wording~修改措辞|test the change~测试修改|publish a draft~发布草稿
welcome suggestions~欢迎建议|consider another view~考虑另一种看法|respond calmly~冷静回应|accept criticism~接受批评|defend a choice~为选择辩护
reader's perspective~读者的角度|user expectation~用户预期|first impression~第一印象|prior knowledge~已有知识|supportive language~支持性的语言
clarify an intention~澄清意图|acknowledge the point~认可该观点|avoid blame~避免归责|explain the context~说明背景|agree a revision~商定修改`),
  week(`reusable container~可重复使用的容器|single-use bag~一次性袋子|packing material~包装材料|waste stream~废物流|recycling point~回收点
fuel expense~燃料支出|maintenance cost~维护成本|initial investment~初期投入|operating budget~运营预算|distribution cost~分销成本
carbon emissions~碳排放|resource consumption~资源消耗|energy use~能源使用|vehicle capacity~车辆容量|return journey~返程
recover an investment~收回投资|cover the cost~覆盖成本|net saving~净节省|payback period~回收期|fixed cost~固定成本
repeat use~重复使用|durable material~耐用材料|replacement cycle~更换周期|return rate~归还率|lifetime cost~全寿命成本
weigh the costs~权衡成本|compare alternatives~比较替代方案|available evidence~现有证据|environmental trade-off~环境上的取舍|practical constraint~实际限制`),
  week(`role card~角色卡|practice scenario~练习情境|customer role~顾客角色|sample response~回答示例|unfamiliar setting~不熟悉的环境
learning objective~学习目标|specific feedback~具体反馈|next attempt~下一次尝试|notice an improvement~察觉进步|build confidence~建立信心
unexpected request~意外的请求|change the subject~换话题|ask a relevant question~提出相关问题|check the details~核对细节|reach a solution~达成解决方案
underlying problem~根本问题|customer preference~顾客偏好|practical need~实际需求|hidden assumption~隐含假设|listen for clues~听取线索
respond flexibly~灵活回应|switch roles~交换角色|revise a reply~调整回答|unplanned question~计划外的问题|new information~新增信息
assessment criterion~评价标准|observable action~可观察的行动|successful outcome~成功结果|independent practice~独立练习|transfer a skill~迁移技能`),
  week(`inspection date~检查日期|reopening schedule~重新开放日程|booking calendar~预订日历|available contractor~有空档的承包商|necessary approval~必要批准
official inspection~正式检查|written guarantee~书面保证|safety standard~安全标准|formal permission~正式许可|comply with rules~遵守规定
room hire~场地租用|cancellation cost~取消成本|rental income~租赁收入|additional expense~额外开销|compare total costs~比较总成本
charity concert~慈善音乐会|public performance~公开演出|printed ticket~纸质门票|prior commitment~此前承诺|affected booking~受影响的预订
backup venue~备用场地|revised rehearsal~调整后的彩排|alternative contractor~备选承包商|reserve funds~储备资金|emergency contact~紧急联系人
review the options~审查选项|request written evidence~请求书面凭据|agree a timetable~商定时间表|realistic deadline~可行的截止时间|final recommendation~最终建议`),
  week(`published notice~已发布通知|original leaflet~原版传单|publication date~发布日期|current schedule~现行日程|verify a detail~核实细节
outdated guidance~过时指引|recent update~最新情况|official announcement~正式公告|latest edition~最新版本|date of issue~发出日期
conflicting reports~相互矛盾的报告|historical context~历史背景|different time frames~不同时间范围|earlier statement~早先的陈述|reconcile two accounts~协调两种说法
temporary closure~临时封闭|normal operating hours~常规运作时段|limited exception~有限例外|seasonal restriction~季节性限制|specific circumstance~特定情况
first-hand account~第一手叙述|dated record~有日期的记录|independent source~独立来源|editorial correction~编辑更正|public information~公共信息
weather permitting~天气允许时|provisional arrangement~暂定安排|await confirmation~等待确认|further inspection~进一步检查|current condition~当前状况`),
  week(`pilot scheme~试点方案|project proposal~项目提案|local trial~本地试验|suggest a change~提议修改|working hypothesis~工作假设
small sample~小样本|short observation period~短观察期|volunteer bias~志愿者偏差|unmeasured factor~未测量因素|preliminary result~初步结果
assume a link~假设存在联系|challenge a belief~质疑看法|test an idea~检验想法|question a premise~质疑前提|state an assumption~说明假设
weather conditions~天气条件|existing habit~原有习惯|travel choice~出行选择|secure parking~安全停车处|journey purpose~出行目的
give a rationale~说明理由|cite an observation~引用观察结果|assess the trade-off~评估权衡|support a recommendation~支持建议|anticipate criticism~预判批评
random invitation~随机邀请|trial participant~试验参与者|reject an invitation~拒绝邀请|record an alternative~记录替代方案|review participation~审查参与情况`),
  week(`job interview~求职面试|selection panel~遴选小组|candidate profile~候选人资料|job description~岗位说明|work sample~工作样例
unexpected development~意外进展|time to prepare~准备时间|pause briefly~稍作停顿|ask for a moment~请求片刻时间|respond directly~直接回应
technical term~技术术语|plain language~通俗语言|precise definition~准确定义|confirm the scope~确认范围|explain an abbreviation~解释缩写
change your approach~改变方法|reconsider a choice~重新考虑选择|revise an estimate~调整估算|respond to evidence~依据证据作出回应|explain a change~说明改变
persuasive argument~有说服力的论点|address an objection~回应异议|supporting detail~支持性细节|preferred approach~倾向的方法|practical solution~实际解决方案
weigh risks~权衡风险|consider consequences~考虑后果|evaluate alternatives~评判备选项|make a judgement~作出判断|justify a priority~说明优先级理由`),
  week(`booking fee~预订费|refund condition~退款条件|eligible booking~符合条件的预订|late cancellation~逾期取消|qualifying period~资格认定时段
entrance notice~入口告示|public guidance~公众指引|key instruction~核心指令|refund deadline~退款期限|practical example~实际例子
precise wording~准确措辞|ambiguous phrase~含义不清的短语|clear reference~明确的指代|specific instruction~具体指示|intended audience~目标受众
visitor feedback~访客反馈|formal reply~正式回复|address a query~回应疑问|acknowledge receipt~确认收到|revise a notice~修订公告
outline a policy~概述政策|present the evidence~呈现证据|report attendance~报告出勤数据|describe an exception~说明例外|list the conditions~列明条件
provided that~只要|subject to availability~视可用情况而定|valid until noon~有效至中午|replacement visitor~补位访客|disputed case~有争议的个案`),
  week(`timed task~限时任务|practice essay~练习作文|marking guide~评分指南|candidate response~考生回答|exam conditions~考试条件
planning stage~规划阶段|opening paragraph~开篇段落|final check~最终核查|remaining minutes~剩余分钟数|allow time for editing~为修改留出时间
recurring error~反复出现的错误|grammar mistake~语法错误|weak example~薄弱的例子|unsupported claim~缺少依据的主张|logical gap~逻辑缺口
time pressure~时间压力|strict deadline~严格时限|work efficiently~高效工作|prioritise content~优先保证内容|complete a draft~完成初稿
second marker~第二名评分者|compare scores~对比分数|agreed criteria~共同认可的标准|review a discrepancy~复核差异|anonymous marking~匿名评分
realistic goal~可行的目标|targeted revision~针对性复习|fresh prompt~全新题目|check for transfer~检查是否迁移|monitor improvement~监测改善`),
  week(`outgoing coordinator~卸任协调人|successor~接任者|project closure~项目收尾|transfer ownership~移交管理权|written handover~书面交接
baseline performance~起始表现|independent task~独立任务|fresh evidence~新证据|compare attempts~对比尝试|identify improvement~识别提升
uncertain instruction~不明确的指示|ask who approves~询问谁审批|confirm a limit~确认限额|locate a record~查找记录|verify authority~核实权限
shared log~共享日志|repair history~维修历史|update an entry~更新一条记录|log a refusal~记录一次拒绝|audit trail~操作追踪记录
carry out a decision~落实决定|assign ownership~指派负责人|check the outcome~检查结果|complete the action~完成行动|report back~汇报结果
future learning~后续学习|weekly reflection~每周回顾|independent conversation~独立对话|new challenge~新挑战|sustain progress~保持进步`),
];

// Each entry is an original usage task: English paraphrase, Chinese distinction, constrained gap, answer, related form.
const group = (title, focus, transfer, rows) => ({
  title,
  focus,
  transfer,
  terms: rows
    .trim()
    .split("\n")
    .map((line) => {
      const [term, definition, nuance, gap, answer, stem] = line.split("|");
      return {
        term,
        definition,
        nuance,
        gap,
        answer,
        stem,
        example: gap.replace("____", answer),
      };
    }),
});
export const lexisModules = [
  group(
    "研究与证据",
    "区分测量误差、相关与因果",
    "向导师解释为什么一项试点结果还不足以支持全面实施。",
    `
confounding variable|a third factor that can distort an apparent link|混杂变量同时牵涉解释变量和结果，不能笼统写成任何未知因素。|Income was a possible ____ in the analysis of diet and illness.|confounding variable|confound
selection bias|distortion caused by the way participants are recruited|选择偏差指样本进入研究的机制有偏，扩大同一来源样本未必能消除。|Recruiting only regular cyclists introduced ____ into the survey.|selection bias|select / bias
corroborate|provide independent support for a claim|常搭配 findings、account 或 evidence，强调外部证据相互印证。|The satellite records ____ the residents' account of a longer drought.|corroborate|corroboration
tentative conclusion|a judgement that still needs stronger support|tentative 表示证据尚有限，可以修订，区别于 vague。|With data from only two schools, this must remain a ____.|tentative conclusion|tentatively / conclude
replicate a finding|obtain a similar result in an independent test|强调其他样本或研究者能再现结果，区别于反复抄写同一数字。|A second laboratory was unable to ____ obtained in the pilot.|replicate a finding|replication / find
underlying mechanism|the process that explains how an effect occurs|描述现象背后的作用过程，单纯列举相关性并未说明 mechanism。|The interviews offered clues to the ____ behind the drop in applications.|underlying mechanism|underlie / mechanism
statistically significant|unlikely under a stated statistical null model at the chosen threshold|统计显著不等于效果大，通常还需说明效应量或实际意义。|The improvement was ____ but too small to notice in daily use.|statistically significant|statistics / significance
account for variation|explain why measured outcomes differ|account for 接差异或变化；account to 是向人说明责任。|Differences in soil depth may ____ in crop yields.|account for variation|account / vary
empirical evidence|information based on observation or measurement|强调可观察数据，区别于道理上 plausible 的推测。|The proposal has a coherent rationale but little ____ to support it.|empirical evidence|empirically / evidence
warrant caution|justify a careful interpretation or decision|warrant 作动词直接接名词，语气比 prove 更审慎。|The missing records ____ when interpreting the apparent improvement.|warrant caution|warrant / cautious
`,
  ),
  group(
    "城市与政策",
    "政策干预、分配与替代效应",
    "给市议会写一段分析，说明交通政策可能让谁得益、让谁承担代价。",
    `
unintended consequence|an outcome that was not part of a policy's aim|不一定是负面结果；写清受影响群体才有分析价值。|A longer queue at suburban clinics was an ____ of closing the central clinic.|unintended consequence|intend / consequent
disproportionate burden|a cost falling unusually heavily on one group|disproportionate 是相对份额失衡，不能只理解为绝对数额很大。|A flat transport levy places a ____ on low-income commuters.|disproportionate burden|proportion / burden
targeted intervention|an action directed at a specified group or problem|targeted 比 general 更强调对象和范围，常与 universal measure 对照。|Free evening buses were designed as a ____ for shift workers.|targeted intervention|target / intervene
allocate resources|assign limited means to competing uses|allocate X to Y；避免 allocate for somebody X 的机械搭配。|Councils must ____ across housing, transport and public health.|allocate resources|allocation / resource
regulatory framework|the set of rules governing an activity|framework 是制度整体，rule 是其中一项要求。|Short-term rentals expanded before a coherent ____ was in place.|regulatory framework|regulate / framework
unmet demand|need for a service that the current supply fails to satisfy|指需求未得到满足，必须区分没有需求与没有能力提供服务。|Long queues after the last bus point to considerable ____ for late-night travel.|unmet demand|meet / demand
spatial distribution|the pattern of locations across an area|指地理分布，不是平面图的绘制方法。|A citywide average conceals the ____ of public parks.|spatial distribution|space / distribute
public consultation|a formal process for seeking people's views|consultation 表示公众参与流程，不等于最终依投票决定。|The route was revised after a ____ revealed concerns about pedestrian access.|public consultation|public / consult
offset the cost|counterbalance an expense wholly or partly|offset 可能仅抵消一部分，未说明时不要擅自写完全消除。|Revenue from parking permits could ____ of maintaining bus shelters.|offset the cost|offset / costly
policy compliance|the degree to which rules are followed|compliance with 后接规定；区别于 whether the rule is effective。|Clearer signs improved ____ without changing the penalties.|policy compliance|policy / comply
`,
  ),
  group(
    "环境与资源",
    "生态修复、暴露与有限资源",
    "讨论用单一指标评价湿地修复工作的局限。",
    `
habitat fragmentation|the division of a habitat into disconnected patches|生境破碎化不同于面积全毁，即便总面积相近也会影响迁移。|The new service road accelerated ____ along the valley.|habitat fragmentation|habitat / fragment
restore biodiversity|bring back a wider variety of living organisms|restore 指恢复曾存在的状况，不能用一个物种数量替代多样性。|Planting a single fast-growing species will not necessarily ____.|restore biodiversity|restoration / biodiverse
cumulative impact|the combined effect of repeated or separate actions|强调时间或来源的叠加，区别于某一次事件的冲击。|The assessment considered the ____ of several small drainage schemes.|cumulative impact|accumulate / impact
finite resource|a supply that has a limited total quantity|finite 指总量有上限，scarce 指当前相对需求不足。|Usable groundwater is a ____ in this basin.|finite resource|finite / resource
ecological resilience|the capacity of an ecosystem to recover after disturbance|resilience 不是完全不受影响，而是受扰后仍能恢复功能。|A diverse seed bank can increase ____ after a fire.|ecological resilience|ecology / resilient
mitigate damage|reduce the severity of harm|mitigate 搭配 damage 或 risk，不能直接理解为彻底预防。|Vegetated strips can ____ caused by runoff from farmland.|mitigate damage|mitigation / damaging
seasonal fluctuation|a recurring change associated with the time of year|fluctuation 指上下波动，与单向长期增长不同。|One dry month may reflect a ____ rather than a permanent decline.|seasonal fluctuation|season / fluctuate
exceed a threshold|go beyond the point at which a response changes|threshold 是效应或行动的临界点，非任意平均值。|Nutrient levels must ____ before the warning system is triggered.|exceed a threshold|excess / threshold
resource depletion|the progressive exhaustion of a supply|depletion 强调储量变少，不能仅用消耗量很大代替长期趋势。|Faster extraction has raised concerns about ____ in the region.|resource depletion|resource / deplete
conservation priority|an issue selected for early protection efforts|作为 priority 必须有取舍依据，如濒危程度或可恢复性。|Reconnecting the two wetlands became a ____ once migration data were available.|conservation priority|conserve / prioritise
`,
  ),
  group(
    "技术与工作",
    "采用新工具时的效率、权衡与问责",
    "给项目经理解释自动化提高效率的条件和需要保留的人工环节。",
    `
operational efficiency|how effectively routine work uses time and resources|强调投入与产出的关系，不能只以人员减少为证。|Automating routine checks improved ____ but increased the need for specialist oversight.|operational efficiency|operate / efficient
adopt a precautionary approach|act cautiously when potential harm is uncertain|形容词 precautionary 修饰 approach，通常说明为何证据不足时先限制风险。|The hospital chose to ____ before replacing human review.|adopt a precautionary approach|precaution / approach
implementation barrier|an obstacle to putting a plan into practice|关注执行阶段，与设计目标本身不同。|A lack of training proved a greater ____ than the cost of the software.|implementation barrier|implement / barrier
retain oversight|keep responsibility for supervising a process|oversight 在此是监督，也可能表示疏忽；需结合动词判断。|Managers should ____ of exceptions even when routine decisions are automated.|retain oversight|retention / oversee
informed consent|permission given with an understanding of the relevant facts|告知用途和风险后自愿同意，不能等同于沉默接受。|Collecting identifiable recordings required ____ from each participant.|informed consent|inform / consent
technical feasibility|whether a proposal can be achieved with available methods|技术可行不自动等于经济划算或伦理可接受。|The trial demonstrated ____ but did not establish long-term affordability.|technical feasibility|technical / feasible
transferable skills|abilities useful across different roles or settings|transferable 表示可迁移，通常举沟通、组织或分析能力。|The programme prioritises ____ rather than knowledge of one software version.|transferable skills|transfer / skill
reduce dependency|make a system less reliant on something else|dependency on 后接被依赖对象；必要时写明依赖主体。|Training two coordinators could ____ on a single expert.|reduce dependency|reduce / dependent
systematic error|a repeatable tendency to produce biased measurements|误差有方向或规律，重复测量不能像随机噪声那样简单抵消。|The same calibration fault introduced a ____ into every reading.|systematic error|systematically / error
allocate responsibility|assign ownership of a decision or task|明确谁负责；与分配预算 allocate funding 区分。|The agreement must ____ for reviewing decisions the software cannot explain.|allocate responsibility|allocation / responsible
`,
  ),
  group(
    "教育与社会",
    "准入机会、评价指标和长期效果",
    "评价一个助学计划是否真正改善了参与机会，而不仅是提高了报名量。",
    `
equitable access|a fair opportunity to obtain a service or resource|equitable 强调公平，可因需要给予不同支持，并非人人份额相同。|A digital-only application process may undermine ____ for rural applicants.|equitable access|equity / accessible
attainment gap|a difference in educational outcomes between groups|指结果差距，不直接说明是努力、能力还是机会造成。|The extra tuition narrowed the ____ in mathematics but not in reading.|attainment gap|attain / gap
prior attainment|achievement measured before a later intervention|对比组间原有成绩，避免把起点差误判为干预效果。|We adjusted the comparison for ____ at the start of the course.|prior attainment|prior / attain
intrinsic motivation|the desire to do something for its own sake|内在动机与为奖金或惩罚驱动的 external incentive 相区分。|Removing the prize did little to reduce learners' ____.|intrinsic motivation|intrinsically / motivate
sustain engagement|maintain active involvement over time|强调持续参与，不仅仅是点击报名或一次出席。|Short feedback sessions helped tutors ____ after the initial workshop.|sustain engagement|sustainable / engage
unequal distribution|an uneven allocation across people or groups|说清分配的对象和群体，避免抽象宣称不公平。|The headline figure disguises the ____ of mentoring time across schools.|unequal distribution|unequal / distribute
social mobility|movement between social or economic positions|不是人口地理迁移；常结合代际机会讨论。|The scholarship was intended to support ____ across generations.|social mobility|social / mobile
positive externality|a benefit accruing to people outside the original transaction|强调第三方获得额外收益，区别于购买服务者直接获得的好处。|Reduced disease transmission among unvaccinated residents is a ____ of vaccination.|positive externality|positive / external
benchmark performance|compare outcomes against a clearly defined reference|benchmark 常接 against，说明参照对象；与只记录成绩有别。|Teachers used a common assessment to ____ against national standards.|benchmark performance|benchmark / perform
longitudinal study|research that follows observations over an extended period|追踪时间变化，区别于同一时点查看不同群体。|A ____ would show whether the improvement lasted beyond graduation.|longitudinal study|longitudinal / study
`,
  ),
  group(
    "数据与论证",
    "界定范围、比较幅度以及审慎表达",
    "在研究小结里区分绝对增加、相对变化与尚待验证的解释。",
    `
relative increase|growth expressed in relation to the starting value|相对增幅以起始值为分母；从 10% 到 15% 是五个百分点，也是 50% 的相对增长。|A rise from ten to fifteen represents a fifty per cent ____.|relative increase|relatively / increase
absolute difference|the numerical distance between two values|强调原始单位的差，区别于百分比变化。|The ____ between the two waiting times was three minutes.|absolute difference|absolutely / differ
hold other variables constant|keep other relevant factors fixed while comparing an effect|是分析时的控制条件；不能只凭起点与终点相同就宣称中间都稳定。|To isolate the role of tuition fees, analysts must ____.|hold other variables constant|hold / vary / constancy
substantial variation|a considerable spread or difference in observations|variation 不等同于误差，可来自真实群体差异。|Similar averages can conceal ____ between individual neighbourhoods.|substantial variation|substantially / vary
qualified support|agreement that includes reservations or conditions|qualified 在此是有保留的，非获得资格的。|The review offered ____ for expansion, conditional on independent monitoring.|qualified support|qualify / support
counter an argument|respond to an opposing claim with reasons or evidence|counter 是及物动词，不能写 counter to an argument。|One example alone cannot ____ based on a large body of data.|counter an argument|counter / argue
a plausible explanation|an account that could reasonably be true|plausible 表示合理可能，并不意味着已被证明。|Seasonal demand provides ____ for the temporary price rise.|a plausible explanation|plausibly / explain
outweigh the drawbacks|have benefits greater than the disadvantages|outweigh 直接接比较对象；论证要说明比较依据。|In remote districts the savings may ____ of a less frequent service.|outweigh the drawbacks|outweigh / drawback
draw a distinction|identify a meaningful difference between two things|常用 between A and B，区别于 draw a conclusion。|The report should ____ between reduced demand and inadequate supply.|draw a distinction|draw / distinct
interpret with caution|treat a finding as provisional because of limits in the evidence|可用于审慎限定推论；具体写出限制比只堆模糊词更有力。|These self-reported estimates are figures we should ____.|interpret with caution|interpretation / cautious
`,
  ),
];
const glosses = [
  "混杂变量|选择偏差|佐证|暂定结论|复现研究发现|潜在机制|统计上显著的|解释差异|实证证据|需要谨慎",
  "意外后果|不成比例的负担|针对性干预|分配资源|监管框架|尚未满足的需求|空间分布|公众咨询|抵消成本|政策遵从",
  "生境破碎化|恢复生物多样性|累积影响|有限资源|生态韧性|减轻损害|季节性波动|超过阈值|资源耗竭|保护工作的优先事项",
  "运营效率|采取审慎措施|执行障碍|保留监督权|知情同意|技术可行性|可迁移技能|减少依赖|系统性误差|分配职责",
  "公平享有机会|学业表现差距|先前学业成就|内在动机|维持参与度|分布不均|社会流动性|正外部性|对标评估表现|纵向研究",
  "相对增幅|绝对差值|保持其他变量不变|显著差异|有保留的支持|反驳论点|一种合理的解释|利大于弊|加以区分|审慎解读",
];
lexisModules.forEach((module, m) =>
  module.terms.forEach((term, i) => {
    term.gloss = glosses[m].split("|")[i];
  }),
);
const models = [
  "Although the pilot produced statistically significant gains, staff experience may be a confounding variable. An independent team should try to replicate a finding of this size before the programme is expanded.",
  "A flat parking levy places a disproportionate burden on night-shift workers who cannot take a bus. A targeted intervention, such as late services on two routes, could offset the cost for this group.",
  "An increase in bird counts may reflect seasonal fluctuation. Monitoring habitat fragmentation as well would give a clearer picture of ecological resilience after wetland restoration.",
  "Technical feasibility alone does not justify full automation. The team should retain oversight of unusual claims and allocate responsibility for decisions the system cannot explain.",
  "More applications tell us little about equitable access. A longitudinal study that accounts for prior attainment could test whether the scheme supports social mobility.",
  "The relative increase in bookings looks impressive because the original number was small. A plausible explanation is the temporary discount, so the figures are estimates we should interpret with caution.",
];
lexisModules.forEach((m, i) => {
  m.productionExample = models[i];
});

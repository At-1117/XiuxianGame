# 《踏入轮回》开发交接文档

- 更新时间：2026-09-28
- 工作区：`E:\Project\XiuXianGame`
- Cocos 工程：`E:\Project\XiuXianGame\XiuxianGameProject`
- 引擎：Cocos Creator 3.8.8
- 语言：TypeScript strict
- 测试：Vitest
- 设计分辨率：750×1334
- 当前分支：`master`
- 最近代码提交：`b0e16f8 fix: make gain label transient`
- 当前状态：最近的面板、场景和导航改动尚未全部提交 Git

---

## 1. 项目任务

目标是完成《踏入轮回》的 P1 最小可玩闭环：

1. 开局与职业选择
2. 天赋分配与不可逆确认
3. 存档与重启跳过开局
4. 修炼、在线收益、离线收益、小境界推进
5. 神游与奇遇
6. 大境界突破
7. 属性面板与设置面板
8. 前两个 Boss
9. 主动轮回
10. 角色、商店、试炼、宗门面板

核心约束：

- UI 必须采用 Scene-first：节点、图片、按钮和 Label 在 Scene 中创建。
- 代码只负责状态、存档、显隐、文本刷新、按钮事件和场景切换。
- 不在运行时用代码创建视觉节点。
- 素材按面板分目录存放，禁止跨面板串用。
- 共用资源只能放在明确登记的 `assets/resources/ui/shared`。
- 每完成一个阶段，将完成内容、技术、问题和解决方式写入 Word 开发日志。
- 开始新面板前先查看 UI 草稿并核对内容，确认后再制作。

---

## 2. 当前进度

### 2.1 工程与基础层

已完成：

- Cocos Creator 3.8.8 工程和 TypeScript strict 配置。
- `GameRuntime`、`GameClock`、`RandomSource`、平台存储接口。
- `PlayerSaveV1` 存档结构、校验、迁移边界。
- `SaveService` 读写玩家存档。
- Vitest 测试体系。
- `BrowserPlatformAdapter` 的进程内回退存储改为跨 Scene 共享，避免切换 Scene 时读不到旧存档。
- `CultivationSessionTracker`：记录前台离开修炼场景的时间，返回修炼场景后按在线收益补算。

### 2.2 开局流程

已完成：

- `Main.scene` 保留开局流程。
- `OpeningController` 已挂载到 `OpeningRoot`。
- 职业选择、天赋分配、不可逆确认、创建存档和加载修炼 Scene。
- P1 只有剑修可选，枪修/刀修保持锁定。
- 天赋总点数必须用完 20 点，且四项都至少 1 点。
- 不满足条件时点击确认，显示独立 `TalentWarning`，不会污染 `RemainingPointsBox`。
- 已有有效存档时，进入 `Main.scene` 会自动加载 `CultivationScene`。
- 剑修选中边框有循环呼吸闪烁。

关键文件：

- `assets/scenes/Main.scene`
- `assets/scripts/ui/opening/OpeningController.ts`
- `assets/scripts/core/model/TalentRules.ts`

### 2.3 修炼核心

已完成：

- 在线修炼
- 离线收益
- 小境界推进
- 大境界突破
- 突破失败补修
- 突破后扣除本次所需灵力，剩余灵力结转到下一阶段
- 自动修炼
- 进度条横向填充
- 突破按钮达到门槛才显示
- 神游按钮和自动神游
- 属性面板和设置面板
- 点击左上角头像打开属性面板
- 点击底部“角色”进入 `CharacterScene`
- 离开修炼 Scene 前先结算并保存当前修炼进度
- 返回修炼 Scene 后补算其他前台面板停留时间
- 应用进入后台时按离线收益结算

关键文件：

- `assets/scenes/CultivationScene.scene`
- `assets/scripts/core/cultivation/CultivationService.ts`
- `assets/scripts/core/cultivation/CultivationSessionTracker.ts`
- `assets/scripts/ui/cultivation/CultivationController.ts`
- `assets/scripts/platform/BrowserPlatformAdapter.ts`

注意：

- `CultivationScene.scene` 中部分导航按钮的序列化 `_interactable` 仍可能是 `false`，但 `CultivationController.refreshView()` 会在运行时将五个底部导航按钮全部设为可交互。
- 判断修炼导航是否正常时，应在运行态验收，不要只依赖 Scene 文件里的按钮默认值。

### 2.4 神游与奇遇

已完成：

- 三类各两个事件：
  - 收益
  - 选择
  - 稀有
- 类型权重：收益 50%、选择 45%、稀有 5%。
- `AdventureService` 处理神游石恢复、消耗、事件抽取和奖励。
- 神游石初始 30，单次消耗 1，1 点 / 30 秒恢复，手动冷却 0.5 秒，自动神游 2 秒一次。
- 当前事件奖励：
  - 凝神吐纳：修为 +10 基础单位
  - 灵石矿脉：灵石 +10
  - 集市冲突：A 分支灵石 +5，B 分支无奖励
  - 深潭巨蟒：A 分支灵石 +5、修为 +10 基础单位，B 分支无奖励
  - 无名功法残页：修为 +30 基础单位
  - 法宝现世：灵石 +100
- 选择类事件弹窗延期，当前自动结算 A 分支概率 50%。

关键文件：

- `assets/scripts/data/AdventureConfig.ts`
- `assets/scripts/core/adventure/AdventureService.ts`

### 2.5 属性面板与设置面板

已完成：

- `AttributePanel` 和 `SettingsPanel` 位于 `CultivationScene` 内，默认隐藏。
- 左上角头像打开属性面板。
- 设置按钮打开设置面板。
- 属性面板十项：
  - 战力
  - 攻击力
  - 防御力
  - 根基
  - 体质
  - 运气
  - 剑意
  - 枪意
  - 刀意
  - 精神力
- 战力和攻击力读取真实计算值；根基、体质、运气、精神力读取天赋。
- 防御力和三系意暂为 0。
- 音乐/音效状态写入 `PlayerSettings`。
- 删档重玩目前只显示二次确认提示，不会直接删除存档。

### 2.6 角色面板

Scene：`assets/scenes/CharacterScene.scene`

已完成并通过用户验收：

- 背景：`character_background.png`
- 顶部资源栏
- 右上角头像：
  - AvatarEntryButton
  - AvatarPortrait
  - AvatarFrame
- 中央职业立绘：
  - `SwordPortrait`
  - `SpearPortrait`
  - `BladePortrait`
- `CharacterPanelController` 根据存档中的 `profession` 自动显示对应立绘。
- 当前阶段使用的是五类装备框：
  - WeaponSlot
  - ArmorSlot
  - AccessorySlot
  - ArtifactSlot
  - SpellSlot
- 星级节点和 `equipment_slot_empty` 当前没有使用。
- `button_plus` 当前没有引用。
- 底部导航完整可交互。

职业立绘公共副本：

- `assets/resources/ui/shared/profession_sword_stand.png`
- `assets/resources/ui/shared/profession_spear_stand.png`
- `assets/resources/ui/shared/profession_blade_stand.png`

### 2.7 商店面板

Scene：`assets/scenes/ShopScene.scene`

已完成并通过用户验收：

- 全屏 `shop_background.png`
- 顶部资源栏
- 刷新按钮：`button_refresh.png`
- 升级按钮：`button_upgrade.png`
- 商品卡框：`product_card_frame.png`
- 每页 6 个商品卡
- 两页商品卡占位：
  - `ProductCard1` 到 `ProductCard6`
  - `ProductCard7` 到 `ProductCard12`
- `ShopPageController`：
  - 上滑进入下一页
  - 下滑返回上一页
  - 显示页码
- 商品卡本身已挂 `Button`，后续购买逻辑绑定到卡片点击。
- 商店等级标签位于刷新按钮上方黑条中央。
- 底部导航完整可交互。
- 用户已手动细调商店布局，不要直接覆盖位置和尺寸。

### 2.8 试炼主面板

Scene：`assets/scenes/TrialScene.scene`

已完成并通过用户验收：

- 全屏 `trial_background.png`
- 顶部资源栏
- “试炼”标题
- 一个可点击的 `WantedPosterButton`
- `wanted_poster_art.png`
- 底部导航完整可交互

当前试炼主面板刻意不包含详情素材：

- `wanted_panel_background.png`
- `status_bounty.png`
- `status_captured.png`
- `arrow_left.png`
- `arrow_right.png`
- `reward_frame.png`
- `reward_spirit.png`
- `label_spirit_reward.png`
- `button_capture.png`

这些素材全部留给后续“通缉令详情面板”。详情面板尚未制作，关闭方式也尚未确认。

### 2.9 宗门主面板

Scene：`assets/scenes/SectScene.scene`

已完成：

- 全屏 `sect_background.png`
- 顶部资源栏
- “宗门”标题
- 5 栋建筑和对应竖向标签：
  - HallBuilding / HallBuildingLabel：大殿，可点击
  - ForgeBuilding / ForgeBuildingLabel：炼宝阁，可点击
  - MineBuilding / MineBuildingLabel：矿场，可点击
  - ArenaBuilding / ArenaBuildingLabel：演武场，**需从禁用改为开放**（2026-09-28 变更）
  - RecruitmentBuilding / RecruitmentBuildingLabel：纳贤阁（弟子招募），**需从禁用改为开放**（2026-09-28 变更）
- 底部导航完整可交互
- 5 个底部导航按钮均已检查为 `_interactable = true`

注意：

- **2026-09-28 变更**：原「演武场、弟子招募属于 v1.1，当前只保留视觉素材和占位节点」**已作废**。弟子招募 / 派驻、演武场全部提前到当前批次制作，宗门 v1.0 由 3 栋扩为 5 栋。依据见 `《踏入轮回》设计定稿v0.2_待确认.md` 第 8 节。
- 5 栋建筑虽然可点击，但尚未接入弹窗详情、升级、矿场产出、弟子派驻等逻辑。
- 弹窗形态已定：居中卡片 640×960（2:3）+ 主面板压暗，关闭方式＝点击透明遮罩（复用通缉令详情面板方案）。
- 宗门弹窗底图的生图提示词见 `宗门弹窗底图_生图提示词.md`。

### 2.10 Scene 索引

| Scene | UUID | 状态 |
| :--- | :--- | :--- |
| `Main.scene` | `21e771f9-441e-47c7-816a-8927bb60e462` | 开局面板 |
| `CultivationScene.scene` | `fadf30dd-333e-4f5f-9907-11221603e63a` | 修炼与属性/设置 |
| `CharacterScene.scene` | `f87504fd-6b7a-46e0-84e4-73721922060e` | 角色主面板已验收 |
| `ShopScene.scene` | `c9c13518-5cbb-4b71-92c2-54963e679031` | 商店主面板已验收 |
| `TrialScene.scene` | `5934f285-5367-48e6-a538-abbc7da0264b` | 试炼主面板已验收，详情未做 |
| `SectScene.scene` | `f09bff2d-2fdc-455c-9377-45ab64dcf67b` | 宗门主面板已完成；5 栋弹窗未制作（弹窗形态与底图提示词已定稿） |

### 2.11 底部导航

当前规则：

- 所有主面板 Scene 的底部五个按钮全部可交互。
- 五个按钮分别对应：
  - 角色：`CharacterScene`
  - 宗门：`SectScene`
  - 修炼：`CultivationScene`
  - 商店：`ShopScene`
  - 试炼：`TrialScene`
- `BottomNavigationController` 负责通用面板导航。
- `CultivationController` 负责修炼场景底部导航。
- 不要重新加入“只允许修炼导航”的锁定模式，除非用户明确要求。

---

## 3. 当前工作区状态

`git status` 目前不是干净状态。

已修改未提交：

- `assets/scenes/Main.scene`
- `assets/scenes/CultivationScene.scene`
- `assets/scripts/platform/BrowserPlatformAdapter.ts`
- `assets/scripts/ui/cultivation/CultivationController.ts`

未纳入 Git 的资源和脚本包括但不限于：

- `assets/scenes/CharacterScene.scene`
- `assets/scenes/ShopScene.scene`
- `assets/scenes/TrialScene.scene`
- `assets/scenes/SectScene.scene`
- `assets/resources/ui/character/`
- `assets/resources/ui/shop/`
- `assets/resources/ui/trial/`
- `assets/resources/ui/sect/`
- `assets/resources/ui/shared/profession_*_stand.*`
- `assets/scripts/ui/navigation/`
- `assets/scripts/ui/character/`
- `assets/scripts/ui/shop/`
- `assets/scripts/core/cultivation/CultivationSessionTracker.ts`
- `tests/core/cultivation-session-tracker.spec.ts`
- `tests/platform/`

不要使用 `git reset --hard` 或重建 Scene 的方式“清理”这些改动。

---

## 4. 卡点与待确认

### 4.1 通缉令详情面板

用户已明确：

- 试炼主面板只使用 `trial_background.png` 和 `wanted_poster_art.png`。
- `wanted_panel_background.png`、状态、箭头、奖励、追捕按钮都属于点击通缉令后打开的详情界面。
- 详情界面暂时不制作。

待确认：

- 详情面板用什么方式关闭。
- 建议使用透明遮罩区域点击关闭，不额外引入其他目录的关闭按钮素材。

### 4.2 商店逻辑

尚未实现：

- 商品刷新
- 商品购买
- 商店升级
- 价格与货币扣除
- 每日刷新次数和阶梯涨价
- 商品数据表

已确认交互：

- 购买入口是点击商品卡本身，不增加独立购买按钮。
- 当前每页 6 张商品卡，2×3 布局。
- 上滑/下滑翻页已实现。

### 4.3 宗门逻辑

尚未实现（2026-09-28 更新：范围由 3 栋扩为 5 栋）：

- 5 栋建筑的弹窗面板（居中卡片 + 主面板压暗 + 点击遮罩关闭）
- 大殿详情与升级
- 炼宝阁详情（炼丹 / 炼器）
- 矿场产出、存储和提取
- 建筑等级和消耗
- 弟子系统：纳贤阁招募、派驻、弟子升级二级小窗、10 人总量上限
- 演武场加成

当前状态：

- 5 栋建筑节点都已存在，但点击不会打开任何弹窗。
- 演武场、纳贤阁两个按钮在 Scene 里仍是禁用状态，需要改为可交互——它们已不再是 v1.1 内容。

已定稿待实现的口径：

- 弹窗卡片 640×960（2:3）居中；分区＝标题 / 弟子位 ×2 / 等级加成数值 / 升级按钮。
- 一名弟子只能派驻一处；每栋 2 位，共 10 位；弟子总量上限 10；弟子有等级，升级在纳贤阁二级小窗内。
- 弟子效果：矿场按弟子等级提升产出、炼宝阁按弟子等级提升炼丹成功率、大殿每驻 1 人全局产出 +2%、演武场每驻 1 人战力 +3%、纳贤阁每驻 1 人提升招募速度。
- ⚠️ 矿场与炼宝阁的「派驻弟子」口径需由固定 +1 单位改为 `Σ(弟子等级 × 系数)`，否则弟子升级不会影响派驻产出。
- 纳贤阁主面板额外有「招募」入口；弟子招募主入口在纳贤阁，次要来源为奇遇。

### 4.4 核心闭环未完成

- 前两个 Boss 战斗界面
- Boss 结算与首通掉落
- Boss 失败记录
- 主动轮回按钮和二次确认窗口
- 选择类奇遇弹窗和 3 秒倒计时
- 设置页删档重玩二次确认
- 音频系统接入

### 4.5 素材与文档

尚未导入或尚未制作：

- 属性面板六类属性图标
- 设置面板“设置”标题图片
- 奇遇事件弹窗底框
- 奇遇选项按钮
- 选择类奇遇特效
- Boss 战斗界面素材
- 主动轮回按钮和确认弹窗素材

文档状态：

- 设计文档：`E:\Project\XiuXianGame\《踏入轮回》设计定稿v0.2_待确认.md`
- 数值表：`E:\Project\XiuXianGame\《踏入轮回》数值表骨架_v0.4.xlsx`
- Word 开发日志：`E:\Project\XiuXianGame\《踏入轮回》开发日志.docx`
- 最近记录页数：29 页
- 角色、商店、试炼、宗门等最新阶段已补入 Word 开发日志（阶段 9 至阶段 13）。
- 写 Word 前必须确认 WPS/Word 未占用文件。

---

## 5. 下一步

建议优先级：

1. 制作通缉令详情面板
   - 使用当前试炼文件夹里的详情素材。
   - 先确认关闭方式。
   - 支持前两个 Boss 的左右切换。
   - 状态：未通关显示“悬赏中”，已通关显示“追捕”印章。

2. 制作前两个 Boss 的战斗最小闭环
   - 战斗界面
   - 战斗结算
   - 首通奖励
   - 失败记录
   - 解锁主动轮回

3. 制作主动轮回按钮与二次确认窗口
   - 境界 ≥ 金丹
   - 当前 Boss 首次失败后解锁
   - 保留规则读取已有 `ReincarnationService`

4. 制作选择类奇遇弹窗
   - 选项 A / B
   - 3 秒倒计时
   - 超时选择保守项
   - 自动神游直接结算

5. 接入商店逻辑
   - 商品卡点击购买
   - 刷新和升级
   - 商品配置与价格

6. 接入宗门逻辑（5 栋：大殿 / 炼宝阁 / 矿场 / 演武场 / 纳贤阁）
   - 5 栋建筑弹窗面板（居中卡片 + 主面板压暗 + 点击遮罩关闭）
   - 大殿升级
   - 炼宝阁炼丹 / 炼器
   - 矿场产出与提取
   - 弟子系统：纳贤阁招募 + 派驻（每栋 2 位）+ 弟子升级二级小窗 + 10 人总量上限
   - 演武场加成
   - 建筑弹窗底图提示词见 `宗门弹窗底图_生图提示词.md`

7. 补充属性图标和设置标题素材
8. 接入音频系统
9. 更新构建场景列表并验证 `director.loadScene` 的正式构建环境

---

## 6. 避坑点

### 6.1 Scene 文件安全

- `cc.SceneAsset` 必须是索引 0。
- `cc.Scene` 必须是索引 1。
- `cc.Scene._id` 和 `Canvas._id` 不能重复。
- 所有节点和组件 `_id` 必须唯一。
- 父节点的 `_children` 不能重复引用同一个子节点。
- 子节点的 `_parent` 必须与父节点的 `_children` 对应。
- JSON 结构校验通过不代表 Creator 能正常打开。
- 修改 Scene 后必须实际调用 Creator 的 `scene.open-scene` 验证。
- 不要重新生成用户已经手工调过布局的 Scene；直接修改现有 Scene 的对应节点。

### 6.2 SpriteFrame 引用

- `.meta` 中 `subMetas.f9941.uuid` 已经带有 `@f9941`。
- 写入 Scene 时只能使用一次 `@f9941`。
- 不要写成 `uuid@f9941@f9941`，否则所有精灵帧都会丢失。
- 修改引用后要检查 Scene 源文件和 Creator 生成的 library 文件。

### 6.3 Scene-first

- 不通过代码创建 Sprite、Label、Button 等视觉节点。
- 视觉节点在 Scene 中创建并挂载。
- 代码只负责：
  - 存档读写
  - 文本刷新
  - 显隐控制
  - 进度和状态更新
  - 按钮事件
  - 场景切换
- 按钮事件在 `onEnable` 注册，在 `onDisable` 注销。

### 6.4 跨场景修炼

- 离开修炼 Scene 前必须调用结算和保存逻辑。
- `CultivationSessionTracker` 用于判断前台切换面板和真正离线。
- 前台其他面板停留时间按在线收益结算。
- 应用进入后台或重启后按离线收益结算。
- `BrowserPlatformAdapter` 的内存回退必须是跨适配器共享的，不能再改成每个实例独立 Map。
- 不要重新引入“切换到角色界面后灵力重置”的行为。

### 6.5 素材规则

- 商店、试炼、宗门、角色素材分开存放。
- 跨面板共用素材只能通过 `assets/resources/ui/shared`。
- 职业立绘在 shared 中保留 `profession_*_stand` 副本。
- 不要使用 `opening` 目录素材直接绘制其他面板。
- 新素材导入后让 Creator 生成 `.meta`，不要随意复制旧 UUID。
- 试炼详情素材不要重新放回试炼主面板。

### 6.6 底部导航

- 目前所有主面板 Scene 的五个导航按钮都可交互。
- 不要再为商店或试炼加入“只允许修炼”的锁定逻辑，除非用户重新确认。
- 检查按钮问题时要同时检查：
  - Scene 中 `Button._interactable`
  - `BottomNavigationController` 是否挂载
  - 五个按钮引用是否完整
  - Cocos 运行时是否覆盖了按钮状态

### 6.7 宗门建筑

- 5 栋建筑（大殿、炼宝阁、矿场、演武场、纳贤阁）均已可点击，但尚未接入弹窗详情、升级、矿场产出、弟子派驻等逻辑。
- **2026-09-28 变更**：演武场、纳贤阁（弟子招募）**不再禁用**——弟子招募 / 派驻、演武场已由 v1.1 提前至当前批次。如果发现 Scene 里这两个按钮仍是 `_interactable = false`，那是历史遗留，应当改为可交互。
- 不要把建筑节点误认为主面板导航按钮。
- 宗门 v1.0 的 5 栋建筑与弟子系统规则见 `《踏入轮回》设计定稿v0.2_待确认.md` 第 8 节。

### 6.8 文档与进程

- 写 Word 开发日志前先检查 WPS/Word 是否打开。
- 不要覆盖用户手工调整过的 Scene 布局。
- Cocos 异常退出后可能残留 `CocosCreator.exe` 子进程，重新启动前先确认没有旧进程占用项目。

---

## 7. 验证基线

每阶段最低验证：

```powershell
cd E:\Project\XiuXianGame\XiuxianGameProject
npm run typecheck
npm run typecheck:tests
npm test
```

当前测试基线：

- 10 个测试文件
- 42 个测试
- 全部通过

最近已实际验证可打开的 Scene：

- `CharacterScene`
- `ShopScene`
- `TrialScene`
- `SectScene`

Scene 验证不要只依赖 JSON 和 TypeScript 检查，必须额外执行 Creator 的 `open-scene`。

---

## 8. 关键路径

### 设计文档

- `E:\Project\XiuXianGame\《踏入轮回》设计定稿v0.2_待确认.md`
- `E:\Project\XiuXianGame\《踏入轮回》数值表骨架_v0.4.xlsx`

### 美术与素材

- `E:\Project\XiuXianGame\宗门弹窗底图_生图提示词.md`（宗门 5 栋建筑弹窗底图的生图提示词）
- `E:\Project\XiuXianGame\ui素材图\宗门面板ui素材\`（宗门主面板背景、5 栋建筑图、建筑名字样图）

### Word 开发日志

- `E:\Project\XiuXianGame\《踏入轮回》开发日志.docx`

### Scene

- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\Main.scene`
- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\CultivationScene.scene`
- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\CharacterScene.scene`
- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\ShopScene.scene`
- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\TrialScene.scene`
- `E:\Project\XiuXianGame\XiuxianGameProject\assets\scenes\SectScene.scene`

### 代码

- `assets/scripts/ui/opening/OpeningController.ts`
- `assets/scripts/ui/cultivation/CultivationController.ts`
- `assets/scripts/ui/navigation/BottomNavigationController.ts`
- `assets/scripts/ui/character/CharacterPanelController.ts`
- `assets/scripts/ui/shop/ShopPageController.ts`
- `assets/scripts/core/cultivation/CultivationService.ts`
- `assets/scripts/core/cultivation/CultivationSessionTracker.ts`
- `assets/scripts/core/adventure/AdventureService.ts`
- `assets/scripts/core/reincarnation/ReincarnationService.ts`
- `assets/scripts/platform/BrowserPlatformAdapter.ts`

# 《踏入轮回》开发日志

本文件记录每个阶段的交付内容、技术方案、遇到的问题、解决方式和验收状态。它是本项目的开发过程记录，不替代《踏入轮回》小游戏策划方案（完善执行版）中的开发执行总纲。

## 代码规范

- 使用 TypeScript strict 模式，禁止隐式 `any`。
- 公共类型和函数必须写 JSDoc；注释解释意图和边界，不重复代码表面含义。
- 类和接口使用 PascalCase，变量和方法使用 camelCase，常量使用 UPPER_SNAKE_CASE。
- 文件按职责放置，领域逻辑不得直接引用 Cocos 节点或平台全局对象。
- 所有资源路径和文件名使用 ASCII。
- 每个阶段完成后必须先通过 TypeScript 检查，再进行下一阶段。
- 开发文档直接修改现有文件，不创建竞争版本；本开发日志除外，它是明确新增的阶段记录文档。

## 阶段 0：工程基线

**状态：** 已完成，等待用户确认后进入阶段 1。

### 本阶段完成内容

- 建立工程目录结构：场景、应用装配、核心逻辑、数据、平台适配、UI、调试和资源配置。
- 创建 `Main.scene`，将画布逻辑尺寸设为 `750 × 1334`，适配竖屏小游戏。
- 设置项目设计分辨率为 `750 × 1334`，采用宽度适配。
- 建立 `PlatformAdapter`、浏览器平台实现和平台工厂接口。
- 建立统一 `GameClock` 与 `RandomSource` 接口。
- 建立 `GameRuntime` 依赖集合，为后续存档、修炼和战斗逻辑提供统一入口。
- 开启 TypeScript strict、`noImplicitOverride`、`noFallthroughCasesInSwitch` 和文件名大小写一致性检查。
- 添加 `.editorconfig` 与 Prettier 基础配置。
- 在本文件中建立后续阶段的记录位置。

### 使用的技术

- Cocos Creator 3.8.8
- TypeScript strict 模式
- Cocos Scene 资源格式
- 浏览器 `localStorage` 与页面可见性事件
- Git 本地版本控制
- TypeScript 5.8.3 类型检查

### 遇到的问题与解决

#### 1. Cocos 声明文件与 strict 检查冲突

- 问题：开启 strict 后，TypeScript 会检查 Cocos 3.8.8 自带声明文件，并报告引擎内部缺少类型标注、缺失 WebGPU 类型等问题。
- 解决：保留项目代码的 strict 检查，增加 `skipLibCheck: true`，只跳过第三方和引擎声明文件检查。
- 验证：`npx --yes --package typescript@5.8.3 tsc --noEmit -p tsconfig.json` 通过。

#### 2. 空白工程没有初始场景

- 问题：`assets` 目录为空，没有可以直接运行的场景。
- 解决：使用 Cocos Creator 3.8.8 官方 2D 模板场景复制为 `assets/scenes/Main.scene`，修改名称、画布尺寸和画布位置。
- 验证：场景 JSON 可解析，包含 `Canvas`、`Camera`、`UITransform` 和 `Canvas` 组件，尺寸为 `750 × 1334`。

#### 3. 平台能力不能直接写死到业务层

- 问题：后续同时需要浏览器预览和微信小游戏运行环境，直接使用 `window`、`wx` 或 Cocos API 会导致领域逻辑无法独立测试。
- 解决：先定义 `PlatformAdapter`，浏览器实现只负责存储和生命周期；微信实现留到后续阶段补充。
- 验证：平台实现没有引用 Cocos 节点，TypeScript 检查通过。

### 验证记录

- TypeScript 类型检查通过。
- 场景 JSON 可解析。
- 项目设计分辨率已设置为 `750 × 1334`。
- 代码目录、资源目录和开发日志目录均已建立。
- Git 基线提交已完成，提交信息为 `chore: establish project baseline`。

### 下一阶段

阶段 1：核心模型。实现玩家档案、境界、天赋、资源、P1/P2/P21、时钟、随机数和存档迁移，并先用纯 TypeScript 测试。

<!-- STAGE_1_INSERTION_POINT -->


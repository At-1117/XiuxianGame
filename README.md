# 《踏入轮回》修仙小游戏

一款修仙题材的放置养成小游戏，目标平台为微信小程序 / 小游戏。

- **引擎**：Cocos Creator 3.8.8
- **语言**：TypeScript（strict）
- **测试**：Vitest
- **设计分辨率**：750 × 1334

## 目录结构

```
assets/
  scenes/          # Main / Cultivation / Character / Shop / Trial / Sect
  scripts/
    core/          # 存档、修炼、奇遇、轮回等纯逻辑
    ui/            # 各面板控制器（只做状态、文本刷新、显隐、按钮事件）
    data/          # 配置表
    platform/      # 平台适配层
  resources/ui/    # 按面板分目录的 UI 素材
docs/              # 设计文档、数值表、开发日志、交接文档
tests/             # Vitest 用例
```

## 开发约定

- **Scene-first**：节点、图片、按钮、Label 一律在 Scene 中创建，代码不运行时创建视觉节点。
- 素材按面板分目录存放，跨面板共用素材只能放入 `assets/resources/ui/shared`。
- 按钮事件在 `onEnable` 注册、`onDisable` 注销。
- 离开修炼场景前必须结算并保存；返回后按在线收益补算，进入后台按离线收益结算。

## 常用命令

```bash
npm install
npm run typecheck         # 主工程类型检查
npm run typecheck:tests   # 测试代码类型检查
npm test                  # Vitest
```

修改 Scene 后除 JSON / TypeScript 校验外，还需在 Creator 中实际执行 `open-scene` 验证。

## 文档

详细进度、卡点与避坑点见 [`docs/HANDOFF.md`](docs/HANDOFF.md)。

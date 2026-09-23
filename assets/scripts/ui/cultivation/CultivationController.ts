import {
  _decorator,
  Button,
  Component,
  Label,
  Node,
  Sprite,
} from "cc";
import type { GameRuntime } from "../../app/GameBootstrap";
import { createGameRuntime } from "../../app/GameBootstrap";
import { CultivationService } from "../../core/cultivation/CultivationService";
import { getRealmDefinition, getProfessionDefinition } from "../../data/GameConfig";
import { getCultivationPerSecond } from "../../core/model/CultivationCalculator";
import { createInitialPlayerSave } from "../../core/model/PlayerProfile";
import type { PlayerSaveV1 } from "../../core/save/SaveSchema";
import { SaveService } from "../../core/save/SaveService";
import type { RealmStageId } from "../../core/types/GameTypes";

const { ccclass, property } = _decorator;

/** 修炼界面每秒结算一次，避免每帧刷新 Label 和存档。 */
const ONLINE_TICK_SECONDS = 1;
/** 在线修炼每 5 秒写入一次平台存储。 */
const AUTO_SAVE_SECONDS = 5;
/** 境界阶段对应的中文后缀。 */
const REALM_STAGE_NAMES: Readonly<Record<RealmStageId, string>> = Object.freeze({
  early: "前期",
  middle: "中期",
  late: "后期",
  perfection: "圆满",
});

/**
 * 修炼界面控制器。
 *
 * 该组件只读取、刷新和保存场景中已经存在的节点，不创建视觉节点。
 * 所有按钮事件在 onEnable 中统一注册，在 onDisable 中统一注销。
 */
@ccclass("CultivationController")
export class CultivationController extends Component {
  @property({ type: Node, tooltip: "角色名称 Label 所在节点。" })
  public characterNameNode: Node | null = null;

  @property({ type: Node, tooltip: "灵石数量 Label 所在节点。" })
  public spiritStoneNode: Node | null = null;

  @property({ type: Node, tooltip: "轮回次数 Label 所在节点。" })
  public reincarnationNode: Node | null = null;

  @property({ type: Node, tooltip: "当前境界 Label 所在节点。" })
  public realmLabelNode: Node | null = null;

  @property({ type: Node, tooltip: "每秒收益 Label 所在节点。" })
  public gainRateNode: Node | null = null;

  @property({ type: Node, tooltip: "灵力进度填充 Sprite 所在节点。" })
  public progressFillNode: Node | null = null;

  @property({ type: Node, tooltip: "灵力进度数值 Label 所在节点。" })
  public progressTextNode: Node | null = null;

  @property({ type: Node, tooltip: "自动修炼按钮节点。" })
  public autoButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "神游按钮节点。" })
  public adventureButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "突破按钮节点。" })
  public breakthroughButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "设置按钮节点。" })
  public settingsButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "左上角属性入口按钮节点。" })
  public attributeEntryNode: Node | null = null;

  @property({ type: Node, tooltip: "角色导航按钮节点。" })
  public navCharacterNode: Node | null = null;

  @property({ type: Node, tooltip: "宗门导航按钮节点。" })
  public navSectNode: Node | null = null;

  @property({ type: Node, tooltip: "商店导航按钮节点。" })
  public navShopNode: Node | null = null;

  @property({ type: Node, tooltip: "试炼导航按钮节点。" })
  public navTrialNode: Node | null = null;

  @property({ tooltip: "开发期时间倍率；正式发布必须保持 1。" })
  public timeScale = 1;

  private readonly cultivationService = new CultivationService();
  private runtime: GameRuntime | null = null;
  private saveService: SaveService | null = null;
  private save: PlayerSaveV1 | null = null;
  private tickAccumulator = 0;
  private saveAccumulator = 0;
  private unsubscribeLifecycle: (() => void) | null = null;

  protected override onLoad(): void {
    this.runtime = createGameRuntime();
    this.saveService = new SaveService(this.runtime.platform.storage);
    this.save = this.loadOrCreateSave();
    this.applyOfflineProgress();
    this.unsubscribeLifecycle = this.runtime.platform.subscribeLifecycle({
      onShow: () => this.applyOfflineProgress(),
      onHide: () => this.persistSave(),
    });
    this.refreshView();
  }

  protected override onEnable(): void {
    this.bindButton(this.autoButtonNode, this.handleAutoClick);
    this.bindButton(this.adventureButtonNode, this.handleAdventureClick);
    this.bindButton(this.breakthroughButtonNode, this.handleBreakthroughClick);
    this.bindButton(this.settingsButtonNode, this.handleSettingsClick);
    this.bindButton(this.attributeEntryNode, this.handleAttributeClick);
    this.bindButton(this.navCharacterNode, this.handleAttributeClick);
    this.bindButton(this.navSectNode, this.handleSectClick);
    this.bindButton(this.navShopNode, this.handleShopClick);
    this.bindButton(this.navTrialNode, this.handleTrialClick);
  }

  protected override onDisable(): void {
    this.unbindButton(this.autoButtonNode, this.handleAutoClick);
    this.unbindButton(this.adventureButtonNode, this.handleAdventureClick);
    this.unbindButton(this.breakthroughButtonNode, this.handleBreakthroughClick);
    this.unbindButton(this.settingsButtonNode, this.handleSettingsClick);
    this.unbindButton(this.attributeEntryNode, this.handleAttributeClick);
    this.unbindButton(this.navCharacterNode, this.handleAttributeClick);
    this.unbindButton(this.navSectNode, this.handleSectClick);
    this.unbindButton(this.navShopNode, this.handleShopClick);
    this.unbindButton(this.navTrialNode, this.handleTrialClick);
  }

  protected override onDestroy(): void {
    this.persistSave();
    this.unsubscribeLifecycle?.();
    this.unsubscribeLifecycle = null;
  }

  protected override update(deltaTime: number): void {
    if (!this.save || !this.saveService) {
      return;
    }

    this.tickAccumulator += deltaTime;
    if (this.tickAccumulator < ONLINE_TICK_SECONDS) {
      return;
    }

    const elapsedSeconds = this.tickAccumulator;
    this.tickAccumulator = 0;
    const tickResult = this.cultivationService.tick(this.save, elapsedSeconds, this.timeScale);
    this.save = tickResult.save;
    this.saveAccumulator += elapsedSeconds;
    this.refreshView();

    if (this.saveAccumulator >= AUTO_SAVE_SECONDS) {
      this.saveAccumulator = 0;
      this.persistSave();
    }
  }

  /** 读取存档；首次进入修炼界面时创建默认剑修存档。 */
  private loadOrCreateSave(): PlayerSaveV1 {
    if (!this.runtime || !this.saveService) {
      throw new Error("CultivationController runtime is not initialized.");
    }

    try {
      const loaded = this.saveService.load();
      if (loaded) {
        return loaded;
      }
    } catch (error) {
      console.warn("[CultivationController] 忽略无法读取的旧存档。", error);
    }

    return createInitialPlayerSave({
      profession: "sword",
      talents: {
        spiritRoot: 20,
        physique: 0,
        luck: 0,
        mind: 0,
      },
      nowMs: this.runtime.clock.nowMs(),
    });
  }

  /** 根据存档时间戳结算离线收益。 */
  private applyOfflineProgress(): void {
    if (!this.save || !this.runtime || !this.saveService) {
      return;
    }

    const elapsedSeconds = (this.runtime.clock.nowMs() - this.save.lastCalculatedAtMs) / 1000;
    if (elapsedSeconds <= 0) {
      return;
    }

    const offlineResult = this.cultivationService.tickOffline(
      this.save,
      elapsedSeconds,
      this.timeScale,
    );
    this.save = offlineResult.save;
    this.saveService.save(this.save);
    this.refreshView();
  }

  /** 刷新场景中所有动态文本和进度显示。 */
  private refreshView(): void {
    if (!this.save) {
      return;
    }

    const realm = getRealmDefinition(this.save.realm.realmId);
    const profession = getProfessionDefinition(this.save.profession);
    const requiredCultivation = this.cultivationService.getRequiredCultivation(this.save);
    const progress = requiredCultivation > 0 ? this.save.cultivation / requiredCultivation : 0;
    const cultivationPerSecond = getCultivationPerSecond(this.save.realm.realmId, this.save.talents);

    this.setLabel(this.characterNameNode, `无名${profession.name}`);
    this.setLabel(this.spiritStoneNode, Math.floor(this.save.spiritStones).toString());
    this.setLabel(this.reincarnationNode, `轮回次数：${this.save.reincarnation.count}`);
    this.setLabel(this.realmLabelNode, `${realm.name}境${REALM_STAGE_NAMES[this.save.realm.stage]}`);
    this.setLabel(
      this.gainRateNode,
      this.save.breakthrough.recoveryRemaining > 0
        ? `补修还差 ${Math.ceil(this.save.breakthrough.recoveryRemaining)}`
        : `灵力 +${cultivationPerSecond.toFixed(1)}/秒`,
    );
    this.setLabel(
      this.progressTextNode,
      `${Math.floor(this.save.cultivation)} / ${Math.floor(requiredCultivation)}`,
    );
    this.setProgressFill(progress);
    this.setButtonInteractable(this.autoButtonNode, true);
    this.setButtonInteractable(this.adventureButtonNode, true);
    this.setButtonInteractable(this.settingsButtonNode, true);
    this.setButtonInteractable(this.attributeEntryNode, true);
    this.setButtonInteractable(this.navCharacterNode, true);
    this.setButtonInteractable(this.navSectNode, true);
    this.setButtonInteractable(this.navShopNode, true);
    this.setButtonInteractable(this.navTrialNode, true);
    this.setButtonInteractable(
      this.breakthroughButtonNode,
      this.cultivationService.canAttemptBreakthrough(this.save),
    );
  }

  /** 设置普通 Label 文本；节点或 Label 缺失时保持静默。 */
  private setLabel(node: Node | null, text: string): void {
    const label = node?.getComponent(Label) ?? null;
    if (label) {
      label.string = text;
    }
  }

  /** 设置横向填充进度，范围固定在 0 到 1。 */
  private setProgressFill(progress: number): void {
    const sprite = this.progressFillNode?.getComponent(Sprite) ?? null;
    if (sprite) {
      sprite.fillRange = Math.min(1, Math.max(0, progress));
    }
  }

  /** 设置按钮是否可交互；节点或 Button 缺失时保持静默。 */
  private setButtonInteractable(node: Node | null, interactable: boolean): void {
    const button = node?.getComponent(Button) ?? null;
    if (button) {
      button.interactable = interactable;
    }
  }

  /** 写入当前存档。 */
  private persistSave(): void {
    if (this.save && this.saveService) {
      this.saveService.save(this.save);
    }
  }

  /** 统一注册按钮点击事件。 */
  private bindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.on(Button.EventType.CLICK, handler, this);
  }

  /** 统一注销按钮点击事件。 */
  private unbindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.off(Button.EventType.CLICK, handler, this);
  }

  /** 切换自动神游开关。 */
  private handleAutoClick(): void {
    if (!this.save) {
      return;
    }

    this.save.settings.autoAdventureEnabled = !this.save.settings.autoAdventureEnabled;
    this.persistSave();
  }

  /** 神游业务将在下一阶段接入，当前只保留入口。 */
  private handleAdventureClick(): void {
    console.info("[CultivationController] 神游入口已点击，玩法逻辑待接入。");
  }

  /** 执行一次突破，并使用运行时随机源判定结果。 */
  private handleBreakthroughClick(): void {
    if (!this.save || !this.runtime || !this.saveService) {
      return;
    }

    const result = this.cultivationService.attemptBreakthrough(this.save, this.runtime.random.next());
    if (result.chance <= 0) {
      return;
    }

    this.save = result.save;
    this.saveService.save(this.save);
    this.refreshView();
  }

  /** 设置入口暂时只记录事件，设置面板接入后替换为场景切换。 */
  private handleSettingsClick(): void {
    console.info("[CultivationController] 设置入口已点击，设置面板待接入。");
  }

  /** 左上角头像和角色导航共用属性面板入口。 */
  private handleAttributeClick(): void {
    console.info("[CultivationController] 属性面板入口已点击，角色面板待接入。");
  }

  /** 宗门导航入口。 */
  private handleSectClick(): void {
    console.info("[CultivationController] 宗门入口已点击，宗门 Scene 待接入。");
  }

  /** 商店导航入口。 */
  private handleShopClick(): void {
    console.info("[CultivationController] 商店入口已点击，商店 Scene 待接入。");
  }

  /** 试炼导航入口。 */
  private handleTrialClick(): void {
    console.info("[CultivationController] 试炼入口已点击，试炼 Scene 待接入。");
  }
}

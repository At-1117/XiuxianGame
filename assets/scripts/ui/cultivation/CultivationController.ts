import {_decorator, Button, Color, Component, director, Label, Node, Sprite, Tween, tween, UIOpacity, Vec3} from "cc";
import type { GameRuntime } from "../../app/GameBootstrap";
import { createGameRuntime } from "../../app/GameBootstrap";
import { AdventureService, type AdventureOutcome } from "../../core/adventure/AdventureService";
import { CultivationService } from "../../core/cultivation/CultivationService";
import { CultivationSessionTracker } from "../../core/cultivation/CultivationSessionTracker";
import { getRealmDefinition, getProfessionDefinition, RESOURCE_RULES } from "../../data/GameConfig";
import { getBasicAttackPerSecond, getPlayerPower } from "../../core/model/CombatCalculator";
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

  @property({ type: Node, tooltip: "神游按钮下方的神游石数量 Label 节点。" })
  public adventureStoneCountNode: Node | null = null;

  @property({ type: Node, tooltip: "突破按钮节点。" })
  public breakthroughButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "设置按钮节点。" })
  public settingsButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "左上角属性入口按钮节点。" })
  public attributeEntryNode: Node | null = null;

  @property({ type: Node, tooltip: "属性面板根节点。" })
  public attributePanelNode: Node | null = null;

  @property({ type: Node, tooltip: "属性面板关闭按钮。" })
  public attributeCloseButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "战力数值 Label。" })
  public battlePowerValueNode: Node | null = null;

  @property({ type: Node, tooltip: "攻击力数值 Label。" })
  public attackValueNode: Node | null = null;

  @property({ type: Node, tooltip: "防御力数值 Label。" })
  public defenseValueNode: Node | null = null;

  @property({ type: Node, tooltip: "剑意数值 Label。" })
  public swordIntentValueNode: Node | null = null;

  @property({ type: Node, tooltip: "枪意数值 Label。" })
  public spearIntentValueNode: Node | null = null;

  @property({ type: Node, tooltip: "刀意数值 Label。" })
  public bladeIntentValueNode: Node | null = null;

  @property({ type: Node, tooltip: "根基数值 Label。" })
  public foundationValueNode: Node | null = null;

  @property({ type: Node, tooltip: "体质数值 Label。" })
  public physiqueValueNode: Node | null = null;

  @property({ type: Node, tooltip: "运气数值 Label。" })
  public luckValueNode: Node | null = null;

  @property({ type: Node, tooltip: "精神力数值 Label。" })
  public mindValueNode: Node | null = null;

  @property({ type: Node, tooltip: "设置面板根节点。" })
  public settingsPanelNode: Node | null = null;

  @property({ type: Node, tooltip: "设置面板关闭按钮。" })
  public settingsCloseButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "音乐开关按钮。" })
  public musicToggleButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "音乐开启状态节点。" })
  public musicOnNode: Node | null = null;

  @property({ type: Node, tooltip: "音乐关闭状态节点。" })
  public musicOffNode: Node | null = null;

  @property({ type: Node, tooltip: "音效开关按钮。" })
  public soundToggleButtonNode: Node | null = null;

  @property({ type: Node, tooltip: "音效开启状态节点。" })
  public soundOnNode: Node | null = null;

  @property({ type: Node, tooltip: "音效关闭状态节点。" })
  public soundOffNode: Node | null = null;

  @property({ type: Node, tooltip: "删档重玩按钮。" })
  public deleteSaveButtonNode: Node | null = null;

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
  private readonly adventureService = new AdventureService();
  private runtime: GameRuntime | null = null;
  private saveService: SaveService | null = null;
  private cultivationSessionTracker: CultivationSessionTracker | null = null;
  private save: PlayerSaveV1 | null = null;
  private tickAccumulator = 0;
  private saveAccumulator = 0;
  private autoAdventureAccumulator = 0;
  private lastManualAdventureAtMs = Number.NEGATIVE_INFINITY;
  private gainRateBasePosition = new Vec3();
  private adventureMessage = "";
  private adventureMessageRemainingSeconds = 0;
  private unsubscribeLifecycle: (() => void) | null = null;

  protected override onLoad(): void {
    this.runtime = createGameRuntime();
    this.saveService = new SaveService(this.runtime.platform.storage);
    this.cultivationSessionTracker = new CultivationSessionTracker(this.runtime.platform.storage);
    this.save = this.loadOrCreateSave();
    this.save = this.adventureService.ensureAdventureState(this.save, this.runtime.clock.nowMs());
    this.gainRateBasePosition = new Vec3(this.gainRateNode?.position ?? Vec3.ZERO);
    this.hideGainRateLabel();
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
    this.bindButton(this.attributeCloseButtonNode, this.handleAttributeClose);
    this.bindButton(this.settingsCloseButtonNode, this.handleSettingsClose);
    this.bindButton(this.musicToggleButtonNode, this.handleMusicToggle);
    this.bindButton(this.soundToggleButtonNode, this.handleSoundToggle);
    this.bindButton(this.deleteSaveButtonNode, this.handleDeleteSave);
    this.bindButton(this.navCharacterNode, this.handleCharacterNavigation);
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
    this.unbindButton(this.attributeCloseButtonNode, this.handleAttributeClose);
    this.unbindButton(this.settingsCloseButtonNode, this.handleSettingsClose);
    this.unbindButton(this.musicToggleButtonNode, this.handleMusicToggle);
    this.unbindButton(this.soundToggleButtonNode, this.handleSoundToggle);
    this.unbindButton(this.deleteSaveButtonNode, this.handleDeleteSave);
    this.unbindButton(this.navCharacterNode, this.handleCharacterNavigation);
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
    this.save = this.adventureService.recoverSpiritStones(this.save, this.runtime?.clock.nowMs() ?? 0);
    this.updateAdventureMessage(elapsedSeconds);
    this.updateAutoAdventure(elapsedSeconds);
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

  /**
   * 结算离开修炼场景期间的修炼进度。
   *
   * 如果玩家只是切换到角色等前台面板，按在线收益补算；
   * 如果应用真正进入后台或重启，没有前台标记时按离线收益结算。
   */
  private applyOfflineProgress(): void {
    if (!this.save || !this.runtime || !this.saveService) {
      return;
    }

    const nowMs = this.runtime.clock.nowMs();
    const foregroundAwayStartedAtMs =
      this.cultivationSessionTracker?.readForegroundAwayStartedAtMs() ?? null;
    const elapsedSeconds = (nowMs - this.save.lastCalculatedAtMs) / 1000;

    if (elapsedSeconds <= 0) {
      this.cultivationSessionTracker?.clearForegroundAway();
      return;
    }

    const result =
      foregroundAwayStartedAtMs === null
        ? this.cultivationService.tickOffline(this.save, elapsedSeconds, this.timeScale)
        : this.cultivationService.tick(this.save, elapsedSeconds, this.timeScale);

    this.save = this.adventureService.recoverSpiritStones(result.save, nowMs);
    this.cultivationSessionTracker?.clearForegroundAway();
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

    this.setLabel(this.characterNameNode, `无名${profession.name}`);
    this.setLabel(this.spiritStoneNode, Math.floor(this.save.spiritStones).toString());
    this.setLabel(this.adventureStoneCountNode, `${this.save.adventureStones ?? 0}`);
    this.setLabel(this.reincarnationNode, `轮回次数：${this.save.reincarnation.count}`);
    this.setLabel(this.realmLabelNode, `${realm.name}境${REALM_STAGE_NAMES[this.save.realm.stage]}`);
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
    this.refreshBreakthroughButton();
    this.refreshAutoButtonVisual();
    this.refreshAttributePanel();
    this.refreshSettingsPanel();
  }

  /** 显示一次蓝色增益提示，从下方弹出后缓慢淡出。 */
  private showGainRateLabel(text: string): void {
    const node = this.gainRateNode;
    const label = node?.getComponent(Label) ?? null;
    const opacity = node?.getComponent(UIOpacity) ?? null;
    if (!node || !label || !opacity) {
      return;
    }

    Tween.stopAllByTarget(node);
    Tween.stopAllByTarget(opacity);
    node.active = true;
    label.color = new Color(78, 156, 255, 255);
    label.string = text;
    opacity.opacity = 255;
    node.setPosition(
      this.gainRateBasePosition.x,
      this.gainRateBasePosition.y - 24,
      this.gainRateBasePosition.z,
    );
    node.setScale(0.88, 0.88, 1);

    tween(node)
      .to(0.24, { position: this.gainRateBasePosition }, { easing: "backOut" })
      .to(0.16, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
      .start();
    tween(opacity)
      .delay(1.5)
      .to(0.75, { opacity: 0 }, { easing: "sineOut" })
      .call(() => this.hideGainRateLabel())
      .start();
  }

  /** 增益提示播放结束后隐藏，不恢复常驻收益文本。 */
  private hideGainRateLabel(): void {
    const node = this.gainRateNode;
    const opacity = node?.getComponent(UIOpacity) ?? null;
    if (node) {
      Tween.stopAllByTarget(node);
      node.active = false;
      node.setScale(1, 1, 1);
    }
    if (opacity) {
      Tween.stopAllByTarget(opacity);
      opacity.opacity = 0;
    }
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
      sprite.type = Sprite.Type.FILLED;
      sprite.fillType = Sprite.FillType.HORIZONTAL;
      sprite.fillStart = 0;
      sprite.fillRange = Math.min(1, Math.max(0, progress));
    }
  }

  /** 根据自动修炼开关刷新按钮颜色，提供明确的开启和关闭反馈。 */
  private refreshAutoButtonVisual(): void {
    if (!this.save) {
      return;
    }

    const enabled = this.save.settings.autoAdventureEnabled;
    const color = enabled ? Color.WHITE : new Color(150, 150, 150, 255);
    const sprite = this.autoButtonNode?.getComponent(Sprite) ?? null;
    const button = this.autoButtonNode?.getComponent(Button) ?? null;
    if (sprite) {
      sprite.color = color;
    }
    if (button) {
      button.normalColor = color;
    }
  }

  /** 达到当前突破门槛时显示突破按钮，否则从场景中隐藏。 */
  private refreshBreakthroughButton(): void {
    if (!this.save) {
      return;
    }

    const canBreakthrough = this.cultivationService.canAttemptBreakthrough(this.save);
    if (this.breakthroughButtonNode) {
      this.breakthroughButtonNode.active = canBreakthrough;
    }
    this.setButtonInteractable(this.breakthroughButtonNode, canBreakthrough);
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
    this.autoAdventureAccumulator = 0;
    this.persistSave();
    this.refreshView();
  }

  /** 手动神游入口；0.5 秒内重复点击会被忽略。 */
  private handleAdventureClick(): void {
    if (!this.runtime) {
      return;
    }

    const nowMs = this.runtime.clock.nowMs();
    const cooldownMs = RESOURCE_RULES.adventureManualCooldownSeconds * 1000;
    if (nowMs - this.lastManualAdventureAtMs < cooldownMs) {
      return;
    }

    this.lastManualAdventureAtMs = nowMs;
    this.executeAdventure(false);
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

  /** 打开设置面板并刷新开关状态。 */
  private handleSettingsClick(): void {
    if (this.settingsPanelNode) {
      this.settingsPanelNode.active = true;
    }
    this.refreshSettingsPanel();
  }

  /** 关闭属性面板。 */
  private handleAttributeClose(): void {
    if (this.attributePanelNode) {
      this.attributePanelNode.active = false;
    }
  }

  /** 关闭设置面板。 */
  private handleSettingsClose(): void {
    if (this.settingsPanelNode) {
      this.settingsPanelNode.active = false;
    }
  }

  /** 左上角头像打开属性面板。 */
  private handleAttributeClick(): void {
    if (this.attributePanelNode) {
      this.attributePanelNode.active = true;
    }
    this.refreshAttributePanel();
  }

  /** 切换音乐开关。 */
  private handleMusicToggle(): void {
    if (!this.save) {
      return;
    }
    this.save.settings.musicEnabled = !(this.save.settings.musicEnabled ?? true);
    this.persistSave();
    this.refreshSettingsPanel();
  }

  /** 切换音效开关。 */
  private handleSoundToggle(): void {
    if (!this.save) {
      return;
    }
    this.save.settings.soundEnabled = !(this.save.settings.soundEnabled ?? true);
    this.persistSave();
    this.refreshSettingsPanel();
  }

  /** 删档重玩需要二次确认，当前阶段只提示，不直接删除。 */
  private handleDeleteSave(): void {
    this.setAdventureMessage("删档重玩需二次确认");
    this.refreshView();
  }

  /** 刷新属性面板数值。 */
  private refreshAttributePanel(): void {
    if (!this.save) {
      return;
    }

    const power = getPlayerPower(this.save.realm.realmId, this.save.talents);
    const attack = getBasicAttackPerSecond(this.save.realm.realmId, this.save.profession, this.save.talents);
    this.setLabel(this.battlePowerValueNode, `${Math.round(power)}`);
    this.setLabel(this.attackValueNode, `${Math.round(attack)}`);
    this.setLabel(this.defenseValueNode, "0");
    this.setLabel(this.foundationValueNode, `${this.save.talents.spiritRoot}`);
    this.setLabel(this.physiqueValueNode, `${this.save.talents.physique}`);
    this.setLabel(this.luckValueNode, `${this.save.talents.luck}`);
    this.setLabel(this.swordIntentValueNode, "0");
    this.setLabel(this.spearIntentValueNode, "0");
    this.setLabel(this.bladeIntentValueNode, "0");
    this.setLabel(this.mindValueNode, `${this.save.talents.mind}`);
  }

  /** 刷新设置面板的开关显示。 */
  private refreshSettingsPanel(): void {
    if (!this.save) {
      return;
    }

    const musicEnabled = this.save.settings.musicEnabled ?? true;
    const soundEnabled = this.save.settings.soundEnabled ?? true;
    if (this.musicOnNode) {
      this.musicOnNode.active = musicEnabled;
    }
    if (this.musicOffNode) {
      this.musicOffNode.active = !musicEnabled;
    }
    if (this.soundOnNode) {
      this.soundOnNode.active = soundEnabled;
    }
    if (this.soundOffNode) {
      this.soundOffNode.active = !soundEnabled;
    }
  }

  /** 自动神游计时；开启时每 2 秒尝试执行一次。 */
  private updateAutoAdventure(elapsedSeconds: number): void {
    if (!this.save?.settings.autoAdventureEnabled) {
      this.autoAdventureAccumulator = 0;
      return;
    }

    this.autoAdventureAccumulator += elapsedSeconds;
    if (this.autoAdventureAccumulator < RESOURCE_RULES.adventureAutoIntervalSeconds) {
      return;
    }

    this.autoAdventureAccumulator = 0;
    this.executeAdventure(true);
  }

  /** 执行一次神游并刷新结果提示。 */
  private executeAdventure(automatic: boolean): void {
    if (!this.save || !this.runtime || !this.saveService) {
      return;
    }

    const result = this.adventureService.runAdventure(
      this.save,
      this.runtime.random,
      this.runtime.clock.nowMs(),
    );
    if (!result) {
      this.setAdventureMessage("神游石不足");
      this.refreshView();
      return;
    }

    this.save = result.save;
    this.setAdventureMessage(this.formatAdventureOutcome(result));
    this.saveService.save(this.save);
    this.refreshView();
    console.info(
      automatic ? "[CultivationController] 自动神游" : "[CultivationController] 手动神游",
      this.adventureMessage,
    );
  }

  /** 将神游结果格式化为一行短提示。 */
  private formatAdventureOutcome(outcome: AdventureOutcome): string {
    const rewards: string[] = [];
    if (outcome.cultivationGained > 0) {
      rewards.push(`修为 +${outcome.cultivationGained}`);
    }
    if (outcome.spiritStonesGained > 0) {
      rewards.push(`灵石 +${outcome.spiritStonesGained}`);
    }

    const rewardText = rewards.length > 0 ? rewards.join("，") : "未获得奖励";
    return `${outcome.title}：${rewardText}，神游石 ${outcome.adventureStonesRemaining}`;
  }

  /** 设置短时神游结果提示并播放弹出淡出动画。 */
  private setAdventureMessage(message: string): void {
    this.adventureMessage = message;
    this.adventureMessageRemainingSeconds = 2.5;
    this.showGainRateLabel(message);
  }

  /** 递减神游提示持续时间。 */
  private updateAdventureMessage(elapsedSeconds: number): void {
    const previousSeconds = this.adventureMessageRemainingSeconds;
    this.adventureMessageRemainingSeconds = Math.max(
      0,
      this.adventureMessageRemainingSeconds - elapsedSeconds,
    );
    if (previousSeconds > 0 && this.adventureMessageRemainingSeconds === 0) {
      this.adventureMessage = "";
      this.hideGainRateLabel();
    }
  }

  /**
   * 在切换场景前先把当前修炼进度结算到当前时间并保存。
   *
   * 这样玩家点击其他底部入口时，不会丢失两次自动保存之间的灵力；
   * 标记前台离开后，返回修炼场景时再按在线收益补算停留时间。
   */
  private settleBeforeSceneNavigation(): void {
    if (!this.save || !this.runtime || !this.saveService) {
      return;
    }

    const nowMs = this.runtime.clock.nowMs();
    const elapsedSeconds = (nowMs - this.save.lastCalculatedAtMs) / 1000;
    if (elapsedSeconds > 0) {
      this.save = this.cultivationService.tick(this.save, elapsedSeconds, this.timeScale).save;
    }
    this.save = this.adventureService.recoverSpiritStones(this.save, nowMs);
    this.saveService.save(this.save);
    this.cultivationSessionTracker?.markForegroundAway(nowMs);
  }

  /** 统一场景导航入口：切换前先结算并保存修炼进度。 */
  private navigateToScene(sceneName: string): void {
    this.settleBeforeSceneNavigation();
    director.loadScene(sceneName);
  }

  /** 角色导航入口。 */
  private handleCharacterNavigation(): void {
    this.navigateToScene("CharacterScene");
  }

  /** 宗门导航入口。 */
  private handleSectClick(): void {
    this.navigateToScene("SectScene");
  }

  /** 商店导航入口。 */
  private handleShopClick(): void {
    this.navigateToScene("ShopScene");
  }

  /** 试炼导航入口。 */
  private handleTrialClick(): void {
    this.navigateToScene("TrialScene");
  }
}

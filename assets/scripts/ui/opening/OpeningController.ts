import {
  _decorator,
  Button,
  Component,
  director,
  Label,
  Node,
  Tween,
  tween,
  UIOpacity,
  Vec3,
} from "cc";
import type { GameRuntime } from "../../app/GameBootstrap";
import { createGameRuntime } from "../../app/GameBootstrap";
import { createInitialPlayerSave } from "../../core/model/PlayerProfile";
import { SaveService } from "../../core/save/SaveService";
import { TALENT_RULES } from "../../data/GameConfig";
import { isInitialTalentAllocationComplete } from "../../core/model/TalentRules";
import type { ProfessionId, TalentAllocation } from "../../core/types/GameTypes";

const { ccclass, property } = _decorator;

type TalentKey = keyof TalentAllocation;

/**
 * 开局流程控制器。
 *
 * 负责职业选择、天赋分配、不可逆确认、首份存档创建，以及加载修炼场景。
 * 所有视觉节点都在 Scene 中预先创建，本组件只更新状态和绑定按钮事件。
 */
@ccclass("OpeningController")
export class OpeningController extends Component {
  @property({ type: Node, tooltip: "职业选择页根节点。" })
  public professionPage: Node | null = null;

  @property({ type: Node, tooltip: "天赋分配页根节点。" })
  public talentPage: Node | null = null;

  @property({ type: Node, tooltip: "不可逆确认弹窗根节点。" })
  public confirmModal: Node | null = null;

  @property({ type: Node, tooltip: "完成页根节点。" })
  public completedPage: Node | null = null;

  @property({ type: Node, tooltip: "剑修职业卡按钮。" })
  public swordCard: Node | null = null;

  @property({ type: Node, tooltip: "枪修职业卡按钮。" })
  public spearCard: Node | null = null;

  @property({ type: Node, tooltip: "刀修职业卡按钮。" })
  public bladeCard: Node | null = null;

  @property({ type: Node, tooltip: "剑修选中边框。" })
  public swordSelectedBorder: Node | null = null;

  @property({ type: Node, tooltip: "枪修选中边框。" })
  public spearSelectedBorder: Node | null = null;

  @property({ type: Node, tooltip: "刀修选中边框。" })
  public bladeSelectedBorder: Node | null = null;

  @property({ type: Node, tooltip: "职业页继续按钮。" })
  public continueButton: Node | null = null;

  @property({ type: Node, tooltip: "天赋重置按钮。" })
  public resetButton: Node | null = null;

  @property({ type: Node, tooltip: "天赋页返回按钮。" })
  public backButton: Node | null = null;

  @property({ type: Node, tooltip: "天赋页确认按钮。" })
  public talentConfirmButton: Node | null = null;

  @property({ type: Node, tooltip: "确认弹窗取消按钮。" })
  public modalCancelButton: Node | null = null;

  @property({ type: Node, tooltip: "确认弹窗最终确认按钮。" })
  public modalConfirmButton: Node | null = null;

  @property({ type: Node, tooltip: "剩余天赋点 Label 节点。" })
  public remainingPoints: Node | null = null;

  @property({ type: Node, tooltip: "天赋点未分配完成时的提示 Label 节点。" })
  public talentWarningNode: Node | null = null;

  @property({ type: Node, tooltip: "灵根当前值 Label 节点。" })
  public spiritRootValue: Node | null = null;

  @property({ type: Node, tooltip: "体质当前值 Label 节点。" })
  public physiqueValue: Node | null = null;

  @property({ type: Node, tooltip: "运气当前值 Label 节点。" })
  public luckValue: Node | null = null;

  @property({ type: Node, tooltip: "精神当前值 Label 节点。" })
  public mindValue: Node | null = null;

  @property({ type: Node, tooltip: "灵根减号按钮。" })
  public spiritRootMinus: Node | null = null;

  @property({ type: Node, tooltip: "灵根加号按钮。" })
  public spiritRootPlus: Node | null = null;

  @property({ type: Node, tooltip: "体质减号按钮。" })
  public physiqueMinus: Node | null = null;

  @property({ type: Node, tooltip: "体质加号按钮。" })
  public physiquePlus: Node | null = null;

  @property({ type: Node, tooltip: "运气减号按钮。" })
  public luckMinus: Node | null = null;

  @property({ type: Node, tooltip: "运气加号按钮。" })
  public luckPlus: Node | null = null;

  @property({ type: Node, tooltip: "精神减号按钮。" })
  public mindMinus: Node | null = null;

  @property({ type: Node, tooltip: "精神加号按钮。" })
  public mindPlus: Node | null = null;

  private runtime: GameRuntime | null = null;
  private saveService: SaveService | null = null;
  private selectedProfession: ProfessionId = "sword";
  private readonly talents: TalentAllocation = {
    spiritRoot: 0,
    physique: 0,
    luck: 0,
    mind: 0,
  };

  protected override onLoad(): void {
    this.runtime = createGameRuntime();
    this.saveService = new SaveService(this.runtime.platform.storage);
    this.initializeOpeningState();
  }

  protected override start(): void {
    if (this.hasExistingSave()) {
      director.loadScene("CultivationScene");
    }
  }

  protected override onEnable(): void {
    this.bindButton(this.continueButton, this.handleContinue);
    this.bindButton(this.resetButton, this.handleReset);
    this.bindButton(this.backButton, this.handleBack);
    this.bindButton(this.talentConfirmButton, this.handleTalentConfirm);
    this.bindButton(this.modalCancelButton, this.handleModalCancel);
    this.bindButton(this.modalConfirmButton, this.handleModalConfirm);
    this.bindButton(this.swordCard, this.handleSwordSelect);
    this.bindButton(this.spiritRootMinus, this.handleSpiritRootMinus);
    this.bindButton(this.spiritRootPlus, this.handleSpiritRootPlus);
    this.bindButton(this.physiqueMinus, this.handlePhysiqueMinus);
    this.bindButton(this.physiquePlus, this.handlePhysiquePlus);
    this.bindButton(this.luckMinus, this.handleLuckMinus);
    this.bindButton(this.luckPlus, this.handleLuckPlus);
    this.bindButton(this.mindMinus, this.handleMindMinus);
    this.bindButton(this.mindPlus, this.handleMindPlus);
  }

  protected override onDisable(): void {
    this.unschedule(this.hideTalentWarning);
    this.stopSelectedBorderBlink();
    this.unbindButton(this.continueButton, this.handleContinue);
    this.unbindButton(this.resetButton, this.handleReset);
    this.unbindButton(this.backButton, this.handleBack);
    this.unbindButton(this.talentConfirmButton, this.handleTalentConfirm);
    this.unbindButton(this.modalCancelButton, this.handleModalCancel);
    this.unbindButton(this.modalConfirmButton, this.handleModalConfirm);
    this.unbindButton(this.swordCard, this.handleSwordSelect);
    this.unbindButton(this.spiritRootMinus, this.handleSpiritRootMinus);
    this.unbindButton(this.spiritRootPlus, this.handleSpiritRootPlus);
    this.unbindButton(this.physiqueMinus, this.handlePhysiqueMinus);
    this.unbindButton(this.physiquePlus, this.handlePhysiquePlus);
    this.unbindButton(this.luckMinus, this.handleLuckMinus);
    this.unbindButton(this.luckPlus, this.handleLuckPlus);
    this.unbindButton(this.mindMinus, this.handleMindMinus);
    this.unbindButton(this.mindPlus, this.handleMindPlus);
  }

  /** 初始化页面显示和职业锁定状态。 */
  private initializeOpeningState(): void {
    if (this.professionPage) {
      this.professionPage.active = true;
    }
    if (this.talentPage) {
      this.talentPage.active = false;
    }
    if (this.confirmModal) {
      this.confirmModal.active = false;
    }
    if (this.completedPage) {
      this.completedPage.active = false;
    }

    this.setCardInteractable(this.swordCard, true);
    this.setCardInteractable(this.spearCard, false);
    this.setCardInteractable(this.bladeCard, false);
    this.setButtonInteractable(this.continueButton, true);
    this.setButtonInteractable(this.talentConfirmButton, true);
    this.setButtonInteractable(this.modalConfirmButton, true);
    if (this.talentWarningNode) {
      this.talentWarningNode.active = false;
    }
    this.updateProfessionSelectionVisuals();
    this.refreshTalentView();
  }

  /** 判断是否已有可读取存档。 */
  private hasExistingSave(): boolean {
    if (!this.saveService) {
      return false;
    }
    try {
      return this.saveService.load() !== null;
    } catch {
      return false;
    }
  }

  /** 职业页继续进入天赋页。 */
  private handleContinue(): void {
    if (this.professionPage) {
      this.professionPage.active = false;
    }
    if (this.talentPage) {
      this.talentPage.active = true;
    }
    this.refreshTalentView();
  }

  /** 天赋重置。 */
  private handleReset(): void {
    this.talents.spiritRoot = 0;
    this.talents.physique = 0;
    this.talents.luck = 0;
    this.talents.mind = 0;
    this.refreshTalentView();
  }

  /** 返回职业页。 */
  private handleBack(): void {
    if (this.talentPage) {
      this.talentPage.active = false;
    }
    if (this.professionPage) {
      this.professionPage.active = true;
    }
  }

  /** 点击确认时校验；未完成分配则显示独立提示，不打开弹窗。 */
  private handleTalentConfirm(): void {
    if (!isInitialTalentAllocationComplete(this.talents)) {
      const remainingPoints = this.getRemainingPoints();
      this.showTalentWarning(
        remainingPoints > 0 ? "请先分配完所有属性点" : "四项属性均需至少 1 点",
      );
      return;
    }
    if (this.confirmModal) {
      this.confirmModal.active = true;
    }
  }

  /** 显示天赋分配提示，并在短时间后自动隐藏。 */
  private showTalentWarning(message: string): void {
    if (!this.talentWarningNode) {
      return;
    }
    this.setLabel(this.talentWarningNode, message);
    this.talentWarningNode.active = true;
    this.unschedule(this.hideTalentWarning);
    this.scheduleOnce(this.hideTalentWarning, 1.5);
  }

  /** 隐藏天赋分配提示。 */
  private readonly hideTalentWarning = (): void => {
    if (this.talentWarningNode) {
      this.talentWarningNode.active = false;
    }
  };

  /** 取消不可逆确认。 */
  private handleModalCancel(): void {
    if (this.confirmModal) {
      this.confirmModal.active = false;
    }
  }

  /** 最终确认：创建存档并加载修炼场景。 */
  private handleModalConfirm(): void {
    if (!this.runtime || !this.saveService || !isInitialTalentAllocationComplete(this.talents)) {
      return;
    }

    const save = createInitialPlayerSave({
      profession: this.selectedProfession,
      talents: { ...this.talents },
      nowMs: this.runtime.clock.nowMs(),
    });
    this.saveService.save(save);
    director.loadScene("CultivationScene");
  }

  /** 剑修选择；P1 其他职业不可选。 */
  private handleSwordSelect(): void {
    this.selectedProfession = "sword";
    this.updateProfessionSelectionVisuals();
  }

  /** 刷新职业卡选中边框，并只让当前选中边框持续闪烁。 */
  private updateProfessionSelectionVisuals(): void {
    this.stopSelectedBorderBlink();
    const borders = [this.swordSelectedBorder, this.spearSelectedBorder, this.bladeSelectedBorder];
    for (const border of borders) {
      if (!border) {
        continue;
      }
      border.active = border === this.swordSelectedBorder;
      border.setScale(1, 1, 1);
      const opacity = border.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 255;
      }
    }

    const selectedBorder = this.swordSelectedBorder;
    if (!selectedBorder) {
      return;
    }
    const opacity = selectedBorder.getComponent(UIOpacity);
    if (opacity) {
      tween(opacity)
        .repeatForever(
          tween(opacity)
            .to(0.45, { opacity: 90 }, { easing: "sineInOut" })
            .to(0.45, { opacity: 255 }, { easing: "sineInOut" }),
        )
        .start();
    }
    tween(selectedBorder)
      .repeatForever(
        tween(selectedBorder)
          .to(0.45, { scale: new Vec3(1.035, 1.035, 1) }, { easing: "sineInOut" })
          .to(0.45, { scale: new Vec3(1, 1, 1) }, { easing: "sineInOut" }),
      )
      .start();
  }

  /** 停止所有职业卡选中边框动画。 */
  private stopSelectedBorderBlink(): void {
    for (const border of [this.swordSelectedBorder, this.spearSelectedBorder, this.bladeSelectedBorder]) {
      if (!border) {
        continue;
      }
      Tween.stopAllByTarget(border);
      const opacity = border.getComponent(UIOpacity);
      if (opacity) {
        Tween.stopAllByTarget(opacity);
      }
    }
  }

  private handleSpiritRootMinus = (): void => this.changeTalent("spiritRoot", -1);
  private handleSpiritRootPlus = (): void => this.changeTalent("spiritRoot", 1);
  private handlePhysiqueMinus = (): void => this.changeTalent("physique", -1);
  private handlePhysiquePlus = (): void => this.changeTalent("physique", 1);
  private handleLuckMinus = (): void => this.changeTalent("luck", -1);
  private handleLuckPlus = (): void => this.changeTalent("luck", 1);
  private handleMindMinus = (): void => this.changeTalent("mind", -1);
  private handleMindPlus = (): void => this.changeTalent("mind", 1);

  /** 修改单项天赋，确保剩余点数和单点上限合法。 */
  private changeTalent(key: TalentKey, delta: number): void {
    const current = this.talents[key];
    const remaining = this.getRemainingPoints();
    if (delta > 0 && (remaining <= 0 || current >= TALENT_RULES.maximumPerTalent)) {
      return;
    }
    if (delta < 0 && current <= 0) {
      return;
    }

    this.talents[key] = current + delta;
    this.refreshTalentView();
  }

  /** 剩余可分配点数。 */
  private getRemainingPoints(): number {
    const used =
      this.talents.spiritRoot +
      this.talents.physique +
      this.talents.luck +
      this.talents.mind;
    return TALENT_RULES.initialPoints - used;
  }

  /** 刷新四项天赋值、提示文案和加减/确认按钮状态。 */
  private refreshTalentView(): void {
    const remainingPoints = this.getRemainingPoints();
    this.setLabel(this.remainingPoints, `剩余 ${remainingPoints} 点`);
    this.setButtonInteractable(this.talentConfirmButton, true);
    this.setLabel(this.spiritRootValue, this.talents.spiritRoot.toString());
    this.setLabel(this.physiqueValue, this.talents.physique.toString());
    this.setLabel(this.luckValue, this.talents.luck.toString());
    this.setLabel(this.mindValue, this.talents.mind.toString());

    const hasRemaining = remainingPoints > 0;
    this.setButtonInteractable(this.spiritRootMinus, this.talents.spiritRoot > 0);
    this.setButtonInteractable(this.spiritRootPlus, hasRemaining && this.talents.spiritRoot < TALENT_RULES.maximumPerTalent);
    this.setButtonInteractable(this.physiqueMinus, this.talents.physique > 0);
    this.setButtonInteractable(this.physiquePlus, hasRemaining && this.talents.physique < TALENT_RULES.maximumPerTalent);
    this.setButtonInteractable(this.luckMinus, this.talents.luck > 0);
    this.setButtonInteractable(this.luckPlus, hasRemaining && this.talents.luck < TALENT_RULES.maximumPerTalent);
    this.setButtonInteractable(this.mindMinus, this.talents.mind > 0);
    this.setButtonInteractable(this.mindPlus, hasRemaining && this.talents.mind < TALENT_RULES.maximumPerTalent);
    this.setButtonInteractable(this.talentConfirmButton, true);
  }

  private setCardInteractable(node: Node | null, interactable: boolean): void {
    const button = node?.getComponent(Button) ?? null;
    if (button) {
      button.interactable = interactable;
    }
  }

  private setButtonInteractable(node: Node | null, interactable: boolean): void {
    const button = node?.getComponent(Button) ?? null;
    if (button) {
      button.interactable = interactable;
    }
  }

  private setLabel(node: Node | null, text: string): void {
    const label = node?.getComponent(Label) ?? null;
    if (label) {
      label.string = text;
    }
  }

  private bindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.on(Button.EventType.CLICK, handler, this);
  }

  private unbindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.off(Button.EventType.CLICK, handler, this);
  }
}

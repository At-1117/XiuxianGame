import { _decorator, Component, Node } from "cc";
import { createGameRuntime } from "../../app/GameBootstrap";
import { CultivationService } from "../../core/cultivation/CultivationService";
import { CultivationSessionTracker } from "../../core/cultivation/CultivationSessionTracker";
import { SaveService } from "../../core/save/SaveService";
import type { ProfessionId } from "../../core/types/GameTypes";

const { ccclass, property } = _decorator;

/**
 * 角色面板控制器。
 *
 * 角色面板中的三个职业立绘节点全部预先放在 Scene 中，本组件只根据存档中的职业，
 * 控制三个立绘节点的 active 状态。它不创建任何 Sprite、Label 或 Button。
 */
@ccclass("CharacterPanelController")
export class CharacterPanelController extends Component {
  @property({ type: Node, tooltip: "剑修立绘节点。" })
  public swordPortraitNode: Node | null = null;

  @property({ type: Node, tooltip: "枪修立绘节点。" })
  public spearPortraitNode: Node | null = null;

  @property({ type: Node, tooltip: "刀修立绘节点。" })
  public bladePortraitNode: Node | null = null;

  private readonly cultivationService = new CultivationService();
  private runtime: ReturnType<typeof createGameRuntime> | null = null;
  private saveService: SaveService | null = null;
  private cultivationSessionTracker: CultivationSessionTracker | null = null;
  private unsubscribeLifecycle: (() => void) | null = null;

  protected override onLoad(): void {
    const runtime = createGameRuntime();
    this.runtime = runtime;
    this.saveService = new SaveService(runtime.platform.storage);
    this.cultivationSessionTracker = new CultivationSessionTracker(runtime.platform.storage);
    this.unsubscribeLifecycle = runtime.platform.subscribeLifecycle({
      onShow: () => undefined,
      onHide: () => this.settleForegroundAwayOnHide(),
    });
    this.refreshProfessionPortrait();
  }

  protected override onDestroy(): void {
    this.unsubscribeLifecycle?.();
    this.unsubscribeLifecycle = null;
  }

  /**
   * 读取当前存档职业并切换立绘。
   *
   * 没有存档或读取失败时回退到剑修，保证开发预览中仍能看到一个有效立绘。
   */
  private refreshProfessionPortrait(): void {
    let profession: ProfessionId = "sword";

    try {
      const save = this.saveService?.load() ?? null;
      if (save) {
        profession = save.profession;
      }
    } catch (error) {
      console.warn("[CharacterPanelController] 读取职业立绘失败，回退为剑修。", error);
    }

    this.setNodeActive(this.swordPortraitNode, profession === "sword");
    this.setNodeActive(this.spearPortraitNode, profession === "spear");
    this.setNodeActive(this.bladePortraitNode, profession === "blade");
  }

  /**
   * 应用进入后台时，把角色面板停留期间已经经过的前台时间先结算。
   *
   * 清除前台标记后，后续后台时间会由修炼场景按离线收益结算，避免重复计算。
   */
  private settleForegroundAwayOnHide(): void {
    if (!this.runtime || !this.saveService || !this.cultivationSessionTracker) {
      return;
    }

    const foregroundAwayStartedAtMs =
      this.cultivationSessionTracker.readForegroundAwayStartedAtMs();
    if (foregroundAwayStartedAtMs === null) {
      return;
    }

    const save = this.saveService.load();
    if (!save) {
      this.cultivationSessionTracker.clearForegroundAway();
      return;
    }

    const nowMs = this.runtime.clock.nowMs();
    const elapsedSeconds = (nowMs - save.lastCalculatedAtMs) / 1000;
    const result =
      elapsedSeconds > 0 ? this.cultivationService.tick(save, elapsedSeconds, 1) : null;
    this.saveService.save(result?.save ?? save);
    this.cultivationSessionTracker.clearForegroundAway();
  }

  /** 安全设置节点显隐；未绑定节点时直接跳过。 */
  private setNodeActive(node: Node | null, active: boolean): void {
    if (node) {
      node.active = active;
    }
  }
}

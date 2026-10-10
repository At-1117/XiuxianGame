import { _decorator, Component, EventTouch, input, Input, Label, Node } from "cc";

const { ccclass, property } = _decorator;

@ccclass("ShopPageController")
export class ShopPageController extends Component {
  @property({ type: Node, tooltip: "第一页商品容器。" })
  public pageOneNode: Node | null = null;

  @property({ type: Node, tooltip: "第二页商品容器。" })
  public pageTwoNode: Node | null = null;

  @property({ type: Node, tooltip: "页码指示 Label 节点。" })
  public pageIndicatorNode: Node | null = null;

  private pageIndex = 0;
  private touchStartY = 0;

  protected override onEnable(): void {
    input.on(Input.EventType.TOUCH_START, this.handleTouchStart, this);
    input.on(Input.EventType.TOUCH_END, this.handleTouchEnd, this);
  }

  protected override onDisable(): void {
    input.off(Input.EventType.TOUCH_START, this.handleTouchStart, this);
    input.off(Input.EventType.TOUCH_END, this.handleTouchEnd, this);
  }

  private handleTouchStart(event: EventTouch): void {
    this.touchStartY = event.getUILocation().y;
  }

  private handleTouchEnd(event: EventTouch): void {
    const deltaY = this.touchStartY - event.getUILocation().y;
    if (Math.abs(deltaY) < 60) {
      return;
    }
    this.showPage(this.pageIndex + (deltaY > 0 ? 1 : -1));
  }

  private showPage(index: number): void {
    const pageCount = 2;
    const nextIndex = Math.min(pageCount - 1, Math.max(0, index));
    if (nextIndex === this.pageIndex) {
      return;
    }
    this.pageIndex = nextIndex;
    if (this.pageOneNode) {
      this.pageOneNode.active = nextIndex === 0;
    }
    if (this.pageTwoNode) {
      this.pageTwoNode.active = nextIndex === 1;
    }
    const indicatorLabel = this.pageIndicatorNode?.getComponent(Label) ?? null;
    if (indicatorLabel) {
      indicatorLabel.string = `${nextIndex + 1} / ${pageCount}`;
    }
  }
}

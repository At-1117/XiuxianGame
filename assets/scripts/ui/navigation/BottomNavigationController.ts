import { _decorator, Button, Component, director, Node } from "cc";

const { ccclass, property } = _decorator;

/**
 * 底部导航控制器。
 *
 * 四个主面板 Scene 共用该组件；它只负责按钮注册和场景切换，
 * 不创建任何视觉节点。
 */
@ccclass("BottomNavigationController")
export class BottomNavigationController extends Component {
  @property({ type: Node })
  public navCharacterButton: Node | null = null;

  @property({ type: Node })
  public navSectButton: Node | null = null;

  @property({ type: Node })
  public navCultivationButton: Node | null = null;

  @property({ type: Node })
  public navShopButton: Node | null = null;

  @property({ type: Node })
  public navTrialButton: Node | null = null;

  protected override onEnable(): void {
    this.bindButton(this.navCharacterButton, this.handleCharacter);
    this.bindButton(this.navSectButton, this.handleSect);
    this.bindButton(this.navCultivationButton, this.handleCultivation);
    this.bindButton(this.navShopButton, this.handleShop);
    this.bindButton(this.navTrialButton, this.handleTrial);
  }

  protected override onDisable(): void {
    this.unbindButton(this.navCharacterButton, this.handleCharacter);
    this.unbindButton(this.navSectButton, this.handleSect);
    this.unbindButton(this.navCultivationButton, this.handleCultivation);
    this.unbindButton(this.navShopButton, this.handleShop);
    this.unbindButton(this.navTrialButton, this.handleTrial);
  }

  private readonly handleCharacter = (): void => {
    director.loadScene("CharacterScene");
  };
  private readonly handleSect = (): void => {
    director.loadScene("SectScene");
  };
  private readonly handleCultivation = (): void => {
    director.loadScene("CultivationScene");
  };
  private readonly handleShop = (): void => {
    director.loadScene("ShopScene");
  };
  private readonly handleTrial = (): void => {
    director.loadScene("TrialScene");
  };

  private bindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.on(Button.EventType.CLICK, handler, this);
  }

  private unbindButton(node: Node | null, handler: () => void): void {
    const button = node?.getComponent(Button) ?? null;
    button?.node.off(Button.EventType.CLICK, handler, this);
  }

}

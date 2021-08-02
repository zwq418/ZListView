// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ZListItem from "./ZListItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ZListItemRedpack extends ZListItem{

    @property(cc.Sprite)
    avatarSprite:cc.Sprite = null;

    @property(cc.Label)
    nameLabel: cc.Label = null;

    @property(cc.Label)
    messageLabel: cc.Label = null;

    set data(value) {
        super.data = value;
        const { id, avatar } = value;
        this.loadAvatar(avatar);
        this.nameLabel.string = `用户${id}`;
        this.messageLabel.string = `我已经累计提现${id}元你也快来试试吧`;
    }

    private loadAvatar(url) {
        cc.assetManager.loadRemote(url, { ext: '.png' }, (err, texture:cc.Texture2D) => {
            if (err) return;
            texture.packable = false;
            this.avatarSprite.spriteFrame = new cc.SpriteFrame(texture);
            if (texture.width && texture.height) {
                this.avatarSprite.node.width = texture.width;
                this.avatarSprite.node.height = texture.height;
            }
        });
    }
}

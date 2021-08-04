// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class ZListItem extends cc.Component {

    @property
    _itemData: any = null;
    get itemData() {
        return this._itemData;
    }
    set itemData(value) {
        this._itemData = value;
    }

    @property
    index: number;

    @property
    listData: any[];

    public renderData(itemData: any, index: number, listData: any[]) {
        this.listData = listData;
        this.index = index;
        this.itemData = itemData;
    }
}

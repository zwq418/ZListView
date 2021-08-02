import ZListItem from "./ZListItem";

const {ccclass, property} = cc._decorator;

let lastTouchTime;
let lastSpeed;
let isTouch = false;
let isScrolling = false;
let topToBottom = true;
let getTimeInMilliseconds = function() {
    let currentTime = new Date();
    return currentTime.getMilliseconds();
};

@ccclass
export default class ZListView extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property([cc.Prefab])
    itemPrefabs: cc.Prefab[] = [];

    @property([cc.Node])
    _itemNodes: cc.Node[][] = [];

    @property([cc.Node])
    _listNodes: cc.Node[] = [];

    @property
    listData: any[] = [];

    @property
    listKey = 'id';

    @property
    _contentHeight = 0;

    @property
    _scrollToTop = false;

    @property
    _scrollToBottom = false;

    public scrollToTop() {
        this._scrollToTop = true;
    }

    public scrollToBottom() {
        this._scrollToBottom = true;
    }

    public notifyDataChanged() {
        this._listNodes[0]
    }

    onLoad () {
        this._contentHeight = this.node.height;
        this.preloadItems();
        this.layoutItems();
    }

    preloadItems() {
        for (let i = 0; i < this.itemPrefabs.length; i++) {
            this._itemNodes[i] = [];
            let itemsHeight = 0;
            for (let j = 0; j < 10; j++) {
                const node = cc.instantiate(this.itemPrefabs[i]);
                this.node.addChild(node);
                this.pushNode(i, node);
                itemsHeight += node.height;
                if (itemsHeight >= this._contentHeight) {
                    // break;
                }
            }
        }
    }

    layoutItems() {
        if (topToBottom) {
            this.layoutItemTopToBottom();
        } else {
            this.scheduleOnce(() => {
                this._contentHeight = this.node.height;
                this.layoutItemBottomToTop();
            })
        }
    }

    layoutItemTopToBottom() {
        let lastNode;
        for (let i = 0; i < this.listData.length; i++) {
            const node = this.popNode(this.listData[i]);
            const nodeOffset = node.height * (1- node.anchorY);
            const y = lastNode ? lastNode.y - lastNode.height * lastNode.anchorY - nodeOffset
            : this._contentHeight * (1- this.node.anchorY) - nodeOffset;
            const nodeTop = -(y + node.height * (1 - node.anchorY));
            if (nodeTop <= this._contentHeight) {
                node.y = y;
                this._listNodes.push(node);
                lastNode = node;
            }
            const nodeBottom = -(y - node.height * node.anchorY);
            if (nodeBottom > this._contentHeight) {
                break;
            }
        }
    }

    layoutItemBottomToTop() {
        let lastNode;
        for (let i = this.listData.length - 1; i >= 0; i--) {
            const node = this.popNode(this.listData[i]);
            const nodeOffset = node.height * node.anchorY;
            const y = lastNode ? lastNode.y + lastNode.height * (1 - lastNode.anchorY) + nodeOffset
            : -this._contentHeight * this.node.anchorY + nodeOffset;
            const nodeBottom = -(y - node.height * node.anchorY);
            if (nodeBottom >= 0) {
                node.y = y;
                this._listNodes.push(node);
                lastNode = node;
            }
            const nodeTop = -(y + node.height * (1 - node.anchorY));
            if (nodeTop < 0) {
                break;
            }
        }
    }

    start () {
    }

    update (dt) {
        if (!isTouch) {
            if (isScrolling) {
                if (Math.abs(lastSpeed) > 0.1) {
                    this.scrollChildren(dt * lastSpeed * 1000);
                    lastSpeed *= (1 - 5 *dt);
                } else {
                    isScrolling = false;
                    lastSpeed = 0;
                }
            }
        }
        if (this._scrollToTop) {
            this.scrollChildren(dt * -5 * 1000);
        }
        if (this._scrollToBottom) {
            this.scrollChildren(dt * 5 * 1000);
        }
    }

    onEnable() {
        this.registerEvent();
    }

    onDisable() {
        this.unregisterEvent();
    }

    registerEvent () {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this, true);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this, true);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this, true);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancelled, this, true);
    }

    unregisterEvent () {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this, true);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this, true);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this, true);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancelled, this, true);
    }

    // touch event handler
    _onTouchBegan (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        lastTouchTime = getTimeInMilliseconds();
        isTouch = true;
    }

    _onTouchMoved (event, captureListeners) {
        if (!this.enabledInHierarchy) return;

        let touch = event.touch;
        const deltaY = touch.getDelta().y;
        this.scrollChildren(deltaY);
        const touchTime = getTimeInMilliseconds();
        lastSpeed = deltaY / (touchTime - lastTouchTime);
        lastSpeed = lastSpeed > 25 ? 25 : lastSpeed < -25 ? -25 : lastSpeed;
        lastTouchTime = getTimeInMilliseconds();
        isScrolling = true;
    }

    _onTouchEnded (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        isTouch = false;
    }

    _onTouchCancelled (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        isTouch = false;
        isScrolling = false;
    }

    scrollChildren (deltaY) {
        const contentHeight = this.node.height;
        if (deltaY < 0) {
            const firstNode = this._listNodes[0];
            // todo topToBottom
            if (firstNode.dataKey === this.listData[0][this.listKey]) {
                const firstNodeTop = this.nodeTop(firstNode);
                if (firstNodeTop + deltaY < 0) {
                    deltaY = -firstNodeTop;
                }
            }
        } else {
            const lastNode = this._listNodes[this._listNodes.length - 1];
            if (lastNode.dataKey === this.listData[this.listData.length - 1][this.listKey]) {
                const lastNodeBottom = this.nodeBottom(lastNode);
                if (lastNodeBottom + deltaY > -contentHeight) {
                    deltaY = -lastNodeBottom - contentHeight;
                }
            }
        }
        if (deltaY === 0) {
            this._scrollToTop = false;
            this._scrollToBottom = false;
            return;
        };
        for (let i = 0; i < this._listNodes.length; i++) {
            this._listNodes[i].y += deltaY;
        }
        const keepNodes = [];
        for (let i = 0; i < this._listNodes.length; i++) {
            const node = this._listNodes[i];
            const nodeTop = this.nodeTop(node);
            const nodeBottom = this.nodeBottom(node);
            const { dataKey, dataType } = node;
            if (i === 0) {
                if (topToBottom) {
                    if (nodeTop < 0) {
                        const index = this.listData.findIndex(item => item[this.listKey] === dataKey);
                        if (index > 0) {
                            const itemData = this.listData[index - 1];
                            const addNode = this.popNode(itemData);
                            addNode.y = node.y + node.height * (1 - node.anchorY) + addNode.height * addNode.anchorY;
                            keepNodes.push(addNode);
                        }
                    }
                } else {
                    if (nodeBottom > -this._contentHeight) {
                        const index = this.listData.findIndex(item => item[this.listKey] === dataKey);
                        if (index > 0) {
                            const itemData = this.listData[index - 1];
                            const addNode = this.popNode(itemData);
                            addNode.y = node.y - node.height * node.anchorY - addNode.height * (1 - addNode.anchorY);
                            keepNodes.push(addNode);
                        }
                    }
                }
            }
            if (nodeBottom <= 0 && nodeTop >= -contentHeight ) {
                keepNodes.push(node);
            } else {
                this.pushNode(dataType, node);
            }
            // topToBottom
            if (i === this._listNodes.length - 1 && nodeBottom > -contentHeight) {
                const index = this.listData.findIndex(item => item[this.listKey] === dataKey);
                if (index < this.listData.length - 1) {
                    const itemData = this.listData[index + 1];
                    const addNode = this.popNode(itemData);
                    addNode.y = node.y - node.height * node.anchorY - addNode.height * (1 - addNode.anchorY);
                    keepNodes.push(addNode);
                }
            }
        }
        this._listNodes = keepNodes;

    }

    nodeTop(node) {
        return node.y + node.height * (1 - node.anchorY);
    }

    nodeBottom(node) {
        return node.y - node.height * node.anchorY;
    }

    pushNode(type, node) {
        node.x = 1000;
        node.opacity = 0;
        node.dataType = type;
        this._itemNodes[type].push(node);
    }

    popNode(itemData) {
        const node = this._itemNodes[itemData.type].pop();
        node.x = 0;
        node.opacity = 255;
        node.dataKey = itemData[this.listKey];
        node.getComponent(ZListItem).data = itemData;
        return node;
    }
}

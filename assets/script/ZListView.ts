import ZListItem from "./ZListItem";

const {ccclass, property} = cc._decorator;

let lastTouchTime = 0;
let lastSpeed = 0;
let isTouch = false;
let isScrolling = false;
let scrollId;
let scrollDirection = 0;
let getTimeInMilliseconds = function() {
    let currentTime = new Date();
    return currentTime.getMilliseconds();
};

@ccclass
export default class ZListView extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property([cc.Prefab])
    itemPrefabs: cc.Prefab[] = [];

    @property
    spacing = 0;

    @property
    topToBottom = true

    @property
    listData: any[] = [];

    @property
    listKey = 'id';

    @property
    listType = 'type'

    @property([cc.Node])
    _itemNodes: cc.Node[][] = [];

    @property([cc.Node])
    _listNodes: cc.Node[] = [];

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

    public scrollToIndex(id) {
        const firstId = this._listNodes[0].dataKey;
        const lastId = this._listNodes[this._listNodes.length - 1].dataKey;
        if (this.topToBottom) {
            if (id < firstId) {
                scrollDirection = -10;
            } else if (id > lastId) {
                scrollDirection = 10;
            } else {
                scrollDirection = -10;
            }
        } else {
            if (id < firstId) {
                scrollDirection = 10;
            } else if (id > lastId) {
                scrollDirection = -10;
            } else {
                scrollDirection = 10;
            }
        }
        scrollId = id;
    }

    hasScrollId() {
        return typeof scrollId != 'undefined';
    }

    public notifyDataChanged() {
        for (let i = this._listNodes.length - 1; i >= 0; i--) {
            this.pushNode(this._listNodes[i]);
        }
        const firstNode = this._listNodes[0];
        this._listNodes = [];
        let lastIndex = this.listData.findIndex(item => item[this.listKey] === firstNode.dataKey);
        let lastY = this.topToBottom ? this.nodeTop(firstNode) : this.nodeBottom(firstNode);
        this.layoutItems(lastIndex, lastY);
    }

    onLoad () {
        this._contentHeight = this.node.height;
        this.preloadItems();
        this.layoutItems(0, this.topToBottom ? 0 : -this._contentHeight);
    }

    preloadItems() {
        for (let i = 0; i < this.itemPrefabs.length; i++) {
            this._itemNodes[i] = [];
            let itemsHeight = 0;
            for (let j = 0; j < 20; j++) {
                const node = cc.instantiate(this.itemPrefabs[i]);
                this.node.addChild(node);
                this.pushNode(node, i);
                itemsHeight += node.height;
                if (itemsHeight >= this._contentHeight + 2 * node.height) {
                    break;
                }
            }
        }
    }

    layoutItem(index, y) {
        const node = this.popNode(this.listData[index]);
        if (this.topToBottom) {
            node.y = y - node.height * (1 - node.anchorY);
        } else {
            node.y = y + node.height * node.anchorY;
        }
        this._listNodes.push(node);
        return node;
    }

    layoutItems(lastIndex, lastY) {
        let currentNode;
        do {
            currentNode = this.layoutItem(lastIndex, lastY);
            lastIndex += 1;
            lastY = this.topToBottom ? this.nodeBottom(currentNode) : this.nodeTop(currentNode);
            lastY += this.topToBottom ? -this.spacing : this.spacing;
        } while ((this.topToBottom
            ? lastY > -this._contentHeight
            : lastY < 0) && lastIndex < this.listData.length)
    }

    start () {
    }

    update (dt) {
        if (!isTouch && isScrolling) {
            if (Math.abs(lastSpeed) > 0.1) {
                lastSpeed *= (1 - 5 *dt);
            } else {
                isScrolling = false;
                lastSpeed = 0;
            }
            this.scrollChildren(dt * lastSpeed * 1000);
        } else if (this._scrollToTop) {
            this.scrollChildren(dt * -10 * 1000);
        } else if (this._scrollToBottom) {
            this.scrollChildren(dt * 10 * 1000);
        } else if (this.hasScrollId()) {
            this.scrollChildren(dt * scrollDirection * 1000);
        } else {
            this.scrollChildren(0);
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
        lastSpeed = lastSpeed > 50 ? 50 : lastSpeed < -50 ? -50 : lastSpeed;
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
            const firstNode = this._listNodes[this.topToBottom ? 0 : this._listNodes.length - 1];
            const overflow = firstNode.dataKey === this.listData[this.topToBottom ? 0 : this.listData.length - 1][this.listKey];
            const reachId = this.hasScrollId && firstNode.dataKey === scrollId;
            if (overflow || reachId) {
                const firstNodeTop = this.nodeTop(firstNode);
                if (firstNodeTop + deltaY < 0) {
                    deltaY = -firstNodeTop;
                }
                if (reachId) {
                    scrollId = undefined;
                }
            }
        } else if (deltaY > 0) {
            const lastNode = this._listNodes[this.topToBottom ? this._listNodes.length - 1 : 0];
            const overflow = lastNode.dataKey === this.listData[this.topToBottom ? this.listData.length - 1 : 0][this.listKey];
            const reachId = this.hasScrollId && lastNode.dataKey === scrollId;
            if (overflow || reachId) {
                const lastNodeBottom = this.nodeBottom(lastNode);
                if (lastNodeBottom + deltaY > -contentHeight) {
                    deltaY = -lastNodeBottom - contentHeight;
                }
                if (reachId) {
                    scrollId = undefined;
                }
            }
        }
        if (deltaY === 0) {
            this._scrollToTop = false;
            this._scrollToBottom = false;
            // return;
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
                if (this.topToBottom) {
                    if (nodeTop < 0) {
                        const addNode = this.addNode(dataKey, node.y + node.height * (1 - node.anchorY), true);
                        addNode && keepNodes.push(addNode);
                    }
                } else {
                    if (nodeBottom > -this._contentHeight) {
                        const addNode = this.addNode(dataKey, node.y - node.height * node.anchorY, true);
                        addNode && keepNodes.push(addNode);
                    }
                }
            }
            if (nodeBottom <= 0 && nodeTop >= -contentHeight ) {
                keepNodes.push(node);
            } else {
                this.pushNode(node);
            }
            if (i === this._listNodes.length - 1) {
                if (this.topToBottom) {
                    if (nodeBottom > -contentHeight) {
                        const addNode = this.addNode(dataKey, node.y - node.height * node.anchorY, false);
                        addNode && keepNodes.push(addNode);
                    }
                } else {
                    if (nodeTop < 0) {
                        const addNode = this.addNode(dataKey, node.y + node.height * (1 - node.anchorY), false);
                        addNode && keepNodes.push(addNode);
                    }
                }
            }
        }
        this._listNodes = keepNodes;

    }

    addNode(dataKey, lastY, isFirst) {
        const index = this.listData.findIndex(item => item[this.listKey] === dataKey);
        if (isFirst ? index > 0 : index < this.listData.length - 1) {
            const itemData = this.listData[isFirst ? index - 1 : index + 1];
            const addNode = this.popNode(itemData);
            if (isFirst) {
                if (this.topToBottom) {
                    addNode.y = lastY + this.spacing + addNode.height * addNode.anchorY;
                } else {
                    addNode.y = lastY - this.spacing - addNode.height * (1 - addNode.anchorY);
                }
            } else {
                if (this.topToBottom) {
                    addNode.y = lastY - this.spacing - addNode.height * (1 - addNode.anchorY);
                } else {
                    addNode.y = lastY + this.spacing + addNode.height * addNode.anchorY;
                }
            }
            return addNode;
        }
    }

    nodeTop(node) {
        return node.y + node.height * (1 - node.anchorY);
    }

    nodeBottom(node) {
        return node.y - node.height * node.anchorY;
    }

    pushNode(node: cc.Node, type?) {
        node.x = 1000;
        node.opacity = 0;
        if (typeof node.dataType === 'undefined') {
            if (typeof type === 'undefined') {
                throw new Error('没有设置节点type');
            }
            node.dataType = type;
        }
        this._itemNodes[node.dataType].push(node);
        // console.log('pushNode:', node.dataType, this._itemNodes[node.dataType].length);
    }

    popNode(itemData) {
        const node = this._itemNodes[itemData[this.listType]].pop();
        node.x = 0;
        node.opacity = 255;
        node.dataKey = itemData[this.listKey];
        node.getComponent(ZListItem).data = itemData;
        // console.log('popNode:', node.dataType, this._itemNodes[node.dataType].length);
        return node;
    }
}

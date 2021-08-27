import ZListItem from "./ZListItem";

const {ccclass, property} = cc._decorator;

const MAX_SPEED = 20;
let lastTouchTime = 0;
let lastSpeed = 0;
let isTouch = false;
let isScrolling = false;
let scrollId;
let scrollDirection = 0;

@ccclass
export default class ZListView extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property({
        type: [cc.Prefab],
        tooltip: '不同样式的item',
        visible: true,
    })
    itemPrefabs: cc.Prefab[] = [];

    @property({
        type: cc.Integer,
        tooltip: '间距',
        visible: true,
    })
    spacing = 0;

    @property({
        type: cc.Boolean,
        tooltip: '从队首开始排版/从队尾开始排版',
        visible: true,
    })
    topToBottom = true

    @property({
        type: [cc.Object],
        tooltip: '列表数据',
        visible: true,
    })
    listData: any[] = [];

    @property({
        type: cc.String,
        tooltip: '列表数据唯一标识的参数名',
        visible: true,
    })
    listKey = 'id';

    @property({
        type: cc.String,
        tooltip: '列表数据组件类型的参数名',
        visible: true,
    })
    listType = 'type'

    @property([cc.Node])
    _itemNodes: cc.Node[][] = [];

    @property([cc.Node])
    _listNodes: cc.Node[] = [];

    public scrollToTop() {
        if (this.listData.length === 0) return;
        this.scrollToId(this.listData[0][this.listKey]);
    }

    public scrollToBottom() {
        if (this.listData.length === 0) return;
        this.scrollToId(this.listData[this.listData.length - 1][this.listKey]);
    }

    public scrollToId(id) {
        if (this.listData.length === 0 || this._listNodes.length === 0) return;
        const targetIndex = this.listData.findIndex(item => item[this.listKey] == id);
        const currentIndex = this.listData.findIndex(item => item[this.listKey] == this._listNodes[Math.floor(this._listNodes.length / 2)].name);
        if (targetIndex != currentIndex) {
            const rate = (targetIndex - currentIndex) / 30;
            scrollDirection = Math.max(Math.min(rate, 1), -1) * MAX_SPEED;
            scrollId = id;
        }
    }

    hasScrollId() {
        return typeof scrollId != 'undefined';
    }

    firstNodeInfo() {
        if (this._listNodes.length > 0) {
            const firstNode =  this._listNodes[0];
            let index = this.listData.findIndex(item => item[this.listKey] == firstNode.name);
            if (index >= 0) {
                let y = this.nodeTop(firstNode);
                return { index, y }
            }
        }
        return null;
    }

    public notifyDataChanged() {
        const firstNodeInfo = this.firstNodeInfo();
        this.recycleItems();
        if (firstNodeInfo) {
            this.layoutItems(firstNodeInfo.index, firstNodeInfo.y);
        } else {
            this.initItems();
        }
    }

    onLoad () {
        this.preloadItems();
        this.initItems();
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
                if (itemsHeight >= this.node.height + 2 * node.height) {
                    break;
                }
            }
        }
    }

    initItems() {
        if (this.listData.length > 0) {
            if (this.topToBottom) {
                this.layoutItems(0, this.listTop());
            } else {
                this.layoutItemsReverse(this.listData.length - 1, this.listBottom());
            }
        }
    }

    layoutItem(index, y) {
        const node = this.popNode(index);
        node.y = y - node.height * (1 - node.anchorY);
        this._listNodes.push(node);
        return node;
    }

    layoutItems(lastIndex, lastY) {
        let currentNode;
        do {
            currentNode = this.layoutItem(lastIndex, lastY);
            lastIndex += 1;
            lastY = this.nodeBottom(currentNode);
            lastY -= this.spacing;
        } while (lastIndex < this.listData.length - 1 && lastY > this.listBottom())
    }

    layoutItemReverse(index, y) {
        const node = this.popNode(index);
        node.y = y + node.height * node.anchorY;
        this._listNodes.push(node);
        return node;
    }

    layoutItemsReverse(lastIndex, lastY) {
        let currentNode;
        do {
            currentNode = this.layoutItemReverse(lastIndex, lastY);
            lastIndex -= 1;
            lastY = this.nodeTop(currentNode);
            lastY += this.spacing;
        } while (lastIndex >= 0 && lastY < this.listTop())
        this._listNodes.reverse();
        this.scrollChildren(this.node.height);
    }

    recycleItems() {
        for (let i = this._listNodes.length - 1; i >= 0; i--) {
            this.pushNode(this._listNodes[i]);
        }
        this._listNodes = [];
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
        lastTouchTime = 0;
        isTouch = true;
    }

    _onTouchMoved (event, captureListeners) {
        if (!this.enabledInHierarchy) return;

        let touch = event.touch;
        const deltaY = touch.getDelta().y;
        this.scrollChildren(deltaY);
        if (lastTouchTime > 0) {
            lastSpeed = deltaY / (touch._lastModified - lastTouchTime);
            lastSpeed = lastSpeed > 50 ? 50 : lastSpeed < -50 ? -50 : lastSpeed;
        }
        lastTouchTime = touch._lastModified;
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
        // deltaY != 0 && console.log(deltaY);
        deltaY = this.fixDeltaY(deltaY);
        for (let i = 0; i < this._listNodes.length; i++) {
            this._listNodes[i].y += deltaY;
        }
        const keepNodes = [];
        for (let i = 0; i < this._listNodes.length; i++) {
            const node = this._listNodes[i];
            const nodeTop = this.nodeTop(node);
            const nodeBottom = this.nodeBottom(node);
            const { name } = node;
            if (i === 0 && nodeTop + this.spacing < this.listTop()) {
                const addNode = this.addNode(name, node.y + node.height * (1 - node.anchorY), true);
                addNode && keepNodes.push(addNode);
            }
            if (nodeBottom <= this.listTop() && nodeTop >= this.listBottom()) {
                keepNodes.push(node);
            } else {
                this.pushNode(node);
            }
            if (i === this._listNodes.length - 1 && nodeBottom - this.spacing > this.listBottom()) {
                const addNode = this.addNode(name, node.y - node.height * node.anchorY, false);
                addNode && keepNodes.push(addNode);
            }
        }
        this._listNodes = keepNodes;
        if (keepNodes.length === 0 && this.listData.length > 0) {
            let index;
            if (this.hasScrollId()) {
                index = this.listData.findIndex(item => item[this.listKey] == scrollId);
            } else if (deltaY <= 0) {
                index = 0;
            } else if (deltaY > 0) {
                index = this.listData.length - 1;
            }
            if (deltaY <= 0) {
                this.layoutItem(index, this.listTop());
            } else if (deltaY > 0) {
                this.layoutItem(index, this.listBottom());
            }
        }
    }

    fixDeltaY(deltaY) {
        if (this.listData.length === 0) {
            return deltaY;
        }
        if (deltaY < 0) {
            deltaY = this.fixTopNode(deltaY, this.listData[0][this.listKey], 0);
        } else if (deltaY > 0) {
            deltaY = this.fixLastNode(deltaY, this.listData[this.listData.length - 1][this.listKey]);
            deltaY = this.fixTopNode(deltaY, this.listData[0][this.listKey], 0);
        }
        if (this.hasScrollId()) {
            for (let i = 0; i < this._listNodes.length; i++) {
                const node = this._listNodes[i];
                if (node.name == scrollId) {
                    const nodeTop = this.nodeTop(node);
                    if (deltaY != 0) {
                        if (nodeTop + deltaY < this.listTop()) {
                            deltaY = -nodeTop + this.listTop();
                            scrollId = undefined;
                            if (deltaY > 0) {
                                deltaY = this.fixLastNode(deltaY, this.listData[this.listData.length - 1][this.listKey]);
                            }
                        }
                    } else {
                        scrollId = undefined;
                    }
                    break;
                }
            }
        }
        return deltaY;
    }

    fixTopNode(deltaY: number, id: string, nodeIndex: number) {
        const firstNode = this._listNodes[nodeIndex];
        if (firstNode.name == id) {
            const firstNodeTop = this.nodeTop(firstNode);
            if (firstNodeTop + deltaY < this.listTop()) {
                deltaY = -firstNodeTop + this.listTop();
            }
        }
        return deltaY;
    }

    fixLastNode(deltaY: number, id: string) {
        const lastNode = this._listNodes[this._listNodes.length - 1];
        if (lastNode.name == id) {
            const lastNodeBottom = this.nodeBottom(lastNode);
            if (lastNodeBottom + deltaY > this.listBottom()) {
                deltaY = -lastNodeBottom + this.listBottom();
            }
        }
        return deltaY;
    }

    addNode(dataKey, lastY, isFirst) {
        const index = this.listData.findIndex(item => item[this.listKey] == dataKey);
        if (isFirst ? index > 0 : index < this.listData.length - 1) {
            const addNode = this.popNode(isFirst ? index - 1 : index + 1);
            if (isFirst) {
                addNode.y = lastY + this.spacing + addNode.height * addNode.anchorY;
            } else {
                addNode.y = lastY - this.spacing - addNode.height * (1 - addNode.anchorY);
            }
            if (this.nodeBottom(addNode) <= this.listTop() && this.nodeTop(addNode) >= this.listBottom()) {
                return addNode;
            } else {
                this.pushNode(addNode);
                return null;
            }
        }
    }

    listTop() {
        return (1 - this.node.anchorY) * this.node.height;
    }

    listBottom() {
        return -this.node.anchorY * this.node.height;
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
        node.name = '';
        if (typeof node.dataType === 'undefined') {
            if (typeof type === 'undefined') {
                throw new Error('没有设置节点type');
            }
            node.dataType = type;
        }
        this._itemNodes[node.dataType].push(node);
        // console.log('pushNode:', node.dataType, this._itemNodes[node.dataType].length);
    }

    popNode(index) {
        const itemData = this.listData[index];
        const node = this._itemNodes[itemData[this.listType]].pop();
        node.x = 0;
        node.opacity = 255;
        node.name = itemData[this.listKey].toString();
        node.getComponent(ZListItem).renderData(itemData, index, this.listData);
        // console.log('popNode:', node.dataType, this._itemNodes[node.dataType].length);
        return node;
    }
}

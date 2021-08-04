import ZListItem from "./ZListItem";

const {ccclass, property} = cc._decorator;

const MAX_SPEED = 20;
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

    public scrollToTop() {
        this.scrollToId(this.listData[0][this.listKey]);
    }

    public scrollToBottom() {
        this.scrollToId(this.listData[this.listData.length - 1][this.listKey]);
    }

    public scrollToId(id) {
        const firstId = this._listNodes[0].name;
        const lastId = this._listNodes[this._listNodes.length - 1].name;
        if (id < firstId) {
            scrollDirection = -MAX_SPEED;
            scrollId = id;
        } else if (id > lastId) {
            scrollDirection = MAX_SPEED;
            scrollId = id;
        } else {
            console.log('目标id已经在视图内');
        }
    }

    hasScrollId() {
        return typeof scrollId != 'undefined';
    }

    public notifyDataChanged() {
        const firstNode = this._listNodes[0];
        let lastIndex = this.listData.findIndex(item => item[this.listKey] == firstNode.name);
        let lastY = this.nodeTop(firstNode);
        for (let i = this._listNodes.length - 1; i >= 0; i--) {
            this.pushNode(this._listNodes[i]);
        }
        this._listNodes = [];
        this.layoutItems(lastIndex, lastY);
    }

    onLoad () {
        this.preloadItems();
        if (this.topToBottom) {
            this.layoutItems(0, this.listTop());
        } else {
            this.layoutItems(this.listData.length - 1, this.listBottom() + 1);
            this.scheduleOnce(this.scrollToBottom);
        }
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
            lastY += -this.spacing;
        } while (lastIndex < this.listData.length - 1 && lastY > this.listBottom())
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
        if (deltaY < 0) {
            const firstNode = this._listNodes[0];
            const overflow = firstNode.name == this.listData[0][this.listKey];
            const reachId = this.hasScrollId() && firstNode.name == scrollId;
            if (overflow || reachId) {
                const firstNodeTop = this.nodeTop(firstNode);
                if (firstNodeTop + deltaY < this.listTop()) {
                    deltaY = -firstNodeTop + this.listTop();
                }
                if (reachId) {
                    scrollId = undefined;
                }
            }
        } else if (deltaY > 0) {
            const lastNode = this._listNodes[this._listNodes.length - 1];
            const overflow = lastNode.name == this.listData[this.listData.length - 1][this.listKey];
            const reachId = this.hasScrollId() && lastNode.name == scrollId;
            if (overflow || reachId) {
                const lastNodeBottom = this.nodeBottom(lastNode);
                if (lastNodeBottom + deltaY > this.listBottom()) {
                    deltaY = -lastNodeBottom + this.listBottom();
                }
                if (reachId) {
                    scrollId = undefined;
                }
            }
        }
        for (let i = 0; i < this._listNodes.length; i++) {
            this._listNodes[i].y += deltaY;
        }
        const keepNodes = [];
        for (let i = 0; i < this._listNodes.length; i++) {
            const node = this._listNodes[i];
            const nodeTop = this.nodeTop(node);
            const nodeBottom = this.nodeBottom(node);
            const { name } = node;
            if (i === 0 && nodeTop < this.listTop()) {
                const addNode = this.addNode(name, node.y + node.height * (1 - node.anchorY), true);
                addNode && keepNodes.push(addNode);
            }
            if (nodeBottom <= this.listTop() && nodeTop >= this.listBottom()) {
                keepNodes.push(node);
            } else {
                this.pushNode(node);
            }
            if (i === this._listNodes.length - 1 && nodeBottom > this.listBottom()) {
                const addNode = this.addNode(name, node.y - node.height * node.anchorY, false);
                addNode && keepNodes.push(addNode);
            }
        }
        this._listNodes = keepNodes;
        if (keepNodes.length === 0) {
            if (this.hasScrollId()) {
                const index = this.listData.findIndex(item => item[this.listKey] == scrollId);
                this.layoutItem(index, 0);
            } else if (deltaY < 0) {
                this.layoutItem(0, this.listTop());
            } else if (deltaY > 0) {
                this.layoutItem(this.listData.length - 1, this.listBottom());
            }
        }
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

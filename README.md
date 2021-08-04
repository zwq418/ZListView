# ZListView
 Cocos Creator ListView

用法参考Test.fire

ZListView
列表

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

ZListItem
所有item必须继承改类，实现
renderData
或者
set itemData
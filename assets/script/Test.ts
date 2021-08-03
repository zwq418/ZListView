// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ZListView from "./ZListView";

const {ccclass, property} = cc._decorator;

const URLS = [
    'https://thirdwx.qlogo.cn/mmopen/vi_32/k8QDaJR3RyA7Bpo72uJZEqp3BGrHA972RprM3EMZBbnXayV7ejL58z6GEsDDsGesxOthJKF4kJn8ewSiaYlG4kg/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/dibUiaiaJ39GaMXFXFUV2W7tTsphhAianHrAhhoYLwRhnpXjM0maenJY1KQUVRtOy8IdfEtUskNYQTaO1GfGQfyYlg/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/XDUDjUaWG5k5F3eiaMGDBffnz6NZ7rlcTqSzqNwQOx4ECLymW1bpsKQsdwHSlmz4X4mmdKNGvpHfcP39wZrPMCQ/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/w1dLPGOQKrKEg0AFLYmCas5jP8VBs2sZoCn6f5znAGNl1DcV4HIOBI35rFRSC6QvpGMDqvl3Q6ibBQLa77BzeCA/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/32luXvOVGsNXNBDZ4ggfjantIQkrde7kUK3bD3s8dib4ESMbiaDvIRo0vtJBQveibADMeM9UA2VjlmFDsGbaXhJBw/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTInoiaS7e3nVlVxl9tkF8EpLoE6hM1BwU9o4nFAibMS2FJw49H3T3iaNpMabrQEiacNwqsGbAm2PiaNZ5g/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/cQDaiaSmBnuuPmtMB6sFhhw4JdXFYEKM8BCFL7sNw4nFnqfEvcqKq8mvqDQz3vwtk30Ea324nJZHuRDnCC4dyKg/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/yUAD9PkjPE36ORibV6NoCpI0qduZU7IGZD4kjBDBkTv8ibVCCSUumEtl8YspmdE5cjsBM110GrVIia8Ub8j45UJYg/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/bdAxpicyE0FuOxmENU4S8zGWNUorvhMMjHztQF4mdm56tqIheOIu9uicy2IF4qeQ4ajZou4EeAnicgGRp2bbSbicng/132',
    'https://thirdwx.qlogo.cn/mmopen/vi_32/6ibqsQ8Oia81KJ0XM89lHqP2Clsia4U807RSbXJlVpCI50PfnTFbC9aQyV7ZOgPGKcdtOzwBsU8zU0YCQTvKqb4mw/132',
]
@ccclass
export default class TestScene extends cc.Component {

    @property(ZListView)
    listView: ZListView = null;

    @property
    listData: any[] = [];

    onLoad() {
        for (let i = 0; i < 10; i++) {
            this.listData.push({
                id: i,
                type: i % 2,
                avatar: URLS[i % URLS.length],
            });
        }
        this.listView.listData = this.listData;
    }

    onEnable() {
    }

    private addData(index, add) {
        const current = this.listData[index];
        const near = this.listData[index + add];
        const id = near ? (current.id + near.id) / 2 : current.id + add;
        const idUInt = Math.round(Math.abs(id));
        this.listData.splice(index + (add > 0 ? 1 : 0), 0, {
            id,
            type: idUInt % 2,
            avatar: URLS[idUInt % URLS.length]
        });
    }

    public scrollToTop() {
        this.listView.scrollToTop();
    }

    public scrollToBottom() {
        this.listView.scrollToBottom();
    }

    public bottomAdd1() {
        this.addData(this.listData.length - 1, 1);
        this.listView.scrollToBottom();
    }

    public bottomAdd10() {
        for (let i = 0; i < 10; i++) {
            this.addData(this.listData.length - 1, 1);
        }
        this.listView.scrollToBottom();
    }

    public topAdd1() {
        this.addData(0, -1);
        this.listView.scrollToTop();
    }

    public topAdd10() {
        for (let i = 0; i < 10; i++) {
            this.addData(0, -1);
        }
        this.listView.scrollToTop();
    }

    public tenAdd1() {
        this.addData(10, 1);
        this.listView.notifyDataChanged();
    }

    public tenAdd10() {
        for (let i = 0; i < 10; i++) {
            this.addData(10 + i, 1);
        }
        this.listView.notifyDataChanged();
    }

    public to10() {
        this.listView.scrollToIndex(10);
    }
}

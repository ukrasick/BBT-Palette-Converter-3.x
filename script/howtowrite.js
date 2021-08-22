const App_howToWriteJudge = Vue.createApp({
    data() {
        return {
            arts: {
                dataheader: ["名称", "種別", "LV", "タイミング", "判定値", "対象", "射程", "コスト", "効果"],
                items: []
            },
            weapons: {
                dataheader: ["名称", "種別", "命中", "属性", "攻撃力", "ガード", "行動", "射程", "備考"],
                items: [],
                result: ""
            }
        };
    },
    mounted() {
        // アーツ事例の追加
        this.newLineArts({name: "災厄者", level: "1", judge: "感情", cost: "3", notes: "対象に〈感情〉[感情+(:LV+1)D6]点のダメージを与える特殊攻撃。（以下省略）"});
        this.newLineArts({name: "加速装置", level: "1", judge: "技術+2", cost: "2", notes: "命中・ドッジの判定を「【技術】+2」で行う。（以下省略）"});
        this.newLineArts({name: "アタックアシスト", level: "1", judge: "自動", cost: "2", notes: "対象が与えるダメージに+[4(8)+1D6]。（以下省略）"});
        this.newLineArts({name: "シャープストライク", level: "3", judge: "白兵+(:LV×2)", cost: "2", notes: "白兵攻撃を行う。命中判定の達成値にプラス修正。"});
        this.newLineArts({name: "内なる獣：ジョーカードリーム", level: "1", judge: "自動成功", cost: "愛+3", notes: "（省略）"});
        // 武器事例の追加
        this.newLineWeapons({name: "白兵武器：小型", type: "白兵/射撃", judge: "+1", attack: "+1+1D6", guard: "2", notes: "※判定値と種別の事例"});
        this.newLineWeapons({name: "エリートクラード", type: "射撃/軍団/魔獣", judge: "社会", attack: "+2+1D6", guard: "6", notes: "※「種別：魔獣」を指定する事例"});
        this.newLineWeapons({name: "虚銃\n(遠雷-Type Long-)", type: "射撃/魔獣", judge: "@-1", attribute: "感情" , notes: "※武器限定のクリティカル値修正の事例"});
        this.newLineWeapons({name: "フランケンシュタインの怪物", type: "射撃/軍団", judge: "#+1", attribute: "技術", notes: "※武器限定のファンブル値修正の事例"});
        this.newLineWeapons({name: "銘刀", type: "白兵", attribute: "技術", attack: "10(14)+1D6", notes: "※魔獣化中に攻撃力が変化する事例"});
        this.newLineWeapons({name: "ガード用武器", guard: "7(10)", notes: "※魔獣化中にガード値が変動する事例"});
    },
    methods: {
        artsDataTemplate() {
            return {name: "", type: "", level: "1", timing: "", judge: "", tgt: "", range: "", cost: "", notes: ""};
        },
        weaponDataTemplate() {
            return {name: "", type: "", judge: "", attribute: "肉体", attack: "", guard: "", action: "", range: "", notes: ""};
        },
        newLineArts(obj=null) {
            let data = this.artsDataTemplate();
            if(obj) { Object.assign(data, obj); }
            this.arts.items.push(data);
        },
        newLineWeapons(obj=null) {
            let data = this.weaponDataTemplate();
            if(obj) { Object.assign(data, obj); }
            this.weapons.items.push(data);
        }
    }
});
const AppHowTo = App_howToWriteJudge.mount("#howToWriteJudge");
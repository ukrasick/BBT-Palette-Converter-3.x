// メインの処理部分
const App_mainprocess = Vue.createApp({
    data() {
        return {
            sheet_url: "",
            system_selected: "なし",
            systems: ["なし", "ココフォリア", "ユドナリウム", "ユドナリウムリリィ", "Udonarium with Fly", "ユドナリウム（ルビ対応）", "TRPGスタジオ", "Tekey", "Quoridorn"],
            main_data: {},
            main_data_name: "",
            main_data_url: "",
            menu_display: false,
            save_options: false
        };
    },
    mounted: function() {
        // localStorageをチェックし、可能なものはデータを反映する
        const VoidBarrelMain = localStorage.getItem("void-barrel-main");
        console.log("VoidBarrelMain", JSON.parse(VoidBarrelMain));
        if(VoidBarrelMain) {
            Object.assign(this, JSON.parse(VoidBarrelMain));
        }
    },
    methods: {
        process_button() {
            if(!this.sheet_url.match(/character-sheets.appspot.com\/bbt\/edit.html\?key=/)) {
                alert("キャラクターシートのURLを入力してください。（URL短縮サービスでのURLは使用できません。）");
                return;
            }
            // console.log("シートURLと一時保存URLの比較", this.sheet_url === this.main_data_url);
            if(this.main_data && this.main_data_url === this.sheet_url) {
                // console.log("一時データから再読み込み");
                convert(this.main_data, true);
                return;
            }
            // console.log("キャラクターシート倉庫から読み込み");
            this.main_data_url = JSON.parse(JSON.stringify(this.sheet_url));
            let key = (location.protocol === "https:" ? "https:" : "http:") + "//character-sheets.appspot.com/bbt/display?ajax=1&key=" + this.sheet_url.split(/key=/)[1] + "&base64Image=1";
            // console.log(key);
            let jsc = document.createElement('script');
            jsc.src = key + "&callback=convert";
            document.body.appendChild(jsc);
            document.body.removeChild(document.body.lastChild);
        },
        system_config() {
            let result = {
                    prefix: "",     // ダイスロール用の式について、接頭詞が必要な場合に設定。TRPGスタジオ用 "/ "
                  reserved: false,  // 予約語の機能に対応しているかの設定。していなければ最後にデータを置換する
                param_pone: false,  // 駒にステータス/パラメータを紐付けるかの設定。
             param_palette: false,  // チャットパレットに予約語を記載できるシステムかどうかの設定。
                  cite_hum: false,  // 人間性の引用が可能かどうかの設定。falseなら%{人間性}の記載を省略
            pone_generator: false,  // 駒出力機能に対応しているかどうかの設定。
              auto_payment: false,  // コストの自動支払いに対応しているかどうかの設定。
             resource_ctrl: false,  // リソース操作コマンドを出力するかどうかの設定
            abilities_list: false   // 能力値一覧を表示するツールであるかどうかの設定
            };
            switch(this.system_selected) {
                case "ココフォリア":
                    Object.assign(result, {reserved: true, param_pone: true, cite_hum: true, pone_generator: true, resource_ctrl: true});
                    break;
                case "ユドナリウム":
                    Object.assign(result, {reserved: true, param_pone: true, param_palette: true, cite_hum: true, pone_generator: true, abilities_list: true});
                    break;
                case "ユドナリウムリリィ":
                    Object.assign(result, {reserved: true, param_pone: true, param_palette: true, cite_hum: true, pone_generator: true, auto_payment: true, resource_ctrl: true, abilities_list: true});
                    break;
                case "Udonarium with Fly":
                    Object.assign(result, {reserved: true, param_pone: true, param_palette: true, cite_hum: true, pone_generator: true, abilities_list: true});
                    break;
                case "TRPGスタジオ":
                    Object.assign(result, {prefix: "/ "});
                    break;
                case "Tekey":
                    Object.assign(result, {reserved: true, param_palette: true, cite_hum: true, abilities_list: true});
                    break;
                case "Quoridorn":
                    Object.assign(result, {reserved: true, param_palette: true, cite_hum: true, abilities_list: true});
                    break;
            }
            return result;
        },
        copy_system_tool() {
            appo.general.session_tool = this.system_selected;
            // 「ユドナリウム（ルビ対応）」が選択された場合、ルビ振りには自動的にチェックを入れる。そうでないなら外す
            appo.general.pronouncing = this.system_selected === "ユドナリウム（ルビ対応）" ? true : false;
        },
        initialize_charactersheet_data() {
            this.main_data = {};
            this.main_data_name = "";
            this.main_data_url = "";
        },
        revoke_main_data() {
            this.initialize_charactersheet_data();
            appo.initialize_data();
            // 駒作成用の設定をしたら、ここにデータを追記する
        },
        revoke_data() {
            this.sheet_url = "";
            this.revoke_main_data();
        }
    }
});

const appmp = App_mainprocess.mount("#pl_main");

// オプション部分
const App_options = Vue.createApp({
    data() {
        return {
            test: {
                test_convert: ""
            },
            show: {
                sec_howtouse: true, sec_gen: true, sec_arts: false,
                sec_damage: false, sec_mods: false, sec_explain: false,
                sec_palette: true, sec_order: true,
                pone: { udona: true, ccfolia: true },
                color_preset: ["#222222", "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B", "#9E9E9E", "#E0E0E0"],
                lilySelectedBS: "新規",
                option_lilyBS: ["新規", "邪毒", "重圧", "狼狽", "放心", "束縛", "暴走", "翻弄", "恐怖", "迫害"]
            },
            general: {
                output_resistFalldown: true,
                output_beastActionUdonarium: true,
                sort_type: "《魔獣化》の有無",
                option_sort_type: ["【能力値】ごと", "《魔獣化》の有無"],
                session_tool: "なし",
                reOutput_pone_params: false,
                output_pone_immediately: false,
                output_judgeTextCalculated: true,
                fumbleArtsCheckBeforeOutput: false,
                pronouncing: false,
                withFly: {
                    declareWithBlooming: false,
                    addExclamationWithDeclaration: true,
                    removeBracketWithDeclaration: false
                }
            },
            arts: {
                timing_empty: true,
                timing_auto: true,
                include_cost: true,
                include_note: true,
                judge_type: "重複は省略",
                option_judge_type: ["すべて追加", "重複は省略" ,"追加しない"],
                display_level: "『LV1』のみ省略",
                option_display_level: ["すべて表示", "『LV1』のみ省略", "すべて省略"]
            },
            damagerolls: {
                include_note: true,
                include_sp_attack: true,
                judge_type: "重複は省略",
                option_judge_type: ["すべて追加", "重複は省略" ,"追加しない"],
                judge_head_number: "基準値として扱う",
                option_judge_head: ["基準値として扱う", "プラスの修正として扱う"]
            },
            mods: {
                score_list: {
                    all: {a:0, h:0, b:0},
                    baseAbility: {a:0, h:0, b:0},
                    body: {a:0, h:0, b:0},
                    skill: {a:0, h:0, b:0},
                    emotion: {a:0, h:0, b:0},
                    divine: {a:0, h:0, b:0},
                    society: {a:0, h:0, b:0},
                    battleAbility: {a:0, h:0, b:0},
                    combat: {a:0, h:0, b:0},
                    shoot: {a:0, h:0, b:0},
                    dodge: {a:0, h:0, b:0},
                    action: {a:0, h:0, b:0},
                    binds: {a:0, h:0, b:0}
                },
                arts_fumble: [],
                arts_fumble_list: ["ダメ魔物", "しまった、こんな時に！", "偉大なる血脈", "この世ならざるもの", "不思議科学", "身体改造処置", "精神強化処置", "不安定なる高性能", "契約代償：不運", "秘されし真名", "どうして自分だけ？"]
            },
            advanced_order: {
                order: ["登場", "一般的な判定", "一般的な行動", "アーツ", "アイテム", "リアクション", "愛・罪の効果", "ダメージロール", "能力値一覧", "リソース操作"],
                usable: {
                    "登場": true, "一般的な判定": true, "一般的な行動": true, "アーツ": true, "アイテム": true, "リアクション": true,
                    "愛・罪の効果": true, "ダメージロール": true, "能力値一覧": true, "リソース操作": true
                },
                notes: {
                    "登場": "シーン登場時の人間性低下ダイスを出力します。",
                    "一般的な判定": "一般的な判定式を出力します。",
                    "一般的な行動": "一般的な行動と、武器攻撃の宣言文を出力します。",
                    "アーツ": "アーツの使用宣言文を出力します。",
                    "アイテム": "アイテムの使用宣言文を出力します。",
                    "リアクション": "「ドッジ」と各武器によるガード宣言を出力します。",
                    "愛・罪の効果": "愛や罪の効果一覧を出力します。",
                    "ダメージロール": "各武器欄からダメージロール式を抽出し、出力します。",
                    "能力値一覧": "チャットパレットに【能力値】を埋め込みます。",
                    "リソース操作": "リソース操作コマンドの定型文を埋め込みます。"
                }
            },
            palette: "",
            palette_error: [],
            udona_pone: {
                name: "",
                baseStatus: [],
                baseParams: [],
                memoBinds: [],
                lilyBuffPalette: [],
                image: ""
            },
            ccfolia_pone: {
                name: "",
                memo: "",
                status: [],
                params: [],
                size: 2,
                active: true,
                secret: false,
                invisible: false,
                hideStatus: false,
                color: "#9E9E9E",
                completedText: ""
            }
        };
    },
    mounted: function() {
        const VoidBarrelSub = localStorage.getItem("void-barrel-sub");
        console.log("VoidBarrelSub", JSON.parse(VoidBarrelSub));
        if(VoidBarrelSub) {
            Object.assign(this, JSON.parse(VoidBarrelSub));
        }
    },
    methods: {
        system_selected() {
            return appmp.system_selected;
        },
        initialize_data() {
            this.init_mods_list();
            this.init_pone_generator();
            this.palette = "";
            this.palette_error = [];
        },
        init_mods_list() {
            this.mods.score_list = {
                all: {a:0, h:0, b:0},
                baseAbility: {a:0, h:0, b:0}, body: {a:0, h:0, b:0}, skill: {a:0, h:0, b:0}, emotion: {a:0, h:0, b:0}, divine: {a:0, h:0, b:0}, society: {a:0, h:0, b:0},
                battleAbility: {a:0, h:0, b:0}, combat: {a:0, h:0, b:0}, shoot: {a:0, h:0, b:0}, dodge: {a:0, h:0, b:0}, action: {a:0, h:0, b:0},
                binds: {a:0, h:0, b:0}
            };
            this.mods.arts_fumble = [];
        },
        init_pone_generator() {
            this.udona_pone = {
                name: "",
                baseStatus: [],
                baseParams: [],
                memoBinds: [],
                lilyBuffPalette: [],
                image: "",
            };
            this.ccfolia_pone = {
                name: "",
                memo: "",
                status: [],
                params: [],
                size: 2,
                active: true,
                secret: false,
                invisible: false,
                hideStatus: false,
                color: "#9E9E9E",
                completedText: ""
            };
        },
        new_resource_ccfolia(type) {
            if(type === "status") {
                this.ccfolia_pone.status.push({label:"ステータス", value:0, max:0});
            }
            if(type === "params") {
                this.ccfolia_pone.params.push({label: "パラメータ", value: "0"});
            }
        },
        control_status_ccfolia(event, array, mode="delete") {
            if(event) {
                // 情報の取得
                let k = event.target.parentNode.parentNode;
                let table = [].slice.call(k.parentNode.getElementsByTagName("tr"));
                let i = table.indexOf(k);
                // データをコピー
                let c = JSON.parse(JSON.stringify(array[i]));
                // 確認のためチェック
                // 処理拒否のパターンを確認
                if(mode === "up" && i === 0) { return; }
                if(mode === "down" && i === table.length - 1) { return; }
                // 移動元のデータを削除
                array.splice(i, 1);
                // 移動先にコピーしたデータを挿入
                switch(mode) {
                    case "up":
                        array.splice(i-1, 0, c);
                        break;
                    case "down":
                        array.splice(i+1, 0, c);
                        break;
                    case "trans-S":
                        this.ccfolia_pone.status.push({label: c.label, value: parseInt(c.value, 10), max:parseInt(c.value, 10)});
                        break;
                    case "trans-P":
                        this.ccfolia_pone.params.push({label: c.label, value: `${c.value}`});
                        break;
                }
            }
        },
        quote_memo_ccfolia(mode) {
            let data = appmp.main_data;
            switch(mode) {
                case "profile":
                    let p = [];
                    let profile_name = "【名前】" + (data.base.nameKana ? data.base.nameKana + " " : "") + (data.base.name ? data.base.name : "");
                    if(data.base.name) { p.push(profile_name); }
                    let profile_other = (data.base.age ? `【年齢】${data.base.age}　` : "") + (data.base.sex ? `【性別】${data.base.sex}　` : "") + (data.base.cover ? `【カヴァー】${data.base.cover}` : "");
                    p.push(profile_other);
                    p.push("-".repeat(20));
                    this.ccfolia_pone.memo += (this.ccfolia_pone.memo ? "\n" : "") + p.join("\n");
                    break;
                case "binds":
                    let r = [];
                    for(let i of poneGenerator_passBindsData(appmp.main_data)) {
                        if(!i || !i.type) { continue; }
                        r.push(`【${i.type}】` + (i.name ? `${i.name}` : "") + (i.relation ? `（関係：${i.relation}）` : ""));
                        if(i.type.match(/絆/)) { r.push("＞【エゴ】"); }
                        r.push("-".repeat(20));
                    }
                    this.ccfolia_pone.memo += (this.ccfolia_pone.memo ? "\n" : "") + r.join("\n");
                    break;
                case "kinds":
                    let k = getCharacterKinds(data).filter(function (x, i, self) {
                        return self.indexOf(x) === i;
                    });
                    if(k.length > 0) {
                        this.ccfolia_pone.memo += (this.ccfolia_pone.memo ? "\n" : "") + [["【種別】", k.join("/")].join(""), "-".repeat(20)].join("\n");
                    }
                    break;
                case "SA":
                    let s = ["【SA】", "-".repeat(20)];
                    this.ccfolia_pone.memo += (this.ccfolia_pone.memo ? "\n" : "") + s.join("\n");
                    break;
            }
        },
        resetStatusAndParams_ccfolia(mode) {
            if(!["status", "params"].includes(mode)) { return; }
            this.ccfolia_pone[mode] = [];
            ccfolia_outputStatusAndParams(appmp.main_data, mode);
        },
        new_param_udonarium(array) {
            let r = {name: "項目", type: "normal", value: "0", max: 0};
            if(array === this.udona_pone.memoBinds) {
                r.name = "絆・エゴ";
                r.type = "note";
                r.value = "【絆】";
            }
            array.push(r);
        },
        udona_paramTypeChanged(obj) {
            switch(obj.type) {
                case "numberResource":
                    if(isNaN(parseInt(obj.value, 10))) {
                        obj.value = "0";
                        obj.max = 0;
                    } else {
                        obj.max = parseInt(obj.value, 10);
                    }
                    break;
                default:
                    obj.max = 0;
                    break;
            }
        },
        udonaLily_newBuffPalette(bs=false) {
            let r = {name: "名称", effect: "効果", round: false};
            switch(bs) {
                case "邪毒":
                    Object.assign(r, {name: "邪毒X", effect: "クリンナップにXD6点ダメージ"});
                    break;
                case "重圧":
                    Object.assign(r, {name: "重圧", effect: "アーツ使用不可"});
                    break;
                case "狼狽":
                    Object.assign(r, {name: "狼狽", effect: "達成値-5、移動不可"});
                    break;
                case "放心":
                    Object.assign(r, {name: "放心", effect: "達成値-5", round: true});
                    break;
                case "束縛":
                    Object.assign(r, {name: "束縛", effect: "移動・ドッジ不可"});
                    break;
                case "暴走":
                    Object.assign(r, {name: "暴走", effect: "ガード・カバーリング不可"});
                    break;
                case "翻弄":
                    Object.assign(r, {name: "翻弄", effect: "対象を含まない判定-3"});
                    break;
                case "恐怖":
                    Object.assign(r, {name: "恐怖", effect: "対象を含む判定-3"});
                    break;
                case "迫害":
                    Object.assign(r, {name: "迫害状態", effect: "登場時の人間性ダイス増加"});
                    break;
                default:
                    break;
            }
            this.udona_pone.lilyBuffPalette.push(r);
        },
        resetStatusAndParams_udonarium(mode) {
            if(!["baseStatus", "baseParams", "memoBinds"].includes(mode)) { return; }
            this.udona_pone[mode] = [];
            udonarium_outputStatusAndParams(appmp.main_data, mode);
        },
        ignitePoneGenerator() {
            // console.log("check ignitePoneGenerator");
            switch(this.general.session_tool) {
                case "ココフォリア":
                    // console.log("ccfolia PoneGenerator");
                    this.ccfolia_pone.completedText = poneGenerator_ccfolia(appmp.main_data);
                    break;
                case "ユドナリウム":
                case "ユドナリウムリリィ":
                case "Udonarium with Fly":
                case "ユドナリウム（ルビ対応）":
                    // console.log("Udonarium PoneGenerator");
                    poneGenerator_udonarium(appmp.main_data);
                    break;
            }
        },
        advanced_order_reset() {
            this.advanced_order.order = ["登場", "一般的な判定", "一般的な行動", "アーツ", "アイテム", "リアクション", "愛・罪の効果", "ダメージロール", "能力値一覧", "リソース操作"];
            this.advanced_order.usable = {
                    "登場": true, "一般的な判定": true, "一般的な行動": true, "アーツ": true, "アイテム": true, "リアクション": true,
                    "愛・罪の効果": true, "ダメージロール": true, "能力値一覧": true, "リソース操作": true
            };
        }
    },
    computed: {
        palette_hasError() {
            return this.palette.indexOf("**Error: 式作成に失敗しました**") > 0 ? true : false;
        },
        general_sort_type_description() {
            switch(this.general.sort_type) {
                case "【能力値】ごと":
                    return "基本的な【能力値】判定は、各【能力値】ごとに判定式を並べ替えます。（人間状態と《魔獣化》中の判定式が交互に並びます）";
                case "《魔獣化》の有無":
                    return "判定式は、《魔獣化》中のものかそうでないかを基準に並べ替えます。";
            }
        },
        judge_arts_description() {
            switch(this.arts.judge_type) {
                case "すべて追加":
                    return "内容にかかわらず、すべての「判定値」欄を判定式に変換します。";
                case "重複は省略":
                    return "「判定値」欄から起こした式が既に作成されている式と重複する場合、そのアーツの判定式は省略します。";
                case "追加しない":
                    return "「判定値」欄の内容から判定式を作成しません。";
            }
        },
        judge_weapons_description() {
            let result = [];
            switch(this.damagerolls.judge_type) {
                case "すべて追加":
                    result.push("内容にかかわらず、すべての「判定値」欄を判定式に変換します。");
                    break;
                case "重複は省略":
                    result.push("「判定値」欄から起こした式が既に作成されている式と重複する場合、その武器の命中判定式は省略します。");
                    break;
                case "追加しない":
                    result.push("「判定値」欄の内容から判定式を作成しません。");
                    break;
            }
            if(this.damagerolls.judge_type !== "追加しない") {
                switch(this.damagerolls.judge_head_number) {
                    case "基準値として扱う":
                        result.push("また、「命中」欄が符号のない整数で入力されている場合、それを判定の基準値として扱います。");
                        break;
                    case "プラスの修正として扱う":
                        result.push("また、「命中」欄が符号のない整数で入力されている場合、それを命中判定へのプラス修正として扱います。");
                        break;
                }
            }
            return result;
        },
        testConvertBeastFormula() {
            return [
                separateBeastFormula(this.test.test_convert, "h"),
                separateBeastFormula(this.test.test_convert, "b")
            ];
        },
        hasPoneGenerator() {
            return this.general.session_tool.match(/(ユドナリウム|ココフォリア|Udonarium)/);
        },
        allowPoneGenerator() {
            return appmp.main_data_name && this.palette && this.hasPoneGenerator;
        },
        hasRubyData() {
            return Object.keys(RUBY_TEMPLATE).includes(this.general.session_tool);
        },
        checkToolAbilities() {
            return appmp.system_config();
        },
        withFlyBloomingOpacity() {
            return this.general.withFly.declareWithBlooming ? 1 : 0.25;
        }
    }
});
const appo = App_options.mount("#pl_options");
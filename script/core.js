// 定数の定義
// 能力値の名称（英語）
const KEY_ABILITY = ["body", "skill", "emotion", "divine", "society", "combat", "shoot", "dodge", "action"];
// 能力値名の日英対応
const ABILITIES = {
    etj: { "body": "肉体", "skill": "技術", "emotion": "感情", "divine": "加護", "society": "社会", "combat": "白兵", "shoot": "射撃", "dodge": "回避", "action": "行動", "binds": "絆数" },
    jte: { "肉体": "body", "技術": "skill", "感情": "emotion", "加護": "divine", "社会": "society", "白兵": "combat", "射撃": "shoot", "回避": "dodge", "行動": "action", "絆数": "binds" }
};
// 文字実体参照への変換対象
const DICTIONARY_TO_ENTITY_REFERENCES = {'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '&': '&amp;'};

function convert(data, cache=false) {
    // データの取得
    if(!data) {
        window.alert('エラー：データが取得できませんでした。キャラクターシートのURLを再確認してください。');
        return;
    }
    // データの一時保存
    if(!cache) {
        console.log("キャッシュからの読み込みではないため、データを一時保存");
        appmp.main_data = JSON.parse(JSON.stringify(data));
        appmp.main_data_name = data.base.name;
        // データをここでキャッシュしたものにすり替える
        data = appmp.main_data;
    }
    console.log("使用データの確認", data);

    // テキストの作成開始
    let result = [];
    // 「出力する項目と順番」の設定にあわせて、順々にテキストを作成・追加
    for(let title of appo.advanced_order.order) {
        if(!appo.advanced_order.usable[title]) { continue; }
        let output;
        switch(title) {
            case "登場":
                output = outputSceneEntry();
                break;
            case "一般的な判定":
                output = outputAllJudgeTextsV3(data);
                break;
            case "一般的な行動":
                output = outputGeneralActions(data);
                break;
            case "アーツ":
                output = outputArts(data);
                break;
            case "アイテム":
                output = outputItems(data);
                break;
            case "リアクション":
                output = outputGeneralReactions(data);
                break;
            case "愛・罪の効果":
                output = outputAgapeyAndGuilty();
                break;
            case "ダメージロール":
                output = outputDamageRoll(data);
                break;
            case "能力値一覧":
                output = outputReservedValues(data);
                break;
            case "リソース操作":
                output = outputResourceOperator(data);
                break;
        }
        if(output) { result.push(output); }
    }
    // データの結合
    let resultText = result.join("\n");
    // 予約語に対応しないシステムは、予約語の部分を実数値に置き換える
    if(!appmp.system_config().reserved) {
        resultText = replaceReservedWordToValue(resultText, data);
    }
    resultText = resultText.replace(/\n$/, "");
    // 結果の出力
    appo.palette = resultText;
    // 結果先へ画面をスクロール
    // scrollToChatPaletteResult();
    let boxChatPaletteOutput = document.getElementById("chatPaletteOutput");
    let content_position = boxChatPaletteOutput.getBoundingClientRect();
    window.scrollBy({top: content_position.top, behavior: "smooth"});
    // キャラクター駒作成の処理へ
    initializePoneConverter(appmp.main_data, cache);
    // 即時発火チェック
    console.log("キャラクター駒作成の即時発火", appo.general.output_pone_immediately);
    if(appo.general.output_pone_immediately) {
        appo.ignitePoneGenerator();
    }
}

// キャラクター駒の初期情報をインプット
function initializePoneConverter(data, cache) {
    // キャッシュデータからの読み込みの場合は、データを操作しないか初期化しないかがオプション設定になっている
    if(cache) {
        if(appo.general.reOutput_pone_params) {
            appo.init_pone_generator();
        } else {
            return;
        }
    }
    udona_outputReservedValuesAsPoneStatus(data);
    ccfolia_outputReservedValuesAsPoneStatus(data);
}

// 《記憶封印》を持たないモータルかどうかの判定。コスト計算の際に使用する。チェックした情報はdataにキャッシュする。
// 判定方法は、「ハーミット以外のルーツを持たず、かつモータルのルーツをひとつ以上持つ」で行う。
// サプリで再録された場合、キャラクターシート倉庫のルーツ番号は要確認。
function isMortal(data) {
    if("isMortal" in data) { return data.isMortal; }
    let array = [data.base.bloods.primary, data.base.bloods.secondary];
    let result = 0;
    for(let i of data.addRoots) {
        // 追加分のルーツについては、初期値の場合は追加しない
        if(i.bloodmanual || i.racemanual || i.root || i.rootmanual) { array.push(i); }
    }
    for(let b of array) {
        // ハーミットに属するルーツはcontinue この時、モータルのルーツがあったかを記録しておく
        // if(b.blood === "ハーミット" && b.root === "12") <= サプリ発売後にキャラシ倉庫が更新された場合のデータを予想
        if(b.blood === "手動入力" && b.rootmanual === "モータル") { result += 1; continue; }
        // 巫女については、サプリ発売後にキャラシ倉庫が更新された場合この行を削除する。
        if(b.blood === "手動入力" && b.rootmanual === "巫女") { continue; }
        if(b.blood === "ハーミット") { continue; }
        // それ以外のブラッドの場合、即座にfalseとなる
        data.isMortal = false;
        return false;
    }
    data.isMortal = result > 0;
    return data.isMortal;
}

// 呪われし者かどうかの判定。キャラクター駒作成にあたって「反動」のリソースの要不要判断に用いる。
// サプリで再録された場合、キャラクターシート倉庫のルーツ番号は要確認。
function isCursedOne(data) {
    if("isCursedOne" in data) { return data.isCursedOne; }
    for(let b of [data.base.bloods.primary, data.base.bloods.secondary].concat(data.addRoots)) {
        if(b.blood === "手動入力" && b.rootmanual === "呪われし者") {
            data.isCursedOne = true;
            return true;
        }
        // if(b.blood === "ストレンジャー" && b.root === "9") { return true; }
    }
    data.isCursedOne = false;
    return false;
}

// 大罪持ちPCかどうかの判定。キャラクター駒作成にあたって「大罪」のリソースの要不要判断に用いる。
function hasGreatGuilty(data) {
    if("hasGG" in data) { return data.hasGG; }
    // 絆データの「種別」に「大罪」の文字を含む行があれば、大罪持ちとして扱う
    for(let b of data.binds) {
        if(!b || !b.type) { continue; }
        if(b.type.match(/大罪/)) {
            data.hasGG = true;
            return true;
        }
    }
    // そうでなければ、アーツの一覧を確認。種別に「大罪」の文字が見つかれば、大罪持ちとして扱う
    for(let a of data.arts) {
        if(!a || !a.type) { continue; }
        if(a.type.match(/大罪/)) {
            data.hasGG = true;
            return true;
        }
    }
    data.hasGG = false;
    return false;
}

// キャラクターの種別を取得
function getCharacterKinds(data) {
    if("allKinds" in data) { return data.allKinds; }
    let array = [data.base.bloods.primary, data.base.bloods.secondary];
    let result = [];
    for(let i of data.addRoots) {
        // 追加分のルーツについては、初期値の場合は追加しない
        if(i.bloodmanual || i.racemanual || i.root || i.rootmanual) { array.push(i); }
    }
    let kindExtractor = (blood) => {
        switch(blood) {
            case "イレギュラー":
                return "人間";
            case "ヴァンパイア":
                return "吸血";
            case "エトランゼ":
                return "来訪";
            case "スピリット":
                return "精霊";
            case "セレスチャル":
                return "神聖";
            case "デーモン":
                return "魔界";
            case "ネイバー":
                return "亜人";
            case "ハーミット":
                return "人間";
            case "フルメタル":
                return "機械";
            case "レジェンド":
                return "概念";
            case "ヴォイド":
                return "概念";
            case "ストレンジャー":
                return "来訪";
            case "コズミックホラー":
                return "邪神";
            case "ダークカルテル":
                return "人間";
            case "ジャイガント":
                return "怪獣";
            default:
                return "";
        }
    };
    for(let b of array) {
        let k = "";
        switch(b.blood) {
            case "手動入力":
                if(b.racemanual) {
                    k = b.racemanual;
                } else {
                    k = kindExtractor(b.bloodmanual);
                }
                break;
            default:
                k = kindExtractor(b.blood);
                break;
        }
        if(k) { result.push(k); }
    }
    data.allKinds = result;
    return data.allKinds;
}

// エラーが生じた場合にそれをpalette_errorに挿入する
function alertFormulaMakingErrors(obj, mode=null) {
    let s = "";
    if(obj) {
        s += ("cost" in obj ? `《${obj.name}》` : `「${obj.name}」`) + (mode ? mode : "");
    } else {
        s += "（作成エラー）" + (mode ? mode : "");
    }
    if(!appo.palette_error.includes(s)) { appo.palette_error.push(s); }
    console.log("エラーログ挿入: " + s);
}

// オンラインセッションツールに応じたセクションヘッダー／フッターの作成
// subhead: 見出し文, array: チャットパレット作成結果が格納された配列
function addSubHeadersAndFooterByTool(subhead, array = []) {
    switch(appmp.system_selected) {
        case "ユドナリウムリリィ":
            array.unshift(`//---${subhead}`);
            array.push("");
            break;
        case "Tekey":
            array.unshift(`###${subhead}`);
            array.push("###");
            break;
        default:
            array.unshift(`■${subhead} ` + "-".repeat(10));
            array.push("");
            break;
    }
    return array;
}

// keyから能力値名を日英相互変換  key: オブジェクトのkey  lang:変換後の言語 j/日本語 e/英語
function abilityName(key, lang="j") {
    switch(lang) {
        case "j":
            if(key.length == 2) { return key; }
            return ABILITIES.etj[key];
        case "e":
            if(key.length > 2 ) { return key; }
            return ABILITIES.jte[key];
    }
    return void 0;
}

// 日本語の予約語を取得
function abilityNameForReservedWord(key, mode = "h") {
    // 「絆」がkeyに指定されている場合はそのまま返還
    if(key === "絆数" || key === "binds") { return "絆数"; }
    // 《魔獣化》中のmode === "b"が指定されている場合は 魔● に変換して返す
    return ((mode === "b" ? "魔" : "") + abilityName(key, "j")).substr(0, 2);
}

// keyから【基本能力値】か【戦闘能力値】を、キャラクターシート倉庫のkeyと同じ形式で返却
function abilityType(key) {
    // 例外として、「絆数」がkeyに与えられている場合は即return
    if(key === "絆数") { return void(0); }
    // 日本語名のkeyを与えられた場合は、英語名に変換
    if(key.length == 2) { key = abilityName(key, "e"); }
    // keyから基本能力値か戦闘能力値かをチェック
    if(["body", "skill", "emotion", "divine", "society"].includes(key)) {
        return "baseAbility";
    } else if(["combat", "shoot", "dodge", "action"].includes(key)) {
        return "battleAbility";
    }
    // 当てはまらない場合はnull
    return void(0);
}

// 文字列の加工：文字列の誤解釈を誘発する < > " ' & を、文字実体参照の表記に変換。ユドナリウム用。
function str_changeToEntityReferences(str) {
    if(!str) { return ""; }
    str = str.replace(/[<>"'&]/g, function(s) { return DICTIONARY_TO_ENTITY_REFERENCES[s]; });
    return str;
}

// 文字列の加工：【能力値】表記が絡む表記を加工しやすいようにコンバート
function str_process_ScoreToPreText(str) {
    if(!str) { return ""; }
    return str.replace(/[\[\]【】［］\{\}｛｝値\r\n\s]/g, "")
              .replace(/(肉体|技術|感情|加護|社会|白兵|射撃|回避|行動|魔肉|魔技|魔感|魔加|魔社|魔白|魔射|魔回|魔行|絆数)/g, "【$&】");
}

// 魔獣化中テキストの切り分け
function separateBeastFormula(str, mode="h", obj=null) {
    // console.log(str, mode, obj);
    // 【能力値】表記が絡む表記を加工しやすいようにコンバート
    // 丸括弧以外で使われそうな括弧の剥奪、空白文字の削除、全角文字の符号を半角文字に変換
    // (#～～)で書かれた式の部分は、代替の文字を用意して括弧を外す
    str = str.replace(/[\[\]【】［］\{\}｛｝値\r\n\s]/g, "")
             .replace(/(肉体|技術|感情|加護|社会|白兵|射撃|回避|行動|魔肉|魔技|魔感|魔加|魔社|魔白|魔射|魔回|魔行|絆数)/g, "{$&}")
             .replace(/[Ａ-Ｚａ-ｚ０-９＋－（）]/g, function(s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); } )
             .replace(/×/g, "*")
             .replace(/÷/g, "/")
             .replace(/\(:(.*?)\)/g, '&qformer;$1&qlatter;');
    // 文中に「LV」があり、アーツデータ（obj.levelが存在するもの）がある場合、アーツに設定されたデータに置き換える。
    // この時、計算式で「×」を「*」に変換しておく。
    if(obj && "level" in obj) {
        // console.log("レベルチェック");
        if(obj.level && obj.level.replace(/\r\n\s/g, "").match(/^\d+$/)) {
            // console.log("レベルチェック2");
            str = str.replace(/LV/ig, `${parseInt(obj.level.replace(/\r\n\s/g, ""), 10)}`);
        }
    }
    // modeによって返す文字列を変更
    let r = "";
    switch(mode) {
        case "h":
            r = str.replace(/\([^\(\)]*\)/gi, "");
            break;
        case "b":
            // 魔獣状態の攻撃力は( )内を考慮して作成する
            r = str;
            let str_regex = r.match(/([^\(\)]*)(?:\()([^\(\)]*)(?:\))/i);
            while (str_regex) {
                // 確認用 [0]:matchした文字列全体　[1]:( )の外側　[2]:( )の内側
                // console.log(str_regex);
                // console.log("str_regex[0]: " + str_regex[0]);
                // console.log("str_regex[1]: " + str_regex[1]);
                // console.log("str_regex[2]: " + str_regex[2]);
                // 置き換え用の文字列をリセット
                let regex_convert = void(0);
                // regex[2]の行頭が「+」か「-」の場合、補正値を単純に加算とみなして[1][2]両方を計上
                if(str_regex[2].match(/^[\+\-]/)) {
                    // console.log("チェック：[2]の行頭に符号");
                    regex_convert = [str_regex[1], str_regex[2]].join("");
                    // console.log(regex_convert);
                }
                // regex[1]とregex[2]の両方が途中で正負の符号を含む場合、式全体を置換するものとしてすべて置き換える
                if(str_regex[1].match(/^[^\+\-]*[\+\-].*/) && str_regex[2].match(/^[^\+\-]*[\+\-].*/)) {
                    // console.log("チェック：[1][2]の途中に符号");
                    if(!regex_convert) { regex_convert = str_regex[2]; }
                    // console.log(regex_convert);
                }
                // regex[1]が途中で正負の符号を含む場合、最後の+の直後のみがmatchするのでそこだけ書き換え
                if(str_regex[1].match(/[^\+\-]*[\+\-].*/)) {
                    // console.log("チェック：[1]の途中に符号");
                    if(!regex_convert){
                        let array_regex = str_regex[1].split(/(\+|\-)/g);
                        // console.log("array_regex", array_regex);
                        if(array_regex.length > 1) { array_regex.pop(); }
                        array_regex.push(str_regex[2]);
                        regex_convert = array_regex.join("");
                    }
                    // console.log(regex_convert);
                }
                // regexが上記のどれにも当てはまらなかった場合は、素直に全体を置き換える
                if(!regex_convert) { regex_convert = str_regex[2]; }
                r = r.replace(str_regex[0], regex_convert);
                // console.log("str_beast: " + r);
                // 書き換えた後の攻撃力式に( )がまだ残っているかを確認
                // 残っている場合はループを継続し、なくなるまで繰り返す
                str_regex = r.match(/([^\(\)]*)(?:\()([^\(\)]*)(?:\))/i);
            }
            break;
        default:
            break;
    }
    // 確認用
    // console.log("-----");
    // console.log("変換結果", `mode:${mode}`, r);
    // returnする文字列を作成
    return r.replace(/&qformer;(.*?)&qlatter;/g, "($1)").replace(/\((\d+?)\)/g, "$1");
}

// 各種能力値の文字を切り分ける データは数値型で返却
function getAblSeparated(str, def = 0) {
    if(!str) { return [def]; }
    let result = str.match(/[\-\d]+/g).map(str => parseInt(str, 10));
    return result ? result : [def];
}

// 【基本能力値】【戦闘能力値】のチェック データは数値型で返却
function getAblParams(data) {
    let result = {};
    for(let i of KEY_ABILITY) {
        result[i] = data[abilityType(i)][i].total.match(/[\-\d]+/g).map(str => parseInt(str, 10));
    }
    let agapey = 0;
    for(let j of data.binds) {
        if(j.type === "絆") { agapey += 1; }
    }
    result.binds = [agapey];
    return result;
}

//魔獣化中かそうでないかの状態にあわせ、キーから戦闘能力値を取得
function getParamsByMode(params, key, mode = "h") {
    let p = params[key];
    return mode === "b" ? p[p.length-1] : p[0];
}

// 判定修正値の取得 key:能力値の名称、mode:"人間"か"魔獣"か
function calc_mod(key, mode = "h") {
    let i = [];
    let data = JSON.parse(JSON.stringify(appo.mods.score_list));
    // console.log("修正値の取得", key, mode, data);
    i.push(data.all.a);
    i.push(mode === "h" ? data.all.h : data.all.b);
    if(abilityType(key)) {
        i.push(data[abilityType(key)].a);
        i.push(mode === "h" ? data[abilityType(key)].h : data[abilityType(key)].b);
    }
    if(data[key]) {
        i.push(data[key].a);
        i.push(mode === "h" ? data[key].h : data[key].b);
    }
    let result = i.reduce((sum, el) => sum + el, 0);
    return result;
}

// ファンブル値の取得 key:能力値の名称、mode:"人間"か"魔獣"か
function calc_fumble(key, mode = "h") {
    let i = 0;      // ファンブル値
    let a = false;  // ファンブルしても達成値が0にならないモードの有無
    let data = JSON.parse(JSON.stringify(appo.mods.arts_fumble));
    // ログのチェック
    // console.log("ファンブル値の取得", key, mode, data);
    // 《ダメ魔物》
    if(data.includes("ダメ魔物") && mode === "b") { i += 2; }
    // 《しまった、こんな時に！》
    if(data.includes("しまった、こんな時に！")) {
        if(data.includes("ダメ魔物") && mode === "h") {
            a = true;
        } else if(!data.includes("ダメ魔物") && mode === "b") {
            a = true;
        }
    }
    // 《偉大なる血脈》
    if(data.includes("偉大なる血脈")) { i += 1; }
    // 《この世ならざるもの》
    if(data.includes("この世ならざるもの")) { a = true; }
    // 《不思議科学》
    if(data.includes("不思議科学")) { i += 1; }
    // 《身体強化処置》
    if(data.includes("身体改造処置") && abilityType(key) === "baseAbility" ) { i += 1; }
    // 《精神強化処置》
    if(data.includes("精神強化処置") && abilityType(key) === "battleAbility") { i += 1; }
    // 《不安定なる高性能》※魔獣化中のファンブル値のみ反映
    if(data.includes("不安定なる高性能") && mode === "b") { i += 1; }
    // 《契約代償：不運》
    if(data.includes("契約代償：不運")) { i += 2; }
    // 《秘されし真名》
    if(data.includes("秘されし真名") && mode === "b") { i += 1; }
    // 文字列の作成
    return { value: i, flag: a };
}

// 登場時の人間性低下ダイスロール部分を作成
function outputSceneEntry() {
    let result = [
        "1D6KH1 シーン登場時の人間性低下",
        "2D6KH1 【迫害状態】シーン登場時の人間性低下"
    ].map(str => (appo.general.session_tool === "ユドナリウムリリィ" ? ":人間性-" : "") + str);
    result = addSubHeadersAndFooterByTool("シーン登場時の処理", result);
    return result.join("\n");
}

// 判定文の作成：統括 ver3 , data: キャラクターシート倉庫から出力したデータ
function outputAllJudgeTextsV3(data) {
    // データの初期設定
    let text_pool = [];
    let text_pool_beast = [];
    let resource = [];
    // 作成する判定文の作成 (1) 通常の汎用判定
    for(let i of KEY_ABILITY) {
        resource.push({ str: `【${abilityName(i, "j")}】`, obj: void(0), type: "general" });
    }
    // 作成する判定文の作成 (2) 堕落判定 ※オプション項目
    if(appo.general.output_resistFalldown) {
        resource.push({ str: "【絆数】", obj: void(0), type: "general" });
    }
    // 作成する判定文の作成 (3) アーツの判定
    for(let art of data.arts) {
        if(!art || !art.name || !art.judge || art.judge.match(/(?:自動|成功|効果|参照)/) || art.judge === "0") { continue; }
        resource.push({ str: str_process_ScoreToPreText(art.judge), obj: art, type: "arts" });
    }
    // 作成する判定文の作成 (4) 武器の命中判定
    for(let weapon of data.weapons) {
        if(!weapon || !weapon.name || !weapon.judge || weapon.judge === "0") { continue; }
        let str_w = str_process_ScoreToPreText(weapon.judge);
        // 数値のみの場合、定数として扱うかプラス修正として扱うかのチェック
        if(str_w.match(/^\d+$/) && appo.damagerolls.judge_head_number === "プラスの修正として扱う") {
            str_w = "+" + str_w;
        }
        let wep_judge = [];
        if(str_w.match(/^[\+\-]/) && weapon.type) {
            // console.log(weapon.name, weapon.type, weapon.judge);
            if(weapon.type.match(/白/)) {
                wep_judge.push({ str: "【白兵】" + str_w, obj: weapon, type: "weapons" });
            }
            if(weapon.type.match(/射/)) {
                wep_judge.push({ str: "【射撃】" + str_w, obj: weapon, type: "weapons" });
            }
            if(weapon.type.match(/乗/) && wep_judge.length === 0) {
                wep_judge.push({ str: `【${checkVehicleAttackType(weapon)}】` + str_w, obj: weapon, type: "weapons" });
            }
            // console.log(wep_judge);
            // console.log(resource);
        } else {
            wep_judge.push({ str: str_w, obj: weapon, type: "weapons" });
        }
        if(wep_judge.length > 0) { resource = resource.concat(wep_judge); }
    }
    // それぞれの判定文を回す
    for(let r of resource) {
        let check = checkJudgeTextAddType(r.type);
        // アーツ／武器かつ「追加しない」オプションの場合はスキップ
        if(r.type !== "general" && check === "追加しない") { continue; }
        // 人間状態の判定式を作成
        // try-catch でエラーが起きた場合の中断を回避し、エラーメッセージになるよう変換する
        let str_h;
        try {
            str_h = makeJudgeTextV3(r.str, getAblParams(data), "h", r.type, r.obj);
        }
        catch(e) {
            console.log(e.message);
            str_h = {text: "**Error: 式作成に失敗しました** ", note: `${r.obj.name} 判定`};
            alertFormulaMakingErrors(r.obj, "判定");
        }
        // 《魔獣化》中の判定式を作成
        // try-catch でエラーが起きた場合の中断を回避し、エラーメッセージになるよう変換する
        let str_b;
        try {
            str_b = makeJudgeTextV3(r.str, getAblParams(data), "b", r.type, r.obj);
        }
        catch(e) {
            console.log(e.message);
            str_b = {text: "**Error: 式作成に失敗しました** ", note: `${r.obj.name} 判定（《魔獣化》中）`};
            alertFormulaMakingErrors(r.obj, "判定");
        }
        // 人間／魔獣の式に差がない場合、魔獣化中の式は追加しないようにする
        if(str_b.text === str_h.text) { str_b.text = ""; }
        // アーツ／武器かつ「重複は省略」の場合、すでに同等の式が存在する場合は省略する
        if(r.type !== "general" && check === "重複は省略" && str_h.text ) {
            if(text_pool.concat(text_pool_beast).join("\n").split(str_h.text).length > 1) {
                str_h.text = "";
            }
        }
        if(r.type !== "general" && check === "重複は省略" && str_b.text ) {
            if(text_pool.concat(text_pool_beast).join("\n").split(str_b.text).length > 1) {
                str_b.text = "";
            }
        }
        // 結果を追加
        if(appo.general.sort_type === "【能力値】ごと") {
            if(str_h.text) { text_pool.push((str_h.text + str_h.note).replace(/\r?\n/g, '')); }
            if(str_b.text) { text_pool.push((str_b.text + str_b.note).replace(/\r?\n/g, '')); }
        } else {
            if(str_h.text) { text_pool.push((str_h.text + str_h.note).replace(/\r?\n/g, '')); }
            if(str_b.text) { text_pool_beast.push((str_b.text + str_b.note).replace(/\r?\n/g, '')); }
        }
    }
    if(text_pool_beast.length > 1) {
        text_pool_beast.unshift('----------');
    }
    text_pool = addSubHeadersAndFooterByTool("一般的な判定", text_pool.concat(text_pool_beast));
    return text_pool.join("\n");
}

// 追加モードの判定
function checkJudgeTextAddType(type) {
    switch(type) {
        case "general":
            return "全て表示";
        case "arts":
            return appo.arts.judge_type;
        case "weapons":
            return appo.damagerolls.judge_type;
    }
}

// 乗り物の白兵/射撃攻撃判定 , item: 乗り物
function checkVehicleAttackType(item) {
    // 種別に「魔艦」を含む乗り物はすべて射撃攻撃扱い
    if(item.type && item.type.match(/魔艦/)) { return "射撃"; }
    // 以下の名称の乗り物は特別に射撃攻撃扱い。名前か備考欄にこの文字を含む場合、射撃攻撃として扱う（備考欄を参照するのは「●●相当」と書かれることを想定して）
    let re = /(コスモマシン|アームドヴィークル|戦闘飛装脚|要塞宝具)/;
    if(item.name && item.name.match(re)) { return "射撃"; }
    if(item.notes && item.notes.match(re)) { return "射撃"; }
    return "白兵";
}

// 判定文の作成・ver3 - text: 加工する式の原型, params: データから抽出した【能力値】一覧, mode: "h"人間状態/"b"魔獣化状態, type:一般判定かアーツ、アイテムか, obj:アーツ、アイテムのデータ
function makeJudgeTextV3(text, params, mode="h", type="general", obj=null) {
    // 想定するtext: 【肉体】や【肉体】+2や【肉体】+2@-1#+1　など
    let sys = appmp.system_config();
    // console.log(sys);
    let cri = 0;
    let fum = 0;
    let min = 0;
    let abl = "";
    let result = [sys.prefix + "2BB"];
    // テキストの確認
    // console.log("テキストチェック", text);
    // 魔獣化の有無を加味したテキストの編集
    text = separateBeastFormula(text, mode, obj);
    // これを回すと【～】を{～}に変換してしまうので、戻す
    text = str_process_ScoreToPreText(text);
    // console.log(text);
    // 使用する能力値の取得
    let matches = /【(肉体|技術|感情|加護|社会|白兵|射撃|回避|行動|絆数)】/.exec(text);
    // console.log("使用する能力値の取得", matches);
    if(matches) { abl = abilityName(matches[1], "e"); }
    // abl取得失敗の場合は空文字列をreturn
    // if(!abl) { return ""; }
    // 基礎クリティカル値修正の取得
    text = text.replace(/@([\+\-]\d+)/, function(s, p1) { cri = parseInt(p1, 10); return ""; });
    // console.log("C値チェック後", text, `Cri: ${cri}`);
    // 基礎ファンブル値修正の取得
    text = text.replace(/#([\+\-]\d+)/, function(s, p1) { fum = parseInt(p1, 10); return ""; });
    // console.log("F値チェック後", text, `Fum: ${fum}`);
    // 判定のダイス最低保証の取得
    text = text.replace(/&(\d)/, function(s, p1) { min = parseInt(p1, 10); return ""; });
    // console.log("最低保証チェック後", text, `min: ${min}`);
    // テキストの置換を開始
    // console.log(text);
    text = text.replace(/【(肉体|技術|感情|加護|社会|白兵|射撃|回避|行動|絆数)】/,
        function(s) {
            if(mode === "b" && params[abl].length > 1) {
                result.push(`+{${abilityNameForReservedWord(abl, "b")}}`);
            } else {
                result.push(`+{${abilityNameForReservedWord(abl, "h")}}`);
            }
            return "";
        });
    // 残った文字列から空白文字を削除し、基礎修正値を取得
    text = text.replace(/(\r?\n|\s+)/g, "");
    // let mod_base = parseInt(text, 10);
    console.log(text, type, obj ? obj.name : "none");
    // テキストをどこまで計算する？
    if(text && appo.general.output_judgeTextCalculated) {
        let mod_base = evalCalculation(text.replace(/^\+(.*)/, "$1").replace(/[^\d\+\-\*\/]/g, ""));
        let mod_sum = calc_mod(abl, mode) + (mod_base ? mod_base : 0);
        if(mod_sum !== 0) {
            result.push(mod_sum > 0 ? `+${mod_sum}` : `${mod_sum}`);
        }
    } else if(text) {
        result.push(text.match(/^[\+\-]/) ? text : `+${text}`);
        if(calc_mod(abl, mode) !== 0) {
            result.push(calc_mod(abl, mode) > 0 ? `+${calc_mod(abl, mode)}` : `${calc_mod(abl, mode)}`);
        }
    } else {
        if(calc_mod(abl, mode) !== 0) {
            result.push(calc_mod(abl, mode) > 0 ? `+${calc_mod(abl, mode)}` : `${calc_mod(abl, mode)}`);
        }
    }
    // 人間性の表記・クリティカル値の表記
    if(sys.cite_hum) {
        // 人間性の引用ができる場合、「人間性」のコマンド表記を使ってBOTに計算させる
        result.push("%{人間性}");
        if(cri !== 0) {
            result.push(cri > 0 ? `@+${cri}` : `@${cri}`);
        }
    } else {
        // 人間性の引用が出来ない場合、クリティカル値の表記を「@12-cri」として対応
        if(cri > 0) {
            result.push(`@12+${cri}`);
        } else if(cri < 0) {
            result.push(`@12${cri}`);
        } else if(cri === 0) {
            result.push(`@12`);
        }
    }
    // ファンブル値のチェック
    let f = calc_fumble(abl, mode);
    if(f.value + fum !== 0 | f.flag) {
        result.push("#" + (f.flag ? "A" : "") + (f.value + fum >= 0 ? `+${f.value+fum}` : `${f.value+fum}`));
    }
    // 最低保証値のチェック
    if(min > 0) { result.push(`&${min}`); }
    // 判定解説文前の半角スペースを追加
    result.push(" ");
    // 判定解説文の追加（基本的な判定のみ）
    let judgeNote = "";
    if(type === "general") {
        if(abl === "binds") {
            judgeNote = "堕落判定（絆数の部分は必要に応じて書き換えること）" + (mode === "b" ? "（《魔獣化》中）" : "");
        } else {
            judgeNote = `【${abilityName(abl, "j")}】判定` + (mode === "b" ? "（《魔獣化》中）" : "");
        }
    } else {
        switch(type) {
            case "arts":
                judgeNote = `《${obj.name}》判定`;
                // 「種別：魔獣」を含むかどうかを確認。
                // 《魔獣化》中でないと使用できないものは人間状態の判定式を削除。
                // 《魔獣化》中専用のものは（《魔獣化》中）の文言をつけない。
                if(obj.type && obj.type.match(/魔獣/)) {
                    if(mode === "h") { result = []; }
                } else {
                    if(mode === "b") { judgeNote += "（《魔獣化》中）"; }
                }
                break;
            case "weapons":
                judgeNote = `「${obj.name}」判定`;
                // 「種別：魔獣」を含むかどうかを確認。
                // 《魔獣化》中でないと使用できないものは人間状態の判定式を削除。
                // 《魔獣化》中専用のものは（《魔獣化》中）の文言をつけない。
                if(obj.type && obj.type.match(/魔獣/)) {
                    if(mode === "h") { result = []; }
                } else {
                    if(mode === "b") { judgeNote += "（《魔獣化》中）"; }
                }
                break;
        }
    }
    // 結合して文字列でreturn　この時、+が2つかさなっている、+-になっているところは削除
    return {text: result.join("").replace(/(\+{2,}|\+\-)/g, "+"), note: judgeNote};
}

// 一般的な行動のテキストを作成
function outputGeneralActions(data) {
    if(!appo.advanced_order.usable["一般的な行動"]) { return ""; }
    // 基本テキストの出力
    let result = [
        "※アクションなし",
        "ムーブ - 通常移動",
        "メジャー - 離脱移動"
    ];
    // 武器の攻撃宣言表示
    for(let i of data.weapons) {
        if(!i || !i.attack || !i.name || !i.type) { continue; }
        let declare = [];
        if(i.type.match(/白/)) { declare.push(`メジャー - 「${i.name}」で白兵攻撃`.replace(/\r?\n/g, '')); }
        if(i.type.match(/射/)) { declare.push(`メジャー - 「${i.name}」で射撃攻撃`.replace(/\r?\n/g, '')); }
        if(i.type.match(/乗/) && declare.length == 0) { declare.push(`メジャー - 「${i.name}」で${checkVehicleAttackType(i)}攻撃`.replace(/\r?\n/g, '')); }
        result = result.concat(declare);
    }
    result = addSubHeadersAndFooterByTool("一般的な行動", result);
    return result.join("\n");
}

// アーツデータの出力
function outputArts(data) {
    let result = makeActionsTextV3(data.arts);
    if(result.length > 0) { result = addSubHeadersAndFooterByTool("アーツ一覧", result); }
    return result.join("\n");
}

// アイテムデータの出力
function outputItems(data) {
    let result = makeActionsTextV3(data.items);
    if(result.length > 0) { result = addSubHeadersAndFooterByTool("アイテム一覧", result); }
    return result.join("\n");
}

// アーツ・アイテムデータの宣言式作成
function makeActionsTextV3(objs) {
    // モータルかどうかを確認
    let result = [];
    for(let i of objs) {
        if(!i || !i.name) { continue; }
        if(!appo.arts.timing_empty && !i.timing) { continue; }
        if(!appo.arts.timing_auto && i.timing === "常時") { continue; }
        let s = "";
        if(i.timing) { s += `${i.timing} -`; }
        s += makeObjectNameText(i);
        if("cost" in i) {
            if(appo.arts.include_cost && i.cost && i.timing !== "常時") {
                if(appmp.system_selected === "ユドナリウムリリィ") {
                    s += `（コスト ${makeUdonariumLilyCostText(i.cost)} ）`;
                } else {
                    s += makeOtherToolCostText(i.cost);
                }
            }
        }
        if(i.notes && appo.arts.include_note) { s += "：" + i.notes.replace(/\(:(.*?)\)/g, "($1)"); }
        result.push(s.replace(/\r?\n/g, ''));
    }
    return result;
}

// ユドナリリィ：コストの文字列作成 cost: コストの文字列
function makeUdonariumLilyCostText(cost) {
    // 結果をpushする配列を確保
    let result = [];
    let mortal = isMortal(appmp.main_data);
    // 「効果参照」の文字列を含む場合はそのまま返却
    if(cost.match(/効果参照/)) { return "効果参照"; }
    // 空白文字、改行の消去
    cost = cost.replace(/(\r?\n|\s+)/g, '');
    // 愛・罪・大罪コストの抽出
    cost = cost.replace(/(愛|罪|大罪)/g, function(s, p1) { result.push(`:${p1}-1`); return ""; });
    // 定数の反動ポイントをコストにするアーツの抽出
    cost = cost.replace(/反動(\d+)/g, function(s, p1) { result.push(`:反動-${p1}`); return ""; });
    // 行頭の+を削除（《内なる獣》などの「愛+3」「罪+3」のような構文を回避）
    cost = cost.replace(/^\+/, "");
    if(cost.match(/^([\+\-]?\d+)+$/)) {
        // コストの記載が数値と正負符号のみの場合、合算する。モータルの【FP】代替にも対応
        let r = [...cost.matchAll(/[\+\-]?\d+/g)].reduce((acc, cur) => parseInt(acc,10) + parseInt(cur,10), 0);
        result.push(mortal ? `:FP-${r*2}` : `:人間性-${r}`);
    } else if(cost.match(/^[^\+\-][D\d\+]+$/i)) {
        // 1D6+5 や 2D6 など。正規表現としては「先頭が+、-以外」＆「数字とDと+」でのみ構成される場合。
        // ( )書きで囲むことで対応。こちらもモータルの【FP】代替に対応
        result.push(mortal ? `:FP-(${cost})*2` : `:人間性-(${cost})`);
    } else {
        // それ以外の場合、リソース操作と直結しない形で直接書き下す
        result.push(`${cost}`);
    }
    // ユドナリリィのリソース操作コマンドの仕様に合わせ、配列を連結した文字列にすることで連続記述
    return result.join("");
}

// その他のコスト文字列作成 cost: コストの文字列
function makeOtherToolCostText(cost) {
    let mortal = isMortal(appmp.main_data);
    if(cost.match(/^[\+\-]?\d+$/)) {
        let r = [...cost.matchAll(/[\+\-]?\d+/g)].reduce((acc, cur) => parseInt(acc, 10) + parseInt(cur, 10), 0);
        return mortal ? `（コスト：【FP】${r*2}点）` : `（コスト：${r}）`;
    } else if(cost.match(/^[^\+\-][D\d\+]+$/i)) {
        return mortal ? `（コスト：【FP】(${cost})×2点）` : `（コスト：${cost}）`;
    } else {
        return `（コスト：${cost}）`;
    }
}

// アーツ、アイテムの宣言名作成
function makeObjectNameText(obj) {
    if(!obj || !obj.name) { return ""; }
    let str = "";
    // "cost"のkeyがあるかでアーツかどうかを判定
    if("cost" in obj) {
        str = `《${obj.name}》`;
        // アーツの場合、レベル表示設定も反映
        if(obj.level && !isNaN(parseInt(obj.level, 10))) {
            switch(appo.arts.display_level) {
                case "すべて省略":
                    break;
                case "『LV1』のみ省略":
                    if(parseInt(obj.level, 10) !== 1) { str += `LV${parseInt(obj.level, 10)}`; }
                    break;
                default:
                    str += `LV${parseInt(obj.level, 10)}`;
            }
        }
    } else {
        str = `「${obj.name}」`;
    }
    return str;
}

// リアクション宣言の作成
function outputGeneralReactions(data) {
    if(!appo.advanced_order.usable["リアクション"]) { return ""; }
    // 基本的なデータを作成
    let result = ["リアクション不可/放棄", "リアクション - ドッジ"];
    // 武器データからガード値データを取得
    for(let i of data.weapons) {
        if(!i || !i.name || !i.guard) { continue; }
        let h = [...separateBeastFormula(i.guard, mode="h").matchAll(/[\+\-\d]+/g)].reduce((acc, cur) => parseInt(acc,10)+parseInt(cur,10), 0);
        let b = [...separateBeastFormula(i.guard, mode="b").matchAll(/[\+\-\d]+/g)].reduce((acc, cur) => parseInt(acc,10)+parseInt(cur,10), 0);
        let str_h = "";
        let str_b = "";
        if(h) {
            str_h = `リアクション - ${makeObjectNameText(i)}でガード（ガード値：${h}）`.replace(/\r?\n/g, '');
        }
        if(b) {
            str_b = `リアクション - ${makeObjectNameText(i)}でガード【魔獣化中】（ガード値：${b}）`.replace(/\r?\n/g, '');
        }
        if(i.type && i.type.match(/魔獣/)) {
            str_h = "";
        } else {
            if(h === b) { str_b = ""; }
        }
        if(str_h) { result.push(str_h); }
        if(str_b) { result.push(str_b); }
    }
    result = addSubHeadersAndFooterByTool("一般的なリアクション宣言", result);
    return result.join("\n");
}

// ダメージロール式の出力
function outputDamageRoll(data) {
    let result = [];
    let resource = [];

    // ※アーツ、アイテムデータ等から特殊攻撃系の [ ] で囲まれた文字列を検索するアロー関数
    let spAttackFormulas = (objs) => {
        let result = [];
        for(let a of objs) {
            if(!a || !a.notes) { continue; }
            // ダメージロール式の検索。[ ]内に囲まれた式が「数字」「符号」のいずれも入っていない場合、式を追加しない。
            let sp = a.notes.match(/(?:\[|［)(.*?)(?:\]|］)/);
            if(!sp || !sp[1].match(/[\d\+\-]/)) { continue; }
            // 属性データの検索
            let attr_arts_matched = a.notes.match(/[<〈](肉体|技術|感情|加護|社会)[>〉]/);
            let attr_arts = attr_arts_matched ? abilityName(attr_arts_matched[1], "e") : "";
            // データを追加
            result.push({text: sp[1], obj: a, attr: attr_arts});
        }
        return result;
    };

    // アイテムデータを追加
    for(let w of data.weapons) {
        if(!w || !w.name || !w.attack || !w.attribute) { continue; }
        resource.push({text: w.attack, obj: w, attr: w.attribute});
    }
    // オプションで選択されている場合、アーツデータを追加
    // console.log("特殊攻撃チェック", appo.damagerolls.include_sp_attack);
    if(appo.damagerolls.include_sp_attack) {
        let spAttackArts = spAttackFormulas(data.arts);
        // console.log("特殊攻撃チェック/アーツ", spAttackArts);
        let spAttackItems = spAttackFormulas(data.items);
        // console.log("特殊攻撃チェック/アイテム", spAttackItems);
        resource = resource.concat(spAttackArts, spAttackItems);
    }
    // console.log("データチェック", resource);
    // データを回す
    for(let r of resource) {
        // console.log("ダメージ編集", r);
        let h = makeDamageRollTextV3(r.text, getAblParams(data), r.obj, abilityName(r.attr, "e"), "h");
        let b = makeDamageRollTextV3(r.text, getAblParams(data), r.obj, abilityName(r.attr, "e"), "b");
        // 種別：魔獣のあるデータは、人間状態のデータを参照しない
        if(r.type && r.type.match(/魔獣/)) { h.text = ""; }
        // 人間状態のテキストがあり、人間状態と魔獣化中のテキストが一致する場合、魔獣化中のデータを参照しない
        if(h.text && h.text === b.text) { b.text = ""; }
        if(h.text) { result.push((`${h.text}${h.note}`).replace(/\r?\n/g, "")); }
        if(b.text) { result.push((`${b.text}${b.note}`).replace(/\r?\n/g, "")); }
    }
    if(result.length > 0) {
        result = addSubHeadersAndFooterByTool("ダメージロール一覧", result);
    }
    return result.join("\n");
}

// ダメージロール式の作成・ver3 - obj: アーツorアイテムデータ, params: データから抽出した【能力値】一覧, mode: "h"人間状態/"b"魔獣化状態
function makeDamageRollTextV3(text, params, obj, attr, mode="h") {
    // 使用する変数データのチェック
    // textの先頭が正負の符号で始まり、objがアイテムデータの場合、属性を先頭に付け加える
    if(text.match(/^[\+\-]/) && ("attack" in obj)) {
        switch(mode) {
            case "h":
                text = `${abilityName(attr, "j")}` + text;
                break;
            case "b":
                // 魔獣化中のデータの場合、paramsの内容を見て確定
                if(attr) {
                    // console.log(attr, params);
                    // console.log(params[attr]);
                    text = (params[attr].length > 1 ? `${abilityNameForReservedWord(attr, "b")}` : `${abilityNameForReservedWord(attr, "h")}`) + text;
                }
                break;
        }
    }
    // modeにあわせたテキストの加工
    let str = separateBeastFormula(text, mode, obj).replace(/\+{2,}/g, "+") + " ";
    if(appmp.system_selected === "TRPGスタジオ") { str = "/d " + str; }
    // 説明用テキストの出力
    let note = makeObjectNameText(obj);
    if(mode === "b") { note += "【魔獣化中】"; }
    if(attr) { note += `／〈${abilityName(attr, "j")}〉属性`; }
    if("attack" in obj && appo.damagerolls.include_note && obj.notes) { note += `：${obj.notes}`; }
    // データの返却
    return {text: str, note: note};
}

// 予約語と対応文字列の出力
function outputReservedValues(data) {
    let result = [];
    let params = getAblParams(data);
    let sys = appmp.system_config();
    // 予約語に対応していないか、チャットパレットに予約語の変数を記載できない場合は出力なし
    if(!sys.reserved || !sys.param_palette) { return ""; }
    // 駒にステータス・パラメータを引用できないツールの場合、すべての人間状態の値を記載する
    if(!sys.param_pone) {
        // 絆数も入れておく
        result.push(`//絆数=${params.binds[0]}`);
        for(let i of KEY_ABILITY) {
            let s = `//${abilityName(i)}=${params[i][0]}`;
            result.push(s);
        }
    }
    // チャットパレットに魔獣化中限定の値を作成
    if(sys.param_palette) {
        for(let i of KEY_ABILITY) {
            if(params[i].length === 1) { continue; }
            let a = params[i][1] - params[i][0];
            if(a === 0) { continue; }
            let s = `//${abilityNameForReservedWord(i, "b")}={${abilityName(i)}}` + (a > 0 ? `+${a}` : `${a}`);
            result.push(s);
        }
    }
    // 記載される項目がひとつ以上ある場合、見出しを付ける
    if(result.length > 0) {
        result = addSubHeadersAndFooterByTool("能力値関連", result);
    }
    return result.join("\n");
}

// 汎用リソース操作パレット（ココフォリア、ユドナリウムリリィ）
function outputResourceOperator(data) {
    // オンセツール限定の処理。該当しなければundefinedを返す
    if(!["ココフォリア", "ユドナリウムリリィ"].includes(appmp.system_selected)) { return void(0); }
    // 操作するリソースを取得
    let resource = ["FP", "人間性", "財産点", "愛", "罪"];
    if(hasGreatGuilty(data)) { resource.push("大罪"); }
    if(appo.general.output_resistFalldown) { resource.push("絆数"); }
    // リソース操作の文言に変換（現状、ココフォリアもユドナリウムも書式が同じ）
    let result = resource.map(str => `:${str}`);
    result = addSubHeadersAndFooterByTool("リソース操作パレット", result);
    return result.join("\n");
}

// 愛・罪の効果パレット
function outputAgapeyAndGuilty() {
    let resource_agapey = [
        "愛の効果「◆絆の修復」", "愛の効果「◆罪の効果を他者に適用」", "愛の効果「◆解放状態」"
    ].map(str => str + (appmp.system_selected == "ユドナリウムリリィ" ? " :愛-1" : ""));
    let resource_guilty = [
        "罪の効果「◆達成値増大」", "罪の効果「◆ダメージ増強」", "罪の効果「◆移し替え無効」",
        "罪の効果「◆回復」", "罪の効果「◆復活」", "罪の効果「◆真の死の回避」"
    ].map(str => str + (appmp.system_selected == "ユドナリウムリリィ" ? " :罪-1" : ""));
    let result = [].concat(resource_agapey, resource_guilty);
    result = addSubHeadersAndFooterByTool("愛・罪の効果", result);
    return result.join("\n");
}

// 予約語を実数値に変換する
function replaceReservedWordToValue(text, data) {
    let result = text.replace(/\{(肉体|技術|感情|加護|社会|白兵|射撃|回避|行動|魔肉|魔技|魔感|魔加|魔社|魔白|魔射|魔回|魔行)\}/g, function(s, p1) {
        if(abilityName(p1, "e")) {
            return `${getAblParams(data)[abilityName(p1, "e")][0]}`;
        }
        for(let a of KEY_ABILITY) {
            if(p1 === abilityNameForReservedWord(a, "b")) {
                return `${getAblParams(data)[a][1]}`;
            }
        }
        return "0";
    });
    return result;
}

// 絆・エゴの情報を駒に組み込む
function poneGenerator_passBindsData(data) {
    let result = [];
    for(let i = 0; i < Math.max(7, data.binds.length); i++) {
        if(data.binds[i]) {
            if(!data.binds[i].type) {
                result.push({type: "絆", name: "（絆未取得枠）"});
            } else {
                result.push(data.binds[i]);
            }
        } else if(i < 7) {
            result.push({type: "絆", name: "（絆未取得枠）"});
        }
    }
    // console.log(result);
    return result;
}

// ココフォリア：予約語と対応文字列の出力
function ccfolia_outputReservedValuesAsPoneStatus(data) {
    // キャラクター駒の情報にステータスを引用
    // キャラクター名
    appo.ccfolia_pone.name = data.base.name;
    // ステータスの設定
    ccfolia_outputStatusAndParams(data, "status");
    // パラメータの設定
    ccfolia_outputStatusAndParams(data, "params");
}

function ccfolia_outputStatusAndParams(data, mode) {
    let params = getAblParams(data);
    switch(mode) {
        case "status":
            // FP
            let fp = getAblSeparated(data.fp.total)[0];
            appo.ccfolia_pone.status.push({label: "FP", value: fp, max: fp});
            // 人間性
            let hum = getAblSeparated(data.humanity.total, 60)[0];
            appo.ccfolia_pone.status.push({label: "人間性", value: hum, max: hum});
            // 大罪持ちかどうかで処理変更
            if(hasGreatGuilty(data)) {
                appo.ccfolia_pone.status.push({label: "愛", value: params.binds[0], max: 5});
                appo.ccfolia_pone.status.push({label: "罪", value: 0, max: 6});
                appo.ccfolia_pone.status.push({label: "大罪", value: 0, max: 1});
            } else {
                appo.ccfolia_pone.status.push({label: "愛", value: params.binds[0], max: 6});
                appo.ccfolia_pone.status.push({label: "罪", value: 0, max: 7});
            }
            // 財産点
            appo.ccfolia_pone.status.push({label: "財産点", value: params.society[0], max:params.society[0]});
            // 呪われし者の場合、「反動ポイント」の項目をステータスに反映
            if(isCursedOne(data)) {
                appo.ccfolia_pone.status.push({label: "反動", value: 0, max: 0});
            }
            // 絆の数も操作できるようにしておく。オプション項目扱い（堕落判定対策）
            if(appo.general.output_resistFalldown) {
                appo.ccfolia_pone.status.push({label: "絆数", value: params.binds[0], max: (hasGreatGuilty(data) ? 5 : 6)});
            }
            break;
        case "params":
            // キャラクター駒の情報にパラメータを設定
            for(let i of KEY_ABILITY) {
                let p = {label: `${abilityName(i)}`, value: `${params[i][0]}`};
                appo.ccfolia_pone.params.push(p);
                if(params[i].length > 1) {
                    let a = params[i][1] - params[i][0];
                    if(a === 0) { continue; }
                    let b = {label: `${abilityNameForReservedWord(i, "b")}`, value: `{${abilityName(i)}}`+(a > 0 ? `+${a}` : `${a}`)};
                    appo.ccfolia_pone.params.push(b);
                }
            }
            break;
    }
}

// ココフォリア用テキストデータの作成
function poneGenerator_ccfolia(data) {
    let k = JSON.parse(JSON.stringify(appo.ccfolia_pone));
    let clip = {
        kind: "character",
        data: {
            name: k.name,
            memo: k.memo,
            initiative: getAblParams(data).action[0],
            externalUrl: appmp.main_data_url,
            status: k.status,
            params: k.params,
            width: k.size,
            height: k.size,
            active: k.active,
            secret: k.secret,
            invisible: k.invisible,
            hideStatus: k.hideStatus,
            color: k.color,
            commands: appo.palette
        }
    };
    return JSON.stringify(clip);
}

function udona_outputReservedValuesAsPoneStatus(data) {
    // baseStatus
    udonarium_outputStatusAndParams(data, "baseStatus");
    // baseParams
    udonarium_outputStatusAndParams(data, "baseParams");
    // memoBinds
    udonarium_outputStatusAndParams(data, "memoBinds");
}

function udonarium_outputStatusAndParams(data, mode) {
    let params = getAblParams(data);
    switch(mode) {
        case "baseStatus":
            // キャラクター名
            appo.udona_pone.name = data.base.name;
            appo.udona_pone.baseStatus.push({name: "名前", type: "normal", value: data.base.name, max: 0});
            // 駒のサイズ
            appo.udona_pone.baseStatus.push({name: "サイズ", type: "normal", value: 1, max: 0});
            // 種別
            let k = getCharacterKinds(data).filter(function (x, i, self) { return self.indexOf(x) === i; });
            appo.udona_pone.baseStatus.push({name: "種別", type: "normal", value: k.join("/"), max: 0});
            // FP
            let fp = getAblSeparated(data.fp.total)[0];
            appo.udona_pone.baseStatus.push({name: "FP", type: "numberResource", value: `${fp}`, max: fp});
            // 人間性
            let hum = getAblSeparated(data.humanity.total, 60)[0];
            appo.udona_pone.baseStatus.push({name: "人間性", type: "numberResource", value: `${hum}`, max: hum});
            // 大罪持ちかどうかで処理変更
            appo.udona_pone.baseStatus.push({name: "愛", type: "normal", value: `${params.binds[0]}`, max: 0});
            appo.udona_pone.baseStatus.push({name: "罪", type: "normal", value: "0", max: 0});
            if(hasGreatGuilty(data)) { appo.udona_pone.baseStatus.push({name: "大罪", type: "normal", value: "0", max: 0}); }
            // 財産点
            appo.udona_pone.baseStatus.push({name: "財産点", type: "normal", value: `${params.society[0]}`, max: 0});
            // 呪われし者の場合、「反動ポイント」の項目をステータスに反映
            if(isCursedOne(data)) { appo.udona_pone.baseStatus.push({name: "反動", type: "normal", value: "0", max: 0}); }
            // 絆の数も操作できるようにしておく。オプション項目扱い（堕落判定対策）
            if(appo.general.output_resistFalldown) { appo.udona_pone.baseStatus.push({name: "絆数", type: "normal", value: `${params.binds[0]}`, max: 0}); }
            break;
        case "baseParams":
            // キャラクター駒の情報にパラメータを設定
            for(let i of KEY_ABILITY) { appo.udona_pone.baseParams.push({name: abilityName(i), type: "normal", value: `${params[i][0]}`, max: 0}); }
            if(params.action.length == 2 && appo.general.output_beastActionUdonarium) { appo.udona_pone.baseParams.push({name: "魔動", type: "normal", value: `${params.action[1]}`, max: 0}); }
            break;
        case "memoBinds":
            // 絆・エゴの情報を組み込み
            for(let bind of poneGenerator_passBindsData(data)) {
                if(!bind || !bind.type) { continue; }
                let b = { name: "絆・エゴ", type: "normal", value: `【${bind.type}】` + (bind.name ? `${bind.name}` : "") + (bind.relation ? `（関係：${bind.relation}）` : ""), max: 0 };
                appo.udona_pone.memoBinds.push(b);
            }
            break;
    }
}

// ユドナリウムのコマ画像データ
function udona_processPoneImage(data) {
    // 駒画像データの処理
    let hashImage, b64Image;
    if(data.images) {
        b64Image = data.images.uploadImage.replace(/^.*,/, "");
        let shaObj = new jsSHA("SHA-256", "B64");
        shaObj.update(b64Image);
        hashImage = shaObj.getHash("HEX");
    }
    // console.log({hashImage: hashImage, imagesrc: b64Image});
    return {hashImage: hashImage, imagesrc: b64Image};
}

// ユドナリウム用駒データの作成
function poneGenerator_udonarium(data) {
    let k = JSON.parse(JSON.stringify(appo.udona_pone));
    let xml = "";
    // 1. 駒の定義開始
    xml += '<character location.name="table" location.x="300" location.y="300" posZ="0" rotate="0" roll="0">';
        // 2. <data name="character"> キャラクター定義開始
        xml += '<data name="character">';
            // 3. 画像データ処理
            let imageProcessed = udona_processPoneImage(appmp.main_data);
            xml += '<data name="image">';
                xml += '<data type="image" name="imageIdentifier">';
                xml += imageProcessed.hashImage ? imageProcessed.hashImage : 'none_icon';
                xml += '</data>';
            xml += '</data>';
            // 4. キャラクター基本情報
            xml += '<data name="common">';
                xml += '<data name="name">' + str_changeToEntityReferences(`${k.baseStatus[0].value}`) + '</data>';
                xml += '<data name="size">' + str_changeToEntityReferences(`${k.baseStatus[1].value}`) + '</data>';
            xml += '</data>';
            // 5. キャラクターの詳細情報
            xml += '<data name="detail">';
                // 基本情報(baseStatus)
                xml += '<data name="基本情報">';
                for(let i=2; i < k.baseStatus.length; i++) {
                    let x = `${k.baseStatus[i].value}`;
                    let y = `${k.baseStatus[i].max}`;
                    let z = `${k.baseStatus[i].name}`;
                    switch(k.baseStatus[i].type) {
                        case "normal":
                            xml += `<data name="${str_changeToEntityReferences(z)}">`+ str_changeToEntityReferences(x) + '</data>';
                            break;
                        case "numberResource":
                            xml += `<data type="numberResource" currentValue="${x}" name="${str_changeToEntityReferences(z)}">` + str_changeToEntityReferences(y) + '</data>';
                            break;
                        case "note":
                            xml += `<data type="note" name="${str_changeToEntityReferences(z)}">${str_changeToEntityReferences(x)}</data>`;
                            break;
                    }
                }
                xml += '</data>';
                // 能力値(baseParams)
                xml += '<data name="【能力値】">';
                for(let i=0; i < k.baseParams.length; i++) {
                    let x = `${k.baseParams[i].value}`;
                    let z = `${k.baseParams[i].name}`;
                    xml += `<data name="${str_changeToEntityReferences(z)}">${str_changeToEntityReferences(x)}</data>`;
                }
                xml += '</data>';
                // 絆・エゴ(memoBinds)
                xml += '<data name="絆・エゴの情報">';
                for(let i=0; i < k.memoBinds.length; i++) {
                    let x = `${k.memoBinds[i].value}`;
                    let z = `${k.memoBinds[i].name}`;
                    xml += `<data type="note" name="${str_changeToEntityReferences(z)}">${str_changeToEntityReferences(x)}</data>`;
                }
                xml += '</data>';
            // detail close
            xml += '</data>';
        // 2. キャラクター定義終了
        xml += '</data>';
        // ※チャットパレットデータ
        xml += '<chat-palette dicebot="BeastBindTrinity">' + str_changeToEntityReferences(appo.palette) + '</chat-palette>';
        // ※バフパレットデータ
        if(appmp.system_selected === "ユドナリウムリリィ") {
            let bp = [];
            xml += '<buff-palette dicebot="BeastBindTrinity">';
            for(let i of k.lilyBuffPalette) {
                bp.push(`${i.name} ${i.effect}` + (i.round ? " 0" : ""));
            }
            xml += str_changeToEntityReferences(bp.join("\n"));
            xml += '</buff-palette>';
        }
    // 1. 駒の定義終了
    xml += '</character>';

    // xmlファイルの作成
    let blobXML = new Blob([xml], {type: 'text/xml'});
    // zipファイルの作成
    let zip = new JSZip();
    zip.file(`${data.base.name}.xml`, blobXML);
    if(imageProcessed.hashImage) {
        zip.file(`${imageProcessed.hashImage}.png`, imageProcessed.imagesrc, {base64: true});
    }
    // データのダウンロード
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, `${data.base.name}.zip`);
    });
}
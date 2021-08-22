// 要望等のレポート処理
const App_Report = Vue.createApp({
    data() {
        return {
            name: "",
            sheet: "",
            subject: "変換失敗",
            comment: "",
            showSwitch: true
        };
    },
    methods: {
        outputData() {
            return { name: this.name, sheet: this.sheet, subject: this.subject, comment: this.comment };
        }
    },
    computed: {
        evalRequiredSheetURL() {
            return this.subject === "要望" ? false : true;
        },
        evalRequiredComment() {
            return this.subject === "変換失敗" ? false : true;
        }
    }
});
const AppR = App_Report.mount("#pl-report");

async function sendRequest() {
    let data = AppR.outputData();
    let message = {
        "username": "《変換 -Palette Converter-》",
        "content": "要望フォームから投稿がありました。",
        "embeds": [
            {
                "title": `【${data.subject}】`,
                "description": data.comment,
                "url": data.sheet,
                "color": 0,
                "author": { "name": data.name ? data.name : "匿名投稿" },
                "footer": { "text": (data.sheet ? "シート内容は埋め込みリンク参照 - " : "") + stringifyDate() }
            }
        ]
    };
    // データのチェック
    switch(data.subject) {
        case "変換失敗":
            // 必須項目のチェック
            if(!data.sheet.match(/character-sheets.appspot.com\/bbt\/edit.html\?key=/)) {
                alert("キャラクターシートのURLを入力してください。");
                return;
            }
            message.embeds[0].color = parseInt("e91e63", 16);
            break;
        case "意図通りに変換されない":
            // 必須項目のチェック
            if(!data.sheet.match(/character-sheets.appspot.com\/bbt\/edit.html\?key=/)) {
                alert("キャラクターシートのURLを入力してください。");
                return;
            }
            if(!data.comment) {
                alert("あなたの意図通りに変換されなかった部分について、詳細を教えてください。");
                return;
            }
            message.embeds[0].color = parseInt("fee75c", 16);
            break;
        case "要望":
            // 必須項目のチェック
            if(!data.comment) {
                alert("あなたの要望について、詳細を教えてください。");
                return;
            }
            message.embeds[0].color = parseInt("1abc9c", 16);
            break;
    }
    // 送信データの調整
    let formdata = new FormData();
    formdata.append('payload_json', JSON.stringify(message));
    let check = {
        method: 'POST',
        headers: new Headers(),
        body: formdata
    };
    let url = "https://discord.com/api/webhooks/878901815352123412/X2g7G-piFINAXUu8hFH6d2Xd2zS7xjD_0XqQGLHU3erGM9iA76L0awO1eQ5MaCIliRXE";
    const response = await fetch(url, check).then(alert("投稿を行いました。"));
}

function stringifyDate() {
    const currentDate = new Date();
    // 日付を取得
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const date = currentDate.getDate();
    // 時刻を取得
    let formatTime = (val) => { return ("0" + val).slice(-2); };
    const hour = formatTime(currentDate.getHours());
    const minute = formatTime(currentDate.getMinutes());
    const second = formatTime(currentDate.getSeconds());
    // データの変換
    return `${year}/${month}/${date} - ${hour}:${minute}:${second}`;
}
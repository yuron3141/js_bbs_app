const formDOM2 = document.getElementById("inputThread2");
//コメントデータの書き込みfetch
const inputNameDOM2 = document.getElementById("inputnameDom2");
const inputContentsDOM2 = document.getElementById("inputcontentsDom2");

let range = document.getElementById("range");
let threID = document.getElementById("thread_ID");

//アラートアナウンスのDOMを生成する関数
const createAlert = (type, array ) =>{
    const notification = document.getElementById("notifiers");

    let outer = document.createElement("div");
    outer.id = "notifier";

    //Buttonの作成
    let button = document.createElement("Button");
    button.className = "delete";
    //文章の作成
    let sentence = document.createElement("p");

    //書き込み成功のとき
    if(type == 1){
        outer.className = "notification is-info";

        sentence.textContent = "コメントしました";
        
    }else{
        //書き込み失敗のとき
        outer.className = "notification is-danger";

        sentence.textContent = ("コメントの作成に失敗しました");

    }
    const p_mes = document.createElement("p");
    p_mes.textContent = array;
    outer.appendChild(p_mes);

    //全部合体
    let fragment = document.createDocumentFragment();
    fragment.append(button);
    fragment.append(sentence);

    notification.appendChild(outer).appendChild(fragment);
}

//人気スレッドとコメントの読み込みGET
const getThread = async(threid, range) => {
    try{

        //スレッド名・レス数を読み込む
        let thread_datas = await axios.get("/api/v1/callthreadName", {params:{ ID: threid}});
        const dataarray1 = thread_datas;

        //console.log(dataarray1.data);
        //コメントを読み込む
        let thread_comments = await axios.get("/api/v1/readcomments", {params:{ ID: threid}});
        const dataarray2 = thread_comments;
        //console.log(dataarray2);

        //人気スレッドの作成処理
        let outerthread = document.getElementById("thread_title");
        outerthread.textContent = dataarray1.data.datas.thread_name;

        let spanrow = document.getElementById("less");
        spanrow.textContent = dataarray1.data.datas.com_sum + "コメント";

        let com_times = 0;
        //コメントを生成する関数
        thread_comments = dataarray2.data.datas.map((coms) =>{
            const{ name, unique_id, created_at, body} = coms;

            com_times++;

            const dayData = created_at.toString().match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);

            return `
            <li class="m-1 box">
            <h2 class="has-text-weight-bold">${com_times}: ${name} ${dayData[1]}/${dayData[2]}/${dayData[3]} ${dayData[4]}:${dayData[5]}:${dayData[6]} ID:${unique_id}</h2>
            <div class="pt-2">
                <p>
                    ${body}
                </p>
            </div>
            </li>
            `;
        });
        
        const HeadPutDOM = document.getElementById("first");
        const OutPutDOM = document.getElementById("HERE");

        let min = 1;
        let newResult = [];

        range = range.replace(/\"/g,"");
        //全部表示
        if( range == 1 ){

            newResult = thread_comments.slice(min, thread_comments.length);
        
        //1-100表示
        }else if(range == 2){
            let length = 0;
            if(thread_comments.length > 100){
                length = 100;
            }else{
                length = thread_comments.length;
            }   

            newResult = thread_comments.slice(min, length);
        
        //最新50表示
        }else{
            let length = 0;
            length = thread_comments.length - 50;

            if(length < 0){
                length = 1;
            }
            newResult = thread_comments.slice(length, thread_comments.length);
        }

        HeadPutDOM.innerHTML = thread_comments[0];
        OutPutDOM.innerHTML = newResult.join("");

        //コメント数が1000以上なら警告する
        const alert = document.getElementById("warning");
        if(thread_comments.length >= 1000){

            let outer = document.createElement("div");
            outer.id = "notifier";

            //Buttonの作成
            let button = document.createElement("Button");
            button.className = "delete";
            //文章の作成
            let sentence = document.createElement("p");

            //書き込み成功のとき
            //書き込み失敗のとき
            outer.className = "notification is-danger";
            sentence.textContent = ("レス数が1000を超えました。これ以上書き込みできません。");

            //全部合体
            let fragment = document.createDocumentFragment();
            fragment.append(button);
            fragment.append(sentence);

            alert.appendChild(outer).appendChild(fragment);
        }

    } catch (err){
        console.log(err);
    }
};



//ページが読み込まれたら実行
window.addEventListener('load', function(){
    //console.log("load：リソースファイルを全て読み込みました。");

    //formから値の読み取り
    threID = threID.value;

    range = range.value;

    getThread(threID, range);

});

//コメントformへの書き込み
let inputName2 = "";
let inputContents2 = "";

//commentsの設定をPOST
inputNameDOM2.addEventListener("change", (e) => {
    inputName2 = e.target.value;
});
inputContentsDOM2.addEventListener("change", (e) => {
    inputContents2 = e.target.value;
});

//コメントドムの監視
formDOM2.addEventListener("submit", async (e) =>{
    e.preventDefault();

    //コメントの書き込み処理
    if(inputContents2){
        try{
            //タイトルの読み取り
            const outerthread = document.getElementById("thread_title");

            await axios.post("/api/v1/writeComment", {
                thread_id: threID,
                thread_name: outerthread.textContent,
                user_name: inputName2,
                contents: inputContents2,
            }).then(
                //成功したとき
                res =>{
                    console.log('status:', res.status); // 200
                    console.log('body:', res.data);     // response body.

                    //バリデーションメッセージが空じゃないなら(バリデーションかかってるなら)
                    if(res.data.varitation != ""){
                        let msg = "";
                        for(let i=0; i<3; i++){
                            msg += (res.data.varitation[i] + " ");
                        }

                        console.log("書き込み失敗");
                        createAlert(0, msg);
                    }else{

                        console.log("書き込み成功");
                        createAlert(1, "");
                    }

                    getThread(threID, range);

            }).catch(err =>{
                //失敗したとき
                console.log("error:", err);

                createAlert(0, "");
            });
            inputContents2 = "";

            inputContentsDOM2.value = "";
        } catch (err){
            console.log(err);
        }
    } else {

    }

});

//alertを消す関数
document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('notifiers');

    target.addEventListener('click', () => {
        while( target.firstChild ){
            target.removeChild( target.firstChild );
        }
        bool = 0;	
    }, false);
});
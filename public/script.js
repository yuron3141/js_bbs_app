
const threadDOM = document.getElementById("threads");
const formDOM = document.getElementById("inputThread");
const formDOM2 = document.getElementById("inputThread2");

// スレッドデータ書き込みのfetch
const inputThreadDOM = document.getElementById("inputthreadDom");
const inputNameDOM = document.getElementById("inputnameDom");
const inputContentsDOM = document.getElementById("inputcontentsDom");

//コメントデータの書き込みfetch
const inputNameDOM2 = document.getElementById("inputnameDom2");
const inputContentsDOM2 = document.getElementById("inputcontentsDom2");
const ComDOM = document.getElementById("thread_ID");
const ComDOM2 = document.getElementById("thread_Name");

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

        sentence.textContent = "スレッドを作成しました";
        
    }else{
        //書き込み失敗のとき
        outer.className = "notification is-danger";

        sentence.textContent = ("スレッドの作成に失敗しました");

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
//既存アラートを消す関数
const deleteAlert = () =>{
    let notification = document.getElementById("notifiers");
    while( notification.lastChild ){
        notification.removeChild( notification.lastChild );
    }
}

//threadsをGET
const getAllThreads = async () =>{
    try {
        let allThreads = await axios.get("/api/v1/readthreads");
        let { data } = allThreads;

        //出力
        allThreads = data.datas.map((thread) => {
            const {id, thread_id, thread_name, com_sum} = thread;

            return `
            <li class="has-text-link"><a href="/thread?threid=${thread_id}&range=1">${id} ${thread_name} (${com_sum})</a></li>
            `;
        });
        threadDOM.innerHTML = allThreads.join("");
    } catch (err){
        console.log(err);
    }
};
getAllThreads();

//人気スレッドとコメントの読み込みGET
const getNewThread = async() => {
    try{
        let MostPopThread = await axios.get("/api/v1/readpopthread");
        const dataarray1 = MostPopThread;

        const threid = dataarray1.data.datas.thread_id;
        const threname =  dataarray1.data.datas.thread_name;
        const thresum = dataarray1.data.datas.com_sum;

        let thread_comments = await axios.get("/api/v1/readcomments", {params:{ ID: threid}});
        const dataarray2 = thread_comments;

        //人気スレッドの作成処理
        let outerthread = document.createElement("div");
        outerthread.className ="m-5 block notification has-background-light box";

        let spanrow = document.getElementById("less");
        spanrow.textContent = "人気のスレッド("+ thresum + "レス)";
        let hrow = document.getElementById("TITLE");
        hrow.textContent = threname;

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
        
        const HeadPutDOM = document.getElementById("FIRST");
        const OutPutDOM = document.getElementById("HERE");

        let min = thread_comments.length - 10;
        let newResult = [];

        if(min < 0){
            min = 1;
        }
        if(min >= 0){
            newResult = thread_comments.slice(min, thread_comments.Length);
        }

        HeadPutDOM.innerHTML = thread_comments[0];
        OutPutDOM.innerHTML = newResult.join("");

        //コメントフォームのvalueに値挿入
        ComDOM.value = threid;
        ComDOM2.value = threname;

        //href要素へのリンク書き込み
        const allread = document.getElementById("Allread");
        allread.href = "/thread?threid=" + threid + "&range=1";
        const latest50 = document.getElementById("latest50");
        latest50.href = "/thread?threid=" + threid + "&range=2";
        const to100 = document.getElementById("to100");
        to100.href = "/thread?threid=" + threid + "&range=3";

    } catch (err){
        console.log(err);
    }
};
getNewThread();

//使用宣言
// スレッドformへの書き込み
let inputThread = "";
let inputName = "";
let inputContents = "";
let inputIp = "";

//コメントformへの書き込み
let inputName2 = "";
let inputContents2 = "";

let bool = 0;

//threadの設定をPOST
inputThreadDOM.addEventListener("change", (e) => {
    inputThread = e.target.value;
});
inputNameDOM.addEventListener("change", (e) => {
    inputName = e.target.value;
});
inputContentsDOM.addEventListener("change", (e) => {
    inputContents = e.target.value;
});
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
            await axios.post("/api/v1/writeComment", {
                thread_id: ComDOM.value,
                thread_name: ComDOM2.value,
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
                        //createAlert(0, msg);
                    }else{

                        console.log("書き込み成功");
                        //createAlert(1, "");
                    }

                    getNewThread();

            }).catch(err =>{
                //失敗したとき
                console.log("error:", err);

                //createAlert(0, "");
            });
            inputContents2 = "";

            inputContentsDOM2.value = "";
        } catch (err){
            console.log(err);
        }
    } else {

    }

});
//スレッドドムの監視
formDOM.addEventListener("submit", async (e) =>{
    e.preventDefault();

    if(bool == 1){
        deleteAlert();
        bool = 0;
    }

    //スレッドの書き込み処理
    if(inputThread && inputContents){

        try {
                await axios.post("/api/v1/writethread", {
                    thread_name: inputThread,
                    user_name: inputName,
                    contents: inputContents,
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

                            bool = 1;
                            createAlert(0, msg);
                        }else if(res.data.message == "1人が1日に作成できるスレッドは5つまでです"){

                            bool = 1;
                            createAlert(0, "1人が1日に作成できるスレッドの上限数に達しました");

                        }else{

                            bool = 1;
                            createAlert(1, "ページを更新すると作成したスレッドが表示されます");

                        }

                        
                }).catch(err =>{
                    //失敗したとき
                    console.log("error:", err);

                    bool = 1;
                    createAlert(0, "");
                });
                inputThread = "";
                inputName = "";
                inputContents = "";

                inputThreadDOM.value ="";
                inputContentsDOM.value = "";
    
        } catch (err){
            console.log("error:", err);

            bool = 1;
            createAlert(0, "");
        }

    }else{

        bool = 1;
        createAlert(0, "スレッドタイトルとコメント内容を入力してください");
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
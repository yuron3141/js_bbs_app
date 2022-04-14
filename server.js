require('date-utils');

const express = require("express");
const { add } = require('nodemon/lib/rules');
const app = express();
const PORT = 3000;

//jsonでPOSTできたりするように（おまじない）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//sqlite3と接続
const sqlite3 = require('sqlite3');
//const { isBuffer } = require('util');
const db = new sqlite3.Database("./database.db", (err) =>{
    if (err){
        console.log("database error: "+ err.message);
    }
});

//public内を使えるように宣言
app.use(express.static("public"));

//現在時刻を取得する関数
const getNowTime = () =>{
    let dt = new Date();
    let formatted = dt.toFormat("YYYYMMDDHH24MISS");

    return formatted;
};

//IP addressを取得する関数
const getIP = function (req) {
    if (req.headers['x-forwarded-for']) {
        return req.headers['x-forwarded-for'];
    }
    if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress;
    }
    if (req.connection.socket && req.connection.socket.remoteAddress) {
        return req.connection.socket.remoteAddress;
    }
    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }
    return '0.0.0.0';
};

//IPアドレスと時刻とスレッド名・変化数字からユニークIDを生成する関数
const createUniqueID = function(ip, time, sledname){
    const crypto = require('crypto');

    //日付変化数字の作成
    const dayData = time.match(/(\d{8})(\d{6})/);//ex 20150421 123454
    let dailyID = crypto.createHash('md5').update(dayData[1]).digest('hex')

    //ipから:を削除
    const clearIp = ip.replace(/:/g, "");

    //生ユニークidの作成
    let annoymous = clearIp + dayData[1] + sledname + dailyID.substring(0, 6);//IP+日付+スレッド名+変化数字(6桁)
    //生ユニークidのハッシュ化
    annoymous = crypto.createHash('md5').update(annoymous).digest('hex')

    //ユニークIDの上位9桁を返す
    return annoymous.substring(0, 9);
};
//スレッドIDを生成する関数
const createThreadID = function(name){
    const crypto = require('crypto');

    let annoymous = crypto.createHash('md5').update(name).digest('hex')

    return annoymous.substring(0, 9);
};
//XSS対策エスケープ関数
function escapeHTML(string){
    return string.replace(/&/g, '&lt;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, "&#x27;");
};

//テーブルに新規テーブルの追記とコメントテーブルの作成、追記を行う関数
const createNewThread = async function(thread_id, thread_name, time, ip_address, contents, user_name){
    let feed = {};
    let table_name = "coms_";
    table_name += thread_id;

    db.serialize(() => {
        db.run('INSERT into threads(thread_id, thread_name, com_sum, wrote_at, created_at, ip_address) values(?,?,?,?,?,?)',[thread_id, thread_name, 1, time, time, ip_address], (err, rows) =>{
            if(err){
                feed.states = "error";
                feed.message = ", " + err.message;

            }else{
                if(feed.states == undefined){
                    feed.states = "OK";
                }
            }       

        });
        const sql1 = 'CREATE TABLE '+ table_name + ' (id INTEGER, name TEXT DEFAULT "名無しさん", created_at NUMRIC NOT NULL, unique_id TEXT, body TEXT, ip_address TEXT, del_flag NUMRIC DEFAULT 0, PRIMARY KEY(id AUTOINCREMENT) )';
        db.run(sql1, (err,rows)=>{
            if(err){
                feed.states = "error";
                feed.message += ", ".err.message;

            }else{
                if(feed.states == undefined){
                    feed.states = "OK";
                }
            }       
        });
        const sql2 = 'INSERT into '+ table_name +' (name, body, created_at, unique_id, ip_address ) values(?,?,?,?,?)';
        const unique = createUniqueID(ip_address,time,thread_name);
        //console.log(unique);
        db.run(sql2,[user_name, contents, time, unique, ip_address], (err, rows) =>{
            if(err){
                feed.states = "error";
                feed.message = ", " + err.message;

                //console.log(err.message);

            }else{
                if(feed.states == undefined){
                    feed.states = "OK";
                }

                //console.log("書き込み成功です");
            }       

        });

        return feed;
    });
}

//threadIDからthread名とレス数を返す関数
app.get("/api/v1/callthreadName", async(req, res) =>{
    try{
        //console.log(req.query.ID);
        const id = JSON.stringify(req.query.ID);
        //console.log(id);
        const sql = 'SELECT thread_name, com_sum FROM threads WHERE thread_id =' + id;
        db.get(sql, (err, rows)=>{
            if(err){
                res.status(400).json({
                    "status": "error",
                    "datas": err.message
                });

            }else{
                res.status(200).json({
                    "status": "OK",
                    "datas": rows
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
});

//get method(thread一覧を返す関数)
app.get("/api/v1/readthreads", async(req, res) =>{
    try {
        //thread一覧の取得
        db.all("select id, thread_id, thread_name, com_sum from threads", (err, rows) => {
            if (err) {
                res.status(400).json({
                    "status": "error",
                    "datas": err.message,
                });
            } else {

                res.status(200).json({
                    "status": "OK",
                    "datas": rows
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
});

//get method(一番人気のスレッドを1つ返す関数)
app.get("/api/v1/readpopthread", async(req, res)=>{
    try{
        //スレッドが最大ではなく、コメントが最も多いスレッドを取得
        db.get("SELECT thread_id, thread_name, com_sum FROM threads WHERE com_sum < 1000 ORDER BY com_sum DESC", (err, rows)=>{
            if(err){
                res.status(400).json({
                    "status": "error",
                    "datas": err.message
                });
            }else{
                res.status(200).json({
                    "status": "OK",
                    "datas": rows
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
});

//get method(thread_idからコメントを返す関数)
app.get("/api/v1/readcomments", async(req, res)=>{
    try{
        let id = "coms_"+ (req.query.ID);
        //console.log(id);
        const sql = 'SELECT id, name, created_at, unique_id, body FROM '+ id
        db.all(sql, (err, rows)=>{
            if(err){
                res.status(400).json({
                    "status": "error",
                    "datas": err.message
                });

            }else{

                res.status(200).json({
                    "status": "OK",
                    "datas": rows
                });
            }
        });

    } catch (err){
        console.log(err);
    }
});
//post method(コメントを追加する関数)
app.post("/api/v1/writeComment", async(req, res) => {
    try{
        //リクエストレスポンス結果格納と処理用変数
        let states = "OK";
        let message = "";
        let datas = "";

        const your_ip = getIP(req);
        const now_time = getNowTime();
        const threadID = req.body.thread_id;
        const threadName = req.body.thread_name;

        //名前が入力されていない場合名無しさんにする
        if(req.body.user_name == ""){
            req.body.user_name = "名無しさん"
        }

        let message_array = new Array("", "");
        //最大文字数等の判定(バリデーション)
        if( req.body.user_name.length > 16){
            message_array[0] = "名前が長すぎます"
        }
        if( req.body.contents.length > 1024){
            message_array[1] = "内容が長すぎます。1024文字以内にしてください。"
        }

        //エラーメッセージ群が入っていたら
        if(message_array[0] != "" || message_array[1] != ""){

            res.status(201).json({
                "status": "ok",
                "data": message,
                "varitation": message_array
            });

            return;
        }

        //データベース操作
        db.serialize(() => {
            //Usersテーブルを走査
            db.get('SELECT created_sum, ip_address FROM users WHERE ip_address = ?', [your_ip], (err, rows) =>{
                if(err){
                    states = "error";
                    message = err.message;

                }else{
                    if(states != "error"){
                        states = "OK";
                    }

                    //Userが見つからなかったら
                    if(rows == undefined){
                        //usersテーブルにip_address等を追加
                        db.run('INSERT into users(ip_address, last_comment_date) values(?,?,?,?)', [your_ip, now_time], (err, rows)=>{
                            if(err){
                                states = "error";
                                message += (", " + err.message);
            
                            }else{
                                if(states != "error"){
                                    states = "OK";
                                }
                            }        
                        });

                        let sum = 0;
                        //threadsテーブルからcom_sumを取得する処理
                        db.get('SELECT com_sum FROM threads WHERE thread_id = ?', [threadID],  (err, result)=>{
                            if(err){
                                states = "error";
                                message += (", " + err.message);
            
                            }else{
                                if(states != "error"){
                                    states = "OK";
                                }
                                sum = result.com_sum;
                                sum++;
                                //threadsテーブルのcom_sumを更新する処理
                                db.run('UPDATE threads SET com_sum = ? WHERE thread_id = ?', [sum, threadID], (err, result) => {
                                    if(err){
                                        states = "error";
                                        message = ", ".err.message;
                    
                                        return;
                                    }else{
                                        if(states != "error"){
                                            states = "OK";
                                        }
                                    }
                                });

                                //コメント数が1000未満なら追加する
                                if(sum <= 1000){

                                    //コメントを追加する処理
                                    const sql = 'INSERT into coms_'+ threadID +'(name, created_at, unique_id, body, ip_address) values(?,?,?,?,?)';
                                    const unique = createUniqueID(your_ip, now_time, threadName);
                                    db.run(sql, [escapeHTML(req.body.user_name), now_time, unique, escapeHTML(req.body.contents), your_ip],(err, rows) => {
                                        if(err){
                                            states = "error";
                                            message = ", " + err.message;
                            
                                            //console.log(err.message);
                            
                                        }else{
                                            if(states == undefined){
                                                states = "OK";
                                            }
                            
                                            //console.log("書き込み成功です");
                                        }    
                                    });

                                    if(states != "error"){
                                        res.status(201).json({
                                            "status": states,
                                            "message": message,
                                            "varitation": "",
                                            "datas": "",
                                        });
                
                                    }else{
                                        res.status(400).json({
                                            "status": states,
                                            "message": message,
                                            "varitation": "",
                                            "datas": "",
                                        });
                                    }

                                //1000以上ならエラーを返す
                                }else{
                                    res.status(400).json({
                                        "status": states,
                                        "message": message,
                                        "varitation": "",
                                        "datas": "",
                                    });
                                }
                            }  
                        });

                    }else{
                        //Usersが見つかったら
                        //Userテーブルの情報を更新
                        db.run('UPDATE users SET last_comment_date = ? WHERE ip_address = ?',[now_time, your_ip],(err, rows) => {
                            if(err){
                                states = "error";
                                message += (", "+err.message);
            
                            }else{
                                if(states != "error"){
                                    states = "OK";
                                }
                            }   
                        });

                        let sum = 0;
                        //threadsテーブルからcom_sumを取得する処理
                        db.get('SELECT com_sum FROM threads WHERE thread_id = ?', [threadID],  (err, result)=>{
                            if(err){
                                states = "error";
                                message += (", " + err.message);
            
                            }else{
                                if(states != "error"){
                                    states = "OK";
                                }
                                //console.log(result);
                                sum = result.com_sum;
                                sum++;
                                //console.log(sum);
                                //threadsテーブルのcom_sumを更新する処理
                                db.run('UPDATE threads SET com_sum = ? WHERE thread_id = ?', [sum, threadID], (err, result) => {
                                    if(err){
                                        states = "error";
                                        message = ", ".err.message;
                    
                                        console.log(err.message);
                                        return;
                                    }else{
                                        if(states != "error"){
                                            states = "OK";
                                        }
                                    }
                                });

                                //コメント数が1000未満なら追加する
                                if(sum <= 1000){

                                    //コメントを追加する処理
                                    const sql = 'INSERT into coms_'+ threadID +'(name, created_at, unique_id, body, ip_address) values(?,?,?,?,?)';
                                    const unique = createUniqueID(your_ip, now_time, threadName);
                                    db.run(sql, [escapeHTML(req.body.user_name), now_time, unique, escapeHTML(req.body.contents), your_ip],(err, rows) => {
                                        if(err){
                                            states = "error";
                                            message = ", " + err.message;
                            
                                            //console.log(err.message);
                            
                                        }else{
                                            if(states == undefined){
                                                states = "OK";
                                            }
                            
                                            //console.log("書き込み成功です");
                                        }    
                                    });

                                    if(states != "error"){
                                        res.status(201).json({
                                            "status": states,
                                            "message": message,
                                            "varitation": "",
                                            "datas": "",
                                        });
                
                                    }else{
                                        res.status(400).json({
                                            "status": states,
                                            "message": message,
                                            "varitation": "",
                                            "datas": "",
                                        });
                                    }

                                //1000以上ならエラーを返す
                                }else{
                                    res.status(400).json({
                                        "status": states,
                                        "message": message,
                                        "varitation": "",
                                        "datas": "",
                                    });
                                }
                            }  
                        });
                    }
                }
            });
        });

    } catch (err) {

        console.log(err);

        res.status(201).json({
            "status": "error",
            "message": err,
        });

    }
});

//post method(スレッドを作成する関数)
app.post("/api/v1/writethread", async(req, res) =>{
    try {
        //リクエストレスポンス結果格納と処理用変数
        let states = "OK";
        let message = "";
        let datas = "";

        const your_ip = getIP(req);
        const now_time = getNowTime();
        const threadID = createThreadID(req.body.thread_name);
        let feedback = {};

        let message_array = new Array("", "", "");

        //名前が入力されていない場合名無しさんにする
        if(req.body.user_name == ""){
            req.body.user_name = "名無しさん"
        }

        //最大文字数等の判定(バリデーション)
        if( req.body.thread_name.length > 64)
        {
            message_array[0] = "スレッド名が長すぎます"
        }
        if( req.body.user_name.length > 16){
            message_array[1] = "名前が長すぎます"
        }
        if( req.body.contents.length > 1024){
            message_array[2] = "内容が長すぎます。1024文字以内にしてください。"
        }
        //エラーメッセージ群が入っていたらここでレスポンスを返す
        if(message_array[0] != "" || message_array[1] != "" || message_array[2] != ""){

            res.status(201).json({
                "status": "OK",
                "message": message,
                "varitation": message_array
            });

            return;
        }

        //データベース操作
        db.serialize(() => {
            //Usersテーブルを走査
            db.get('SELECT created_sum, ip_address FROM users WHERE ip_address = ?', [your_ip], (err, rows) =>{
                if(err){
                    states = "error";
                    message = err.message;

                }else{
                    if(states != "error"){
                        states = "OK";
                    }

                    //Userが見つからなかったら
                    if(rows == undefined){
                        //usersテーブルにip_address等を追加
                        db.run('INSERT into users(ip_address, thread_created_date, created_sum, last_comment_date) values(?,?,?,?)', [your_ip, now_time, 1, now_time], (err, rows)=>{
                            if(err){
                                states = "error";
                                message += (", " + err.message);
            
                            }else{
                                if(states != "error"){
                                    states = "OK";
                                }
                            }        
                        });

                        //スレッドテーブルとコメントテーブルの作成・コメントの書き込みをする関数の実施
                        feedback = createNewThread(threadID, escapeHTML(req.body.thread_name), now_time, your_ip, escapeHTML(req.body.contents), escapeHTML(req.body.user_name));
                    }else{
                        //Usersが見つかったら
                        let sum = rows.created_sum;
                        sum++;

                        //created_sumが5以下ならば
                        if(rows.created_sum < 5){
                            //Userテーブルの情報を更新
                            db.run('UPDATE users SET created_sum = ?, thread_created_date = ? WHERE ip_address = ?',[sum,now_time, your_ip],(err, rows) => {
                                if(err){
                                    states = "error";
                                    message += (", "+err.message);
                
                                }else{
                                    if(states != "error"){
                                        states = "OK";
                                    }
                                }   
                            });

                            //スレッドテーブルとコメントテーブルの作成・コメントの書き込みをする関数の実施
                            feedback = createNewThread(threadID, escapeHTML(req.body.thread_name), now_time, your_ip, escapeHTML(req.body.contents), escapeHTML(req.body.user_name));

                        }else{
                            //5以上ならば
                            res.status(201).json({
                                "status": "OK",
                                "message": "1人が1日に作成できるスレッドは5つまでです",
                                "varitation": ""
                            });

                            return;
                        }
                    }

                    if(feedback.states == "error"){
                        states = "error";
                        message += (", "+feedback.message);

                    }

                    res.status(201).json({
                        "status": states,
                        "message": message,
                        "varitation": "",
                        "datas": "",
                    });

                }
            });
        });

    }catch (err){
        console.log(err);

        res.status(201).json({
            "status": "error",
            "message": err,
        });
    }
});

/*=============================================================================================================*/
//スレッドページを返す関数
app.set('view engine', 'ejs');

app.get("/thread", function(req, res){

        //res.body.data = req.body;
        //console.log(req.query.threid);
        //console.log(req.query.range);

        res.render('parts/thread', {threid : req.query.threid, range : req.query.range});

});

app.listen(PORT, console.log("Server is running"));
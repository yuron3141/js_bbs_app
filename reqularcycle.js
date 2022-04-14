//sqlite3と接続
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./database.db", (err) =>{
    if (err){
        console.log("database error: "+ err.message);
    }
});


//usersテーブルの回数をリセットする処理
const resetcreatetimes = async function(){
    try{
        db.run('UPDATE users SET created_sum= ?', [0], (err, result) => {
            if(err){
                console.log(err.message);
            }else{
                console.log("リセットに成功しました");
            }
        });

    } catch (err){
        console.log("Usersテーブルのcreated_sumを初期化できませんでした。");;
    }

};

//実行
resetcreatetimes();
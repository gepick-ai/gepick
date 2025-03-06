# Model Doc

### User
```javascript
{
    "_id": ObjectId,
    "googleId": String, // eg: "123456789"
    "avatarUrl": String,
    "nickName": String,
    "email": String,
    "gender": String,
    "birthday": String,
    "astro": String,
    "friends":[{relation:String, name:String, infos:[String]}],
    // 缓存对话中出现的朋友信息

}
```

### ChatMessage
```javascript
{
    "_id": ObjectId,
    "userId": String,
    "type": String, // "user","gepick","function"
    "content": String,
    "createdAt": Date,
}
```


### Omikuji
```javascript
{
    "_id": ObjectId,
    userId: String,
    randomIndex: Number, // eg: 15
    randomIndexTxt: String, //eg: 十五
    kuji: { // eg:
        "id": "1",
        "type": "大吉",
        "poem": "七寶浮圖塔，高峰頂上安，眾人皆仰望，莫作等閒看",
        "explain": "就像出現了用美麗寶石做成的佛塔般地，似乎會有非常好的事情。因為能改用放眼萬事的立場，可以得到周圍的人們的信賴吧。合乎正道的你的行為，能被很多人的認同及鼓勵。不用隨便的態度看事情，用正確的心思會招來更多的好的結果。",
        "result": {
            "願望": "會充分地實現吧。",
            "疾病": "會治癒吧。",
            "盼望的人": "會出現吧。",
            "遺失物": "變得遲遲地才找到吧。",
            "蓋新居": "全部很好吧。",
            "搬家": "全部很好吧。",
            "嫁娶": "全部很好吧。",
            "旅行": "全部很好吧。",
            "交往": "全部很好吧。"
        },
    },
    date: String, //
    hasViewed: Boolean,
    isMulted: Boolean,
    createdAt: Date,
}
```

### DailyAstro
```javascript
{
    "_id": ObjectId,
    "date": String,
    "astro": String,
    "loveIndex": Number,
    "loveText": String,
    "healthIndex": Number,
    "healthText": String,
    "jobIndex": Number,
    "jobText": String,
    "rawInfos":Array,// 缓存API返回的原始数据
}
```


### Wallpaper
```javascript
{
    "_id": String,
    "userId": String,
    "url": String,
    "thumbUrl": String,
    "background":String,
    "rune":String,// 符文
}

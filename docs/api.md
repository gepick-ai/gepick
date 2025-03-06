# API Doc

basepath: /api/v1

## EXPLORE PAGE APIs

### get home data
**url**: /home
**method**: get
**params**: 
```json
{}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "date":"2024-04-01",
        "dailyAstro":[
            {
                "astro":"aries",
                "loveIndex":5,
                "loveText":"白羊座，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来"
                "healthIndex":4,
                "healthText":"白羊座，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来"
                "jobIndex":3,
                "jobText":"白羊座，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣，而且喜欢用爱来opley，对爱情有非常大的兴趣"
            }
        ],
        "wallpapers":[{
            "avatarUrl":"https://picsum.photos/1.jpeg/100/100",
            "comment":"我不知道最终是否有用，但是真的心态有转变。",
            "wallpaperUrl":"https://picsum.photos/1.jpeg/1920/1080",
        }],
    }
}
```

**星座名称**
```
中文对照
Aries 白羊座
Taurus 金牛座
Gemini 双子座
Cancer 巨蟹座
Leo 狮子座
Virgo 处女座
Libra 天秤座
Scorpio 天蝎座
Sagittarius 射手座
Capricorn 摩羯座
Aquarius 水瓶座
Pisces 双鱼座

日文对照：
Aries 牡羊座
Taurus 牡牛座
Gemini 双子座
Cancer 蟹座
Leo 獅子座
Virgo 乙女座
Libra 天秤座
Scorpio 蠍座
Sagittarius 射手座
Capricorn 山羊座
Aquarius 水瓶座
Pisces 魚座
```

## Chat Page APIs
### get history
**url**: /chat/history
**method**: post
**params**: 
```json
{
    "userId": "userId"
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": []
}
```

### send message
**url**: /chat/send
**method**: post
**params**: 
```json
{
    "userId": "userId",
    "content": "Hi Bot"
}
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "messages":[{
            "role":"user",
            "content":"Hi, how are you?",
            "content_type":"text"
        }],
        "hints":[{ 
            "content":"What a nice day",
            "content_type":"text"
        }]
    }
}
```

## Omikuji APIs
### get omikujis - 从新到旧给出前N个Omikuji 
**url**: /omikuji/list
**method**: post
**params**: 
```json
{
    "userId": "userId",
    "skip": 0,
    "limit": 10
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 100,
        "list": [OmikujiModel]
    }
}
```

### melt bad omikuji - 化解凶签
**url**: /omikuji/melt
**method**: post
**params**: 
```json
{
    "userId": "userId",
    "omikujiId": "omikujiId"
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
}
```

### draw a new omikuji
**url**: /omikuji/draw
**method**: post
**params**: 
```json
{
    "userId": "userId",
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": OmikujiModel
}
```

## Wallpaper APIs
### get my wallpapers
**url**: /wallpaper/list
**method**: post
**params**: 
```json
{
    "userId": "userId",
    "skip": 0,
    "limit": 10
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 100,
        "list": [WallpaperModel]
    }
}
```




### delete wallpaper
**url**: /wallpaper/remove
**method**: post
**params**: 
```json
{
    "userId": "userId",
    "wallpaperId": "wallpaperId"
}
```
**response**: 
```json
{
    "code": 0,
    "message": "success",
}
```

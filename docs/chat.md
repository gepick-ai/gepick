## 聊天流程

1. 用户 prompt

2. 检查用户会员及余额逻辑，不足提示错误

3. prompt 关键词检测：

- 关键词1: "生成壁纸"及相关日文 (i18 x)
  - 用户前3句话合并，并且检索相关卢恩符文，加上随机选择的壁纸背景，合并成为能量壁纸，上传到S3，并且持久化保存，同时返回给用户

- 其他： 使用 coze api 聊天

## 检索符文

路径： `packages/wallpaper/src/node/embedding.js`
function： queryNearestRune(userPrompt)

## 生成壁纸

路径： `packages/wallpaper/src/node/createWallpaper.js`
function： addImageWatermark(backgroundPath, runePath, outputPath)

服务器上路径背景存放路径 `/var/resources/background/`
符文存放路径 `/var/resources/rune/`

`wallpapers.json` 保存了所有壁纸的背景
`rune_embedding.json` 保存了所有符文和向量信息

User Model
{
    _id: string,

}

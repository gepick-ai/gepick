# Gepick

## 项目工程结构

Gepick仓库包含多个文件夹：

- `.github`：项目接入Github Actions做应用构建测试分发。【构建测试发布阶段需要】

- `packages`： 文件夹包含运行时需要用到的包，如共享工具包`@gepick/shared`。【业务开发阶段需要】

  `packages`包按照业务领域划分，每个包根据不同的运行环境（浏览器、node）可能分成三个部分：

  - `common/*`: 仅需基本 JavaScript API 并在所有目标环境中运行的源代码。
  - `browser/*`需要 `browser` API（如访问 DOM）的源代码，可以依赖`common/*`的代码。
  - `node/*`需要 [`nodejs`](https://nodejs.org) API 的源代码，可以依赖`common/*`的代码。

- `apps`：文件夹包含应用程序，包括客户端、服务端应用程序，如`@gepick/client`、`@gepick/server`。【业务开发阶段需要】

  在`apps`中，不同的`app`会应用到对应业务领域`package`的不同部分。如前端应用会用到`package/browser/*`和`package/common/*`。对于后端应用，会用到`package/node/*`和`package/common/*`。

## Gepick启动

在项目的根目录下：

- 执行以下命令进行依赖环境安装
  - `nvm use`
  - `yarn`
- 执行以下命令构建本地依赖包
  - `yarn compile`

- 启动mongodb
  - `yarn setup:env`

- 启动服务端
  - `yarn dev:server`

- 启动客户端
  - `yarn dev:client`

### 本地包测试

在项目的根目录下，放置了不同的dev命令，比如`dev:client`就是测试client包，只要修改相关代码就会实时编译。如果编译后效果不对或者不生效，可以尝试在根目录使用`yarn clean`清除依赖产物，然后重新在根目录`yarn compile`。或者你只想单独清理当前包的依赖产物，你可以执行`yarn clean --target 包的文件夹名`，比如清除`@gepick/shared`（文件夹是shared），你就可以输入`yarn clean --target shared`，然后使用`yarn build:shared`，或者干脆使用`yarn dev:shared`实时编译看效果。

### 后端功能测试

在对应的`package/node`下放置着不同业务领域的`router`和`model`，分别对应着后端路由和数据库Model（这里是mongodb）。开发完相应的功能之后，到对应的`package/test/node`下新建一个`xxx.http`，然后写入相关HTTP报文，下载对应vscode插件`humao.rest-client`，点击报文左上角`send request`就可以测试路由功能了。如果你还想方便点查看数据在mongodb生效与否，你可以下载对应vscode插件`mongodb.mongodb-vscode`。这样一来就能快速测试后端接口功能了。

## Gepick部署

### 相关环境变量说明

```shell
########## server 环境变量设置  ##########

# =================当前环境配置==========================
process.env.NODE_ENV =

# =================s3 storage相关配置====================

# 配置s3 bucket
process.env.S3_BUCKET =
# 配置s3 access point
process.env.S3_ACCESS_POINT =
# 配置s3 access key id
process.env.S3_ACCESS_KEY_ID =
# 配置s3 secret access key
process.env.S3_SECRET_ACCESS_KEY =

# =================omikuji相关配置=======================

# 配置omikuji info 地址
process.env.OMIKUJI_INFO_BASE_URL =

# =================jwt相关配置===========================

# 配置jwt secret
process.env.JWT_SECRET =

# =================database相关配置======================

# 配置mongodb连接地址
process.env.DATABASE_URL =

# =================oauth相关配置======================

# 配置Google Oauth应用ID
process.env.GOOGLE_OAUTH_CLIENT_ID =
# 配置Google Oauth应用Secret
process.env.GOOGLE_OAUTH_CLIENT_SECRET =
# 配置Google 认证重定向URI【按照我们当前的oauth设计方案应该填写前端路由地址】
process.env.GOOGLE_OAUTH_REDIRECT_URI =

# =================mail相关配置======================
# 配置邮箱发送帐号
process.env.MAIL_USER
# 配置邮箱发送密码
process.env.MAIL_PASSWORD

# ==================resource相关配置===================

# 配置resource相关配置
process.env.RESOURCE_DIR =

########## client 环境变量设置 ##########

# ==================通讯相关配置======================

# 配置api接口地址
process.env.MESSAGING_URL =
```

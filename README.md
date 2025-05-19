# Gepick

一个AI RPA｜Agent开发框架，项目大部分功能逻辑基于[Theia](https://github.com/eclipse-theia/theia)二开改造，打造你自己的RPA｜Agent百宝箱。（基座打造中...）

## 工程结构

Gepick仓库包含多个文件夹：

- `.github`：项目接入Github Actions做应用构建测试分发。【构建测试发布阶段需要】

- `packages`： 文件夹包含运行时需要用到的包，如共享工具包`@gepick/shared`。【业务开发阶段需要】

  `packages`包按照业务领域划分，每个包根据不同的运行环境（浏览器、node）可能分成三个部分：

  - `common/*`: 仅需基本 JavaScript API 并在所有目标环境中运行的源代码。
  - `browser/*`需要 `browser` API（如访问 DOM）的源代码，可以依赖`common/*`的代码。
  - `node/*`需要 [`nodejs`](https://nodejs.org) API 的源代码，可以依赖`common/*`的代码。

- `apps`：文件夹包含应用程序，包括客户端、服务端应用程序，如`@gepick/client`、`@gepick/server`。【业务开发阶段需要】

  在`apps`中，不同的`app`会应用到对应业务领域`package`的不同部分。如前端应用会用到`package/browser/*`和`package/common/*`。对于后端应用，会用到`package/node/*`和`package/common/*`。

## 启动

在项目的根目录下：

- 执行以下命令进行依赖环境安装
  - `nvm use`
  - `yarn`
  - 
- 执行以下命令编译整个项目
  - `yarn compile`

- 启动客户端
  - `yarn dev:client`

- 启动mongodb
  - `yarn setup:env`

- 启动服务端
  - `yarn dev:server`

- 启动某个包：`yarn workspace @gepick/package-name dev`

- 运行测试（docs/test/README.md）
  - monorepo测试：`yarn test [-e browser | common | node]`
  - 某个包测试：`yarn workspace @gepick/package-name test [-e browser | common | node]`

- typedoc: `yarn docs`

## 文档

- [Gepick依赖注入基础框架](./docs/core/docs/framework.md)
- [Core](./docs/core/README.md)
- [Plugin](./docs/plugin/README.md)
- [Test](./docs/test/README.md)
- [AI](./docs/ai/README.md)
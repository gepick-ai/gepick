## Plugin与Core之间的消息传递

由于Plugin是运行在一个隔离的Plugin进程当中的，而Core则运行在其他进程当中。因此设计Plugin API的时候就必须考虑Plugin应该如何与Core通信的问题。在项目当中，我们通过利用RPC技术建立起Plugin与Core之间的通信桥梁，并设计一套`Main-Ext`的通信模式。
![img](../../docs//plugin-system/plugin-api-diagram.svg)
如上图，我们将应用结构分成三个部分，分别是`Frontend`、`Backend`、`Plugin Host`，同时也代表着三个不同的进程，RPC就发生在它们之间。Core所在一端称为Main端，而Plugin所在的一端称为Ext端。Plugin API实际上就是Ext端的各种Ext具体实现所暴露的相关接口，第三方开发者使用Plugin API开发他们自己的Plugin来扩展Core，而我们开发Plugin System需要做的就是针对Ext端和Main端做API在各端的通讯实现，然后暴露出Ext端的相关调用作为第三方插件开发者需要用到的Plugin API。通过`Main-Ext`通讯模式，任何一个Plugin如果需要Core的相关信息都可以利用在Plugin侧的Main端代理进行RPC，请求Core侧的Main端本体来完成信息的获取和操纵。反过来，Core如果希望获取Plugin的相关信息，都可以通过本地Ext端的代理进行RPC，请求Ext端本体来完成信息的获取。
综上，Plugin与Core之间的消息传递需要设计RPC作为基础调用方案，然后RPC调用方案为基础进行设计`Main-Ext`通讯模式。

## 添加一个Plugin Api Ext的步骤

要成为一个`Plugin Api Ext`，就是让其成为`ILocalService Contribution`，并实现`ILocalService interface`提供的接口。最后将其加入到`service module`即可。示例如下：

```ts
import { Contribution, IDisposable, InjectableService, toDisposable } from "@gepick/core/common";
import { ILocalService } from "../../../common/rpc-protocol";
import { IPluginHostRpcService } from "../plugin-host-rpc-service";


@Contribution(ILocalService)
export class CommandRegistryExt extends InjectableService implements ILocalService {
   onRpcServiceInit(pluginHostRpcService: IPluginHostRpcService) {
    // 将CommandRegistryExt注册成为rpc local service等待服务请求到来进行相应服务。
    pluginHostRpcService.setLocalService(PluginHostContext.CommandRegistry, this)
    // 提供了plugin api main端的调用能力。
    this.#commandRegistryMain = pluginHostRpcService.getRemoteServiceProxy(MainContext.CommandRegistry);
   }
}
```

完成后，将其加入`servcie module`当中。

```ts
import { Module, ServiceModule } from "@gepick/core/common";
import { CommandRegistryExt } from "./plugin-api/command-registry-ext";

@Module({
  services: [
    CommandRegistryExt,
  ],
})
export class PluginHostModule extends ServiceModule {}
```



## 参考

- [既然有 HTTP 请求，为什么还要用 RPC 调用？ - 知乎](https://www.zhihu.com/question/41609070)

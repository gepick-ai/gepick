## Dependency-Injection

项目组织的基本框架是基于[InversifyJS](https://inversify.io/docs/introduction/getting-started/)进行二次打造的。InversifyJS是一个依赖注入框架，它能够将你的各个服务进行解耦组织，让项目更有组织性。举个例子来说，项目当中有一个Contribution的概念，它是用来收集相关某类功能的。现在假设你需要设计一个偏好设置Preferences的功能，那一个应用当中很多不同功能就可能有自己的Preferences，我们不可能在Preferences核心包当中去直接引入其他功能提供的Preferences子功能，因为这样一来，我们就需要时刻关注新增的子功能Preferences，给维护带来很大成本。现在我们反过来思考，我们只需要提供相关Preferences接口，让子功能去实现它，最终我们核心Preferences包只需要收集符合相关接口的内容，最终注册进主应用，那么问题同样也可以解决。其实这就是控制反转的核心思想，依赖抽象（接口）编程，而不是依赖具体实现编程。

## Gepick的DI框架

在InversifyJS中有一个(Binding Syntax)[https://inversify.io/docs/api/binding-syntax/]的概念，它其实就是绑定过程当中的不同语法，同时也是这些语法的类型。（如果你想深入了解，查看InversifyJS仓库的相关代码，你会发现这就是一堆绑定流程的类实现。）在官方使用当中，基本上都是将绑定语法集中在一个地方统一进行，而Gepick的DI框架对其进行改造，将相关绑定语法做成了Decorator，让你能够将关注点放在具体的Service身上。你只需要往自己的Service身上安装对应的Decorator就能够达到跟官方对应语法的对等效果。比如，官方提供了`BindingOnSyntax.onActivation`这个API，那么在Gepick的DI框架里同样会提供一个`@OnActivation`的装饰器。

示例如下：

```ts
import { InjectableSerivce, interfaces, OnActivation } from "@gepick/core/common";

class MyService extends InjectableSerivce {
  @OnActivation()
  handleActivation(context: interfaces.Context, service: MyService) {
    console.log("onActivation", context, service)
  }
}
```

而在官方的使用是这样的:

```ts
container.bind(Symbol.for(MyService.name)).to(MyService)
  .onActivation((context: interfaces.Context, service: MyService) => {
       console.log("onActivation", context, service)
  })
```

以上效果等效。

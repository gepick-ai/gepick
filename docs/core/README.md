## 可扩展机制

为了让Gepick整体可扩展，我们设计了两大类扩展系统，一个是面向第三方用户的Plugin系统（参考VSCode的Plugin体系），一个是面向内部开发人员的Contribution系统。二者的区别在于Contribution系统是在编译开发时完成具体的扩展功能，而Plugin系统则是在运行时动态加入扩展的功能（或者说明白点就是热插拔机制）。

针对Plugin系统，大部分时候我们都是在定义API的签名和具体对应RPC服务实现，剩下的不需要我们维护，因为插件的代码都是第三方开发人员开发维护的，我们只需要维护核心机制。而Contribution系统主要是对应用总框架各个组分进行扩展实现时需要用到，拿Preferences做例子，我们不可能在设计的时候将所有Preferences偏好设置想好，然后一一引入Core包，这既不符合实际工程实践，也不符合代码设计的原则，即Core包应该是无任何依赖workspace的其他包的，它只依赖第三方包，如果去除第三方依赖部分，Core包应该是依赖图中的第一个节点。但其实Core包又需要用到其他包贡献的功能，咋办？答案是换个思路：依赖倒置。说白了我们不看具体实现，我们只定义契约和相关接口，再收集符合契约的功能就好。因此，我们使用了`InversifyJS`这个依赖注入框架，并对其中的概念进行改造和重写（比如：`container.get`），参考VSCode源码的依赖注入体系是看起来十分舒服的，我们对`InversifyJS`的主要概念（Container、Service、BindingSyntax等）二开以将服务注入的用法和VSCode对标。

项目当中设计了很多Contribution扩展点，你不需要添加`@injectable`，也不需要`@inject`，只需要像普通的class一样继承这些Abstract抽象类，书写你自己的功能代码，最后加入Service Module即可，剩下的都交给Gepick的DI系统自动帮你完成DI服务的注解和收集以及创建工作。

下面是一些常见的Contribution：

### Browser环境

| Contribution                | Description                | Example                                               |
| --------------------------- | -------------------------- | ----------------------------------------------------- |
| `AbstractView<T>`           | 一个自定义Shell视图小组件  | 一个插件市场视图                                      |
| `AbstractPreferencesSchema` | 一组自定义偏好设置Schema   | 一组自定义Plugin功能配置Schema描述                    |
| `AbstractWidgetFactory`     | 一个创建自定义Widget的工厂 | 一个PreferencesWidgetFactory用来创建PreferencesWidget |

### Common环境

| Contribution      | Description    | Example               |
| ----------------- | -------------- | --------------------- |
| `AbstractCommand` | 一条自定义命令 | 一条Open Settings命令 |
|                   |                |                       |
|                   |                |                       |

### Node环境

| Contribution                | Description                                    | Example                           |
| --------------------------- | ---------------------------------------------- | --------------------------------- |
| `AbstractRpcLocalService`   | 一个RPC本地Ext或者Main实现（Main-Ext是一对的） | Command Plugin API的Main-Ext RPC  |
| `AbstractConnectionHandler` | 一个JSON-RPC Connection Handler                | Plugin Service Connection Handler |
|                             |                                                |                                   |

## 文档

- [View](./docs/View.md)
- [Preferences](./docs/Preferences.md)
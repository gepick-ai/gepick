## Preferences System

一个软件系统的不同用户使用习惯和行为不一定是一样的，往往用户都希望按照自己的偏好来使用一个软件系统，因此设计Preferences System来解决用户偏好的使用问题。在设计当中，我们会设计成Preferences System Core和Preferences System Business两个部分，其中Preferences System Core解决Preferences的定义以及操作问题，Preferences System Business提供相关业务操作包括UI视觉等进行Preferences交互。

### 问题

- 用户自定义的相关Preferences存放位置（Preferences存储）
- FeatureA可能需要提供对应FeatureA相关的Preferences（Preferences添加 & Preferences动态化收集）
- 开发当中其他模块可能会需要用到FeatureA Preferences（Preferences检索 & Preferences开发使用体验）
- 相关Feature Preferences如何展示交互（Preferences用户使用体验）
  - 更改Preferences View需要应用新的Preferences（Preferences更新 & Preferences Transaction）

### Preferences System Core

Preferences System Core模块存放在`packages/core/src/browser/preferences`。在Preferences System Core中我们主要设计如下功能场景：

- 每新增一个功能模块可能需要一组对应功能的Preferences​。	

  > [!NOTE]
  >
  > 定义`PreferencesSchemaService`以及`PreferencesSchemaPart Contribution`扩展点，动态化收集不同功能模块贡献的`Preferences Schema`。




### Preferences System Business

该模块存放在`packages/preferences`


用户偏好设置存储在`.gepick/settings.json`或者`$HOME/.gepick/settings.json`中。

按照如下步骤添加一个新功能的Preferences：

- 定义该功能Preference Schema（用来帮助校验功能Preference），并将该功能Preference Schema用装饰器`@Contribution`标记为Preference Schema Contribution。这样一来，我们就能够通过收集不同功能的Preference Schema来组合成一个大的Preference   Schema。
- 定义该功能Preference Proxy（提升该功能Preference搜索效率，虽然我们也可以拿着通用的PreferenceSerivce来使用，但搜索范围会随着功能Preference的添加变得很大，搜索效率降低，因此我们设计Preference Proxy对应一个功能Preference来完成该功能Preference的相关操作）。通过借助通用的PreferenceService以及该功能Preference Schema，我们就能创建一个Preference Proxy。

实际使用一个功能的Preferences，我们只需要注入该功能的Preference Proxy，并使用proxy来完成相关preference的获取即可。

### 核心概念

在偏好管理系统（Preferences System）中，PreferenceProvider、PreferenceScope 和 PreferenceService 的协作体现了分层设计与外观模式（Facade）的典型应用：

#### **1. PreferenceProvider（偏好配置提供器）**

- **作用**
  负责**直接存储和检索配置值**，是底层配置操作的具体实现者（如从文件、数据库或内存中读写配置）。
- **特点**
  - 不感知全局作用域，仅专注于**特定 PreferenceScope**（如用户级、项目级或全局级配置）。
  - 实现可以是多样化的，例如：
    - FilePreferenceProvider（文件存储）
    - DatabasePreferenceProvider（数据库存储）
    - InMemoryPreferenceProvider（内存缓存）。

#### **2. PreferenceScope（偏好作用域）**

- **作用**
  定义配置的**生效范围**（如用户级配置优先于全局配置），并关联对应的 PreferenceProvider。
- **典型层级**
  - **用户级（User Scope）**：用户个性化设置。
  - **项目级（Project Scope）**：特定项目的配置。
  - **全局级（Global Scope）**：系统默认配置。

#### **3. PreferenceService（偏好服务）**

- **角色**
  作为外观模式中的 **Facade**，封装所有 PreferenceProvider 的复杂性，对外提供统一的操作接口（如 getPreference 和 setPreference）。
- **核心职责**
  - **聚合多个 PreferenceProvider**：根据作用域优先级整合配置来源（如用户配置覆盖全局配置）。
  - **协调读写逻辑**：处理配置冲突、缓存优化、异步持久化等。
  - **简化客户端调用**：客户端无需关心底层存储细节和优先级规则。

### **协作流程与设计优势**

#### **1. 数据存取流程示例**

1. **客户端调用 PreferenceService.setPreference("theme", "dark")**
2. **PreferenceService 根据当前作用域（如用户级）定位到对应的 PreferenceProvider**
3. **PreferenceProvider 将值持久化到存储介质（如用户配置文件）**
4. **读取时，PreferenceService 按优先级合并多个作用域的结果**（如用户配置 > 项目配置 > 全局配置）。

#### **2. 外观模式的优势**

| **设计目标**           | **实现方式**                                                 |
| :--------------------- | :----------------------------------------------------------- |
| **简化客户端依赖**     | 客户端仅依赖 PreferenceService，不直接操作 PreferenceProvider。 |
| **解耦存储与业务逻辑** | 新增或替换 PreferenceProvider 不影响客户端代码。             |
| **统一处理复杂逻辑**   | 在门面中集中处理缓存、作用域优先级、事务管理等横切关注点。   |

#### **3. 扩展性与灵活性**

- **动态注册 PreferenceProvider**
  支持运行时添加新的配置来源（如远程配置中心），只需向 PreferenceService 注册新的 Provider。
- **自定义作用域规则**
  可修改 PreferenceService 的作用域优先级逻辑（如环境级配置优先于用户级）。
- **组合其他设计模式**
  - **策略模式**：为不同作用域选择不同的 PreferenceProvider。
  - **观察者模式**：监听配置变更事件（如配置热更新时通知客户端）。

### **总结**

- **PreferenceProvider** 是底层存储的抽象，**PreferenceService** 作为门面封装复杂性，二者通过作用域（PreferenceScope）实现分层配置管理。
- 这种设计通过 **外观模式** 和 **策略模式** 的组合，实现了高内聚、低耦合的配置系统，适用于需要支持多级配置、动态扩展存储来源的场景（如 IDE、企业级应用中）。
- 开发者可通过扩展 PreferenceProvider 和自定义作用域规则，灵活适配不同业务需求。

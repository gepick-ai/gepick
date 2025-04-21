## Preferences

用户偏好设置存储在`.gepick/settings.json`或者`$HOME/.gepick/settings.json`中。

按照如下步骤添加一个新功能的Preferences：

- 定义该功能Preference Schema（用来帮助校验功能Preference），并将该功能Preference Schema用装饰器`@Contribution`标记为Preference Schema Contribution。这样一来，我们就能够通过收集不同功能的Preference Schema来组合成一个大的Preference   Schema。
- 定义该功能Preference Proxy（提升该功能Preference搜索效率，虽然我们也可以拿着通用的PreferenceSerivce来使用，但搜索范围会随着功能Preference的添加变得很大，搜索效率降低，因此我们设计Preference Proxy对应一个功能Preference来完成该功能Preference的相关操作）。通过借助通用的PreferenceService以及该功能Preference Schema，我们就能创建一个Preference Proxy。

实际使用一个功能的Preferences，我们只需要注入该功能的Preference Proxy，并使用proxy来完成相关preference的获取即可。
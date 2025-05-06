import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesWidgetFactory } from "./views/preferences-widget";
import { PreferenceTreeGenerator } from "./util/preference-tree-generator";
import { PreferenceTreeLabelProvider } from "./util/preference-tree-label-provider";
import { PreferenceLayoutProvider } from "./util/preference-layout";
import { PreferenceOpenHandler } from "./preference-open-handler";

import "./style/index.css";
import { PreferenceScopeCommandManager } from "./util/preference-scope-command-manager";
import { PreferenceSelectInputRenderer, PreferenceSelectInputRendererContribution } from "./views/components/preference-select-input";
import { PreferenceArrayInputRenderer, PreferenceArrayInputRendererContribution } from "./views/components/preference-array-input";
import { PreferenceStringInputRenderer, PreferenceStringInputRendererContribution } from "./views/components/preference-string-input";
import { PreferenceNullInputRenderer, PreferenceNullRendererContribution } from "./views/components/preference-null-input";
import { PreferenceBooleanInputRenderer, PreferenceBooleanInputRendererContribution } from "./views/components/preference-boolean-input";
import { PreferenceNumberInputRenderer, PreferenceNumberInputRendererContribution } from "./views/components/preference-number-input";
import { PreferenceJSONLinkRenderer, PreferenceJSONLinkRendererContribution } from "./views/components/preference-json-input";
import { PreferenceHeaderRenderer } from "./views/components/preference-node-renderer";
import { DefaultPreferenceNodeRendererCreatorRegistry, PreferenceHeaderRendererContribution } from "./views/components/preference-node-renderer-creator";
import { PreferenceSingleFilePathInputRenderer, PreferenceSingleFilePathInputRendererContribution } from "./views/components/preference-file-input";

@Module({
  services: [
    PreferenceTreeGenerator,
    PreferenceLayoutProvider,
    PreferenceOpenHandler,
    PreferenceScopeCommandManager,
    // PreferencesView,
    // # region PreferencesWidget
    PreferenceTreeLabelProvider,
    PreferencesWidgetFactory,
    // #endregion

    // #region PreferenceSelectInputRenderer
    PreferenceSelectInputRenderer,
    PreferenceSelectInputRendererContribution,
    // #endregion

    // #region PreferenceArrayInputRenderer
    PreferenceArrayInputRenderer,
    PreferenceArrayInputRendererContribution,
    // #endregion

    // #region PreferenceStringInputRenderer
    PreferenceStringInputRenderer,
    PreferenceStringInputRendererContribution,
    // #endregion

    // #region PreferenceNullInputRenderer
    PreferenceNullInputRenderer,
    PreferenceNullRendererContribution,
    // #endregion

    // #region PreferenceBooleanInputRenderer
    PreferenceBooleanInputRenderer,
    PreferenceBooleanInputRendererContribution,
    // #endregion

    // #region PreferenceNumberInputRenderer
    PreferenceNumberInputRenderer,
    PreferenceNumberInputRendererContribution,
    // #endregion

    // #region PreferenceJSONLinkRenderer
    PreferenceJSONLinkRenderer,
    PreferenceJSONLinkRendererContribution,
    // #endregion

    // #region PreferenceHeaderRenderer
    PreferenceHeaderRenderer,
    PreferenceHeaderRendererContribution,
    // #endregion

    // #region PreferenceSingleFilePathInputRenderer
    PreferenceSingleFilePathInputRenderer,
    PreferenceSingleFilePathInputRendererContribution,
    // #endregion

    // #region DefaultPreferenceNodeRendererCreatorRegistry
    DefaultPreferenceNodeRendererCreatorRegistry,
    // #endregion

    // PreferencesMenuContribution,
  ],
})
export class PreferencesViewModule extends ServiceModule {}

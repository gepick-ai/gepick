import { Module, ServiceModule } from "@gepick/core/common";
import { SourceTree, SourceTreeWidget } from "./source-tree";
import { DefaultTreeProps, NoopTreeDecoratorService, SearchBoxFactoryImpl, TreeExpansionServiceImpl, TreeFocusServiceImpl, TreeImpl, TreeLabelProvider, TreeModelImpl, TreeNavigationService, TreeSearch, TreeSelectionServiceImpl, TreeViewWelcomeWidget } from "./base-tree";
import { FuzzySearch } from "./base-tree/fuzzy-search";

@Module({
  services: [
    // base-tree
    FuzzySearch,
    SearchBoxFactoryImpl,
    NoopTreeDecoratorService,
    TreeExpansionServiceImpl,
    TreeFocusServiceImpl,
    TreeLabelProvider,
    TreeModelImpl,
    TreeNavigationService,
    TreeSearch,
    TreeSelectionServiceImpl,
    TreeViewWelcomeWidget,
    DefaultTreeProps,
    // source-tree
    SourceTree,
    SourceTreeWidget,
  ],
})
export class TreeModule extends ServiceModule {}

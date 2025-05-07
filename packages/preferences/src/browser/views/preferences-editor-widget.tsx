import { AbstractWidget, CompositeTreeNode, DEFAULT_SCROLL_OPTIONS, ExpandableTreeNode, IPreferenceDiff, IPreferencesManager, IPreferencesSchemaService, SelectableTreeNode, StatefulWidget, TopDownTreeIterator } from "@gepick/core/browser";
import { PostConstruct, createServiceDecorator, deepEqual, lodashThrottle, unreachable } from "@gepick/core/common";
import { Preference } from "../util/preference-types";
import { IPreferenceTreeModel, PreferenceFilterChangeEvent, PreferenceFilterChangeSource } from "../preferences-tree-model";
import { COMMONLY_USED_SECTION_PREFIX } from "../util/preference-layout";
import { IPreferencesScopeTabBar } from "./preferences-scope-tabbar-widget";
import { GeneralPreferenceNodeRenderer, IPreferenceNodeRendererFactory } from "./components/preference-node-renderer";
import { IPreferenceNodeRendererCreatorRegistry } from "./components/preference-node-renderer-creator";

export interface PreferencesEditorState {
  firstVisibleChildID: string;
}

export class PreferencesEditorWidget extends AbstractWidget implements StatefulWidget {
  static readonly ID = 'settings.editor';
  static readonly LABEL = 'Settings Editor';

  override scrollOptions = DEFAULT_SCROLL_OPTIONS;

  protected scrollContainer: HTMLDivElement;

  /**
   * Guards against scroll events and selection events looping into each other. Set before this widget initiates a selection.
   */
  protected currentModelSelectionId = '';
  /**
   * Permits the user to expand multiple nodes without each one being collapsed on a new selection.
   */

  protected lastUserSelection = '';
  protected isAtScrollTop = true;
  protected firstVisibleChildID = '';

  protected renderers = new Map<string, any>();
  protected preferenceDataKeys = new Map<string, string>();
  // The commonly used section will duplicate preference ID's, so we'll keep a separate list of them.
  protected commonlyUsedRenderers = new Map<string, any>();

  constructor(
    @IPreferenceNodeRendererFactory protected readonly rendererFactory: IPreferenceNodeRendererFactory,
    @IPreferencesManager protected readonly preferencesManager: IPreferencesManager,
    @IPreferenceTreeModel protected readonly model: IPreferenceTreeModel,
    @IPreferenceNodeRendererCreatorRegistry protected readonly rendererRegistry: IPreferenceNodeRendererCreatorRegistry,
    @IPreferencesScopeTabBar protected readonly tabbar: IPreferencesScopeTabBar,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    this.id = PreferencesEditorWidget.ID;
    this.title.label = PreferencesEditorWidget.LABEL;
    this.addClass('settings-main');
    this.toDispose.pushAll([
      this.preferencesManager.onPreferencesChanged(e => this.handlePreferenceChanges(e)),
      this.model.onFilterChanged(e => this.handleDisplayChange(e)),
      this.model.onSelectionChanged(e => this.handleSelectionChange(e)),
    ]);
    this.createContainers();
    await this.preferencesManager.ready;
    this.handleDisplayChange({ source: PreferenceFilterChangeSource.Schema });
    this.rendererRegistry.onDidChange(() => this.handleRegistryChange());
  }

  protected createContainers(): void {
    const innerWrapper = document.createElement('div');
    innerWrapper.classList.add('settings-main-scroll-container');
    this.scrollContainer = innerWrapper;
    innerWrapper.addEventListener('scroll', this.onScroll, { passive: true });
    this.node.appendChild(innerWrapper);
    
    const noLeavesMessage = document.createElement('div');
    noLeavesMessage.classList.add('settings-no-results-announcement');
    noLeavesMessage.textContent = 'That search query has returned no results.';
    this.node.appendChild(noLeavesMessage);
  }

  protected handleDisplayChange(e: PreferenceFilterChangeEvent): void {
    const { isFiltered } = this.model;
    const currentFirstVisible = this.firstVisibleChildID;
    const leavesAreVisible = this.areLeavesVisible();
    if (e.source === PreferenceFilterChangeSource.Search) {
      this.handleSearchChange(isFiltered, leavesAreVisible);
    }
    else if (e.source === PreferenceFilterChangeSource.Scope) {
      this.handleScopeChange(isFiltered);
    }
    else if (e.source === PreferenceFilterChangeSource.Schema) {
      this.handleSchemaChange(isFiltered);
    }
    else {
      unreachable(e.source, 'Not all PreferenceFilterChangeSource enum variants handled.');
    }
    this.resetScroll(currentFirstVisible, e.source === PreferenceFilterChangeSource.Search && !isFiltered);
  }

  protected handleRegistryChange(): void {
    for (const [id, renderer, collection] of this.allRenderers()) {
      renderer.dispose();
      collection.delete(id);
    }
    this.handleDisplayChange({ source: PreferenceFilterChangeSource.Schema });
  }

  protected handleSchemaChange(isFiltered: boolean): void {
    for (const [id, renderer, collection] of this.allRenderers()) {
      const node = this.model.getNode(renderer.nodeId);
      if (!node || (Preference.LeafNode.is(node) && this.hasSchemaChanged(renderer, node))) {
        renderer.dispose();
        collection.delete(id);
      }
    }
    if (this.model.root) {
      const nodeIterator = Array.from(this.scrollContainer.children)[Symbol.iterator]();
      let nextNode: HTMLElement | undefined = nodeIterator.next().value as HTMLElement | undefined;
      for (const node of new TopDownTreeIterator(this.model.root)) {
        if (Preference.TreeNode.is(node)) {
          const { collection, id } = this.analyzeIDAndGetRendererGroup(node.id);
          const renderer = collection.get(id) ?? this.rendererFactory.createNodeReaderer(node);
          if (!renderer.node.parentElement) { // If it hasn't been attached yet, it hasn't been checked for the current search.
            this.hideIfFailsFilters(renderer, isFiltered);
            collection.set(id, renderer);
          }
          if (nextNode !== renderer.node) {
            if (nextNode) {
              renderer.insertBefore(nextNode);
            }
            else {
              renderer.appendTo(this.scrollContainer);
            }
          }
          else {
            nextNode = nodeIterator.next().value as HTMLElement;
          }
        }
      }
    }
  }

  protected handleScopeChange(isFiltered: boolean = this.model.isFiltered): void {
    for (const [, renderer] of this.allRenderers()) {
      const isHidden = this.hideIfFailsFilters(renderer, isFiltered);
      if (isFiltered || !isHidden) {
        renderer.handleScopeChange?.(isFiltered);
      }
    }
  }

  protected hasSchemaChanged(renderer: GeneralPreferenceNodeRenderer, node: Preference.LeafNode): boolean {
    return !deepEqual(renderer.schema, node.preference.data);
  }

  protected handleSearchChange(isFiltered: boolean, leavesAreVisible: boolean): void {
    if (leavesAreVisible) {
      for (const [, renderer] of this.allRenderers()) {
        const isHidden = this.hideIfFailsFilters(renderer, isFiltered);
        if (!isHidden) {
          renderer.handleSearchChange?.(isFiltered);
        }
      }
    }
  }

  protected areLeavesVisible(): boolean {
    const leavesAreVisible = this.model.totalVisibleLeaves > 0;
    this.node.classList.toggle('no-results', !leavesAreVisible);
    this.scrollContainer.classList.toggle('hidden', !leavesAreVisible);
    return leavesAreVisible;
  }

  protected *allRenderers(): IterableIterator<[string, GeneralPreferenceNodeRenderer, Map<string, GeneralPreferenceNodeRenderer>]> {
    for (const [id, renderer] of this.commonlyUsedRenderers.entries()) {
      yield [id, renderer, this.commonlyUsedRenderers];
    }
    for (const [id, renderer] of this.renderers.entries()) {
      yield [id, renderer, this.renderers];
    }
  }

  protected handlePreferenceChanges(e: IPreferenceDiff[]): void {
    for (const id of e.map(e => e.preferenceName)) {
      this.commonlyUsedRenderers.get(id)?.handleValueChange?.();
      this.renderers.get(id)?.handleValueChange?.();
    }
  }

  /**
   * @returns true if the renderer is hidden, false otherwise.
   */
  protected hideIfFailsFilters(renderer: GeneralPreferenceNodeRenderer, isFiltered: boolean): boolean {
    const row = this.model.currentRows.get(renderer.nodeId);
    if (!row || (CompositeTreeNode.is(row.node) && (isFiltered || row.visibleChildren === 0))) {
      renderer.hide();
      return true;
    }
    else {
      renderer.show();
      return false;
    }
  }

  protected resetScroll(nodeIDToScrollTo?: string, filterWasCleared: boolean = false): void {
    if (this.scrollBar) { // Absent on widget creation
      this.doResetScroll(nodeIDToScrollTo, filterWasCleared);
    }
    else {
      const interval = setInterval(() => {
        if (this.scrollBar) {
          clearInterval(interval);
          this.doResetScroll(nodeIDToScrollTo, filterWasCleared);
        }
      }, 500);
    }
  }

  protected doResetScroll(nodeIDToScrollTo?: string, filterWasCleared: boolean = false): void {
    requestAnimationFrame(() => {
      this.scrollBar?.update();
      if (!filterWasCleared && nodeIDToScrollTo) {
        const { id, collection } = this.analyzeIDAndGetRendererGroup(nodeIDToScrollTo);
        const renderer = collection.get(id);
        if (renderer?.visible) {
          renderer.node.scrollIntoView();
          return;
        }
      }
      this.scrollContainer.scrollTop = 0;
    });
  };

  protected doOnScroll(): void {
    const { scrollContainer } = this;
    const firstVisibleChildID = this.findFirstVisibleChildID();
    this.setFirstVisibleChildID(firstVisibleChildID);
    if (this.isAtScrollTop && scrollContainer.scrollTop !== 0) {
      this.isAtScrollTop = false;
      this.tabbar.toggleShadow(true);
    }
    else if (!this.isAtScrollTop && scrollContainer.scrollTop === 0) {
      this.isAtScrollTop = true;
      this.tabbar.toggleShadow(false);
    }
  };

  onScroll = lodashThrottle(this.doOnScroll.bind(this), 50);

  protected findFirstVisibleChildID(): string | undefined {
    const { scrollTop } = this.scrollContainer;
    for (const [, renderer] of this.allRenderers()) {
      const { offsetTop, offsetHeight } = renderer.node;
      if (Math.abs(offsetTop - scrollTop) <= offsetHeight / 2) {
        return renderer.nodeId;
      }
    }

    return undefined;
  }

  protected shouldUpdateModelSelection = true;

  protected setFirstVisibleChildID(id?: string): void {
    if (id && id !== this.firstVisibleChildID) {
      this.firstVisibleChildID = id;
      if (!this.shouldUpdateModelSelection) { return; }
      let currentNode = this.model.getNode(id);
      let expansionAncestor;
      let selectionAncestor;
      while (currentNode && (!expansionAncestor || !selectionAncestor)) {
        if (!selectionAncestor && SelectableTreeNode.is(currentNode)) {
          selectionAncestor = currentNode;
        }
        if (!expansionAncestor && ExpandableTreeNode.is(currentNode)) {
          expansionAncestor = currentNode;
        }
        currentNode = currentNode.parent;
      }
      if (selectionAncestor) {
        this.currentModelSelectionId = selectionAncestor.id;
        expansionAncestor = expansionAncestor ?? selectionAncestor;
        this.model.selectIfNotSelected(selectionAncestor);
        if (!this.model.isFiltered && id !== this.lastUserSelection) {
          this.lastUserSelection = '';
          this.model.collapseAllExcept(expansionAncestor);
        }
      }
    }
  }

  protected handleSelectionChange(selectionEvent: readonly Readonly<SelectableTreeNode>[]): void {
    const node = selectionEvent[0];
    if (node && node.id !== this.currentModelSelectionId) {
      this.currentModelSelectionId = node.id;
      this.lastUserSelection = node.id;
      if (this.model.isFiltered && CompositeTreeNode.is(node)) {
        for (const candidate of new TopDownTreeIterator(node, { pruneSiblings: true })) {
          const { id, collection } = this.analyzeIDAndGetRendererGroup(candidate.id);
          const renderer = collection.get(id);
          if (renderer?.visible) {
            // When filtered, treat the first visible child as the selected node, since it will be the one scrolled to.
            this.lastUserSelection = renderer.nodeId;
            this.scrollWithoutModelUpdate(renderer.node);
            return;
          }
        }
      }
      else {
        const { id, collection } = this.analyzeIDAndGetRendererGroup(node.id);
        const renderer = collection.get(id);
        this.scrollWithoutModelUpdate(renderer?.node);
      }
    }
  }

  /** Ensures that we don't set the model's selection while attempting to scroll in reaction to a model selection change. */
  protected scrollWithoutModelUpdate(node?: HTMLElement): void {
    if (!node) { return; }
    this.shouldUpdateModelSelection = false;
    node.scrollIntoView();
    requestAnimationFrame(() => this.shouldUpdateModelSelection = true);
  }

  protected analyzeIDAndGetRendererGroup(nodeID: string): { id: string; group: string; collection: Map<string, GeneralPreferenceNodeRenderer> } {
    const { id, group } = Preference.TreeNode.getGroupAndIdFromNodeId(nodeID);
    const collection = group === COMMONLY_USED_SECTION_PREFIX ? this.commonlyUsedRenderers : this.renderers;
    return { id, group, collection };
  }

  protected override getScrollContainer(): HTMLElement {
    return this.scrollContainer;
  }

  storeState(): PreferencesEditorState {
    return {
      firstVisibleChildID: this.firstVisibleChildID,
    };
  }

  restoreState(oldState: any): void {
    this.firstVisibleChildID = oldState.firstVisibleChildID;
    this.resetScroll(this.firstVisibleChildID);
  }
}

export const IPreferencesEditorWidget = createServiceDecorator<IPreferencesEditorWidget>(PreferencesEditorWidget.name);
export type IPreferencesEditorWidget = PreferencesEditorWidget;

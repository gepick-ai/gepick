import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { TreeNode } from './tree';

export class TreeNavigationService extends InjectableService {
  protected index: number = -1;
  protected nodes: TreeNode[] = [];

  get next(): TreeNode | undefined {
    return this.nodes[this.index + 1];
  }

  get prev(): TreeNode | undefined {
    return this.nodes[this.index - 1];
  }

  advance(): TreeNode | undefined {
    const node = this.next;
    if (node) {
      this.index = this.index + 1;
      return node;
    }
    return undefined;
  }

  retreat(): TreeNode | undefined {
    const node = this.prev;
    if (node) {
      this.index = this.index - 1;
      return node;
    }
    return undefined;
  }

  push(node: TreeNode): void {
    this.nodes = this.nodes.slice(0, this.index + 1);
    this.nodes.push(node);
    this.index = this.index + 1;
  }
}
export const ITreeNavigationService = createServiceDecorator<ITreeNavigationService>(TreeNavigationService.name);
export type ITreeNavigationService = TreeNavigationService;

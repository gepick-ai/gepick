import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { TreeNode } from './tree';

export class TreeLabelProvider extends InjectableService {
  canHandle(element: object): number {
    return TreeNode.is(element) ? 50 : 0;
  }

  getIcon(node: TreeNode): string | undefined {
    return node.icon;
  }

  getName(node: TreeNode): string | undefined {
    return node.name;
  }

  getLongName(node: TreeNode): string | undefined {
    return node.description;
  }
}
export const ITreeLabelProvider = createServiceDecorator(TreeLabelProvider.name);
export type ITreeLabelProvider = TreeLabelProvider;

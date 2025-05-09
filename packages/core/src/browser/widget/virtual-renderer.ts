import { VirtualDOM, VirtualNode, VirtualText, h } from "@lumino/virtualdom";

export class VirtualRenderer {
  readonly host: HTMLElement;
  constructor(
    host?: HTMLElement,
  ) {
    this.host = host || document.createElement('div');
  }

  render(): void {
    VirtualRenderer.render(this.doRender(), this.host);
  }

  protected doRender(): h.Child {
    return null;
  }
}

export namespace VirtualRenderer {
  export function render(child: h.Child, host: HTMLElement) {
    const content = toContent(child);
    VirtualDOM.render(content, host);
  }
  export function flatten(children: h.Child[]): h.Child {
    return children.reduce((prev, current) => merge(prev, current), null);
  }

  export function merge(left: h.Child | undefined, right: h.Child | undefined): h.Child {
    if (!right) {
      return left || null;
    }
    if (!left) {
      return right;
    }
    const result = Array.isArray(left) ? left : [left];
    if (Array.isArray(right)) {
      result.push(...right);
    }
    else {
      result.push(right);
    }
    return result;
  }

  export function toContent(children: h.Child): VirtualNode | VirtualNode[] | null {
    if (!children) {
      return null;
    }
    if (typeof children === "string") {
      return new VirtualText(children);
    }
    if (Array.isArray(children)) {
      const nodes: VirtualNode[] = [];
      for (const child of children) {
        if (child) {
          const node = typeof child === "string" ? new VirtualText(child) : child;
          nodes.push(node);
        }
      }
      return nodes;
    }
    return children;
  }
}

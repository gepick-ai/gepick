// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export interface PreferenceLayout {
  id: string;
  label: string;
  children?: PreferenceLayout[];
  settings?: string[];
}

export const COMMONLY_USED_SECTION_PREFIX = 'commonly-used';

export const COMMONLY_USED_LAYOUT = {
  id: COMMONLY_USED_SECTION_PREFIX,
  label: 'Commonly Used',
  settings: [
    'files.autoSave',
    'editor.fontSize',
    'editor.fontFamily',
    'editor.tabSize',
    'editor.renderWhitespace',
    'editor.cursorStyle',
    'editor.multiCursorModifier',
    'editor.insertSpaces',
    'editor.wordWrap',
    'files.exclude',
    'files.associations',
  ],
};

export const DEFAULT_LAYOUT: PreferenceLayout[] = [
  {
    id: 'editor',
    label: 'Text Editor',
    settings: ['editor.*'],
    children: [
      {
        id: 'editor.cursor',
        label: 'Cursor',
        settings: ['editor.cursor*'],
      },
      {
        id: 'editor.find',
        label: 'Find',
        settings: ['editor.find.*'],
      },
      {
        id: 'editor.font',
        label: 'Font',
        settings: ['editor.font*'],
      },
      {
        id: 'editor.format',
        label: 'Formatting',
        settings: ['editor.format*'],
      },
      {
        id: 'editor.diffEditor',
        label: 'Diff Editor',
        settings: ['diffEditor.*'],
      },
      {
        id: 'editor.multiDiffEditor',
        label: 'Multi-File Diff Editor',
        settings: ['multiDiffEditor.*'],
      },
      {
        id: 'editor.minimap',
        label: 'Minimap',
        settings: ['editor.minimap.*'],
      },
      {
        id: 'editor.suggestions',
        label: 'Suggestions',
        settings: ['editor.*suggest*'],
      },
      {
        id: 'editor.files',
        label: 'Files',
        settings: ['files.*'],
      },
    ],
  },
  {
    id: 'workbench',
    label: 'Workbench',
    settings: ['workbench.*', 'workspace.*'],
    children: [
      {
        id: 'workbench.appearance',
        label: 'Appearance',
        settings: [
          'workbench.activityBar.*',
          'workbench.*color*',
          'workbench.fontAliasing',
          'workbench.iconTheme',
          'workbench.sidebar.location',
          'workbench.*.visible',
          'workbench.tips.enabled',
          'workbench.tree.*',
          'workbench.view.*',
        ],
      },
      {
        id: 'workbench.breadcrumbs',
        label: 'Breadcrumbs',
        settings: ['breadcrumbs.*'],
      },
      {
        id: 'workbench.editor',
        label: 'Editor Management',
        settings: ['workbench.editor.*'],
      },
      {
        id: 'workbench.settings',
        label: 'Settings Editor',
        settings: ['workbench.settings.*'],
      },
      {
        id: 'workbench.zenmode',
        label: 'Zen Mode',
        settings: ['zenmode.*'],
      },
      {
        id: 'workbench.screencastmode',
        label: 'Screencast Mode',
        settings: ['screencastMode.*'],
      },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    settings: ['window.*'],
    children: [
      {
        id: 'window.newWindow',
        label: 'New Window',
        settings: ['window.*newwindow*'],
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    children: [
      {
        id: 'features.accessibilitySignals',
        label: 'Accessibility Signals',
        settings: ['accessibility.signal*'],
      },
      {
        id: 'features.accessibility',
        label: 'Accessibility',
        settings: ['accessibility.*'],
      },
      {
        id: 'features.explorer',
        label: 'Explorer',
        settings: ['explorer.*', 'outline.*'],
      },
      {
        id: 'features.search',
        label: 'Search',
        settings: ['search.*'],
      },
      {
        id: 'features.debug',
        label: 'Debug',
        settings: ['debug.*', 'launch'],
      },
      {
        id: 'features.testing',
        label: 'Testing',
        settings: ['testing.*'],
      },
      {
        id: 'features.scm',
        label: 'Source Control',
        settings: ['scm.*'],
      },
      {
        id: 'features.extensions',
        label: 'Extensions',
        settings: ['extensions.*'],
      },
      {
        id: 'features.terminal',
        label: 'Terminal',
        settings: ['terminal.*'],
      },
      {
        id: 'features.task',
        label: 'Task',
        settings: ['task.*'],
      },
      {
        id: 'features.problems',
        label: 'Problems',
        settings: ['problems.*'],
      },
      {
        id: 'features.output',
        label: 'Output',
        settings: ['output.*'],
      },
      {
        id: 'features.comments',
        label: 'Comments',
        settings: ['comments.*'],
      },
      {
        id: 'features.remote',
        label: 'Remote',
        settings: ['remote.*'],
      },
      {
        id: 'features.timeline',
        label: 'Timeline',
        settings: ['timeline.*'],
      },
      {
        id: 'features.toolbar',
        label: 'Toolbar',
        settings: ['toolbar.*'],
      },
      {
        id: 'features.notebook',
        label: 'Notebook',
        settings: ['notebook.*', 'interactiveWindow.*'],
      },
      {
        id: 'features.mergeEditor',
        label: 'Merge Editor',
        settings: ['mergeEditor.*'],
      },
      {
        id: 'features.chat',
        label: 'Chat',
        settings: ['chat.*', 'inlineChat.*'],
      },
    ],
  },
  {
    id: 'application',
    label: 'Application',
    children: [
      {
        id: 'application.http',
        label: 'HTTP',
        settings: ['http.*'],
      },
      {
        id: 'application.keyboard',
        label: 'Keyboard',
        settings: ['keyboard.*'],
      },
      {
        id: 'application.update',
        label: 'Update',
        settings: ['update.*'],
      },
      {
        id: 'application.telemetry',
        label: 'Telemetry',
        settings: ['telemetry.*'],
      },
      {
        id: 'application.settingsSync',
        label: 'Settings Sync',
        settings: ['settingsSync.*'],
      },
      {
        id: 'application.experimental',
        label: 'Experimental',
        settings: ['application.experimental.*'],
      },
      {
        id: 'application.other',
        label: 'Other',
        settings: ['application.*'],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    settings: ['security.*'],
    children: [
      {
        id: 'security.workspace',
        label: 'Workspace',
        settings: ['security.workspace.*'],
      },
    ],
  },
  {
    id: 'ai-features',
    label: 'AI Features',
    children: [
      {
        id: 'ai-features.aiEnablement',
        label: 'AI Enablement',
        settings: ['ai-features.AiEnable.*'],
      },
      {
        id: 'ai-features.anthropic',
        label: 'Anthropic',
        settings: ['ai-features.anthropic.*'],
      },
      {
        id: 'ai-features.chat',
        label: ('Chat'),
        settings: ['ai-features.chat.*'],
      },
      {
        id: 'ai-features.codeCompletion',
        label: 'Code Completion',
        settings: ['ai-features.codeCompletion.*'],
      },
      {
        id: 'ai-features.huggingFace',
        label: 'Hugging Face',
        settings: ['ai-features.huggingFace.*'],
      },
      {
        id: 'ai-features.mcp',
        label: 'MCP',
        settings: ['ai-features.mcp.*'],
      },
      {
        id: 'ai-features.modelSettings',
        label: 'Model Settings',
        settings: ['ai-features.modelSettings.*'],
      },
      {
        id: 'ai-features.ollama',
        label: 'Ollama',
        settings: ['ai-features.ollama'],
      },
      {
        id: 'ai-features.llamafile',
        label: 'Llamafile',
        settings: ['ai-features.llamafile.*'],
      },
      {
        id: 'ai-features.openAiCustom',
        label: 'Open AI Custom Models',
        settings: ['ai-features.openAiCustom.*'],
      },
      {
        id: 'ai-features.openAiOfficial',
        label: 'Open AI Official Models',
        settings: ['ai-features.openAiOfficial.*'],
      },
      {
        id: 'ai-features.promptTemplates',
        label: 'Prompt Templates',
        settings: ['ai-features.promptTemplates.*'],
      },
      {
        id: 'ai-features.SCANOSS',
        label: 'SCANOSS',
        settings: ['ai-features.SCANOSS.*'],
      },
      {
        id: 'ai-features.workspaceFunctions',
        label: 'Workspace Functions',
        settings: ['ai-features.workspaceFunctions.*'],
      },
    ],

  },
  {
    id: 'extensions',
    label: ('Extensions'),
    children: [
      {
        id: 'extensions.hosted-plugin',
        label: 'Hosted Plugin',
        settings: ['hosted-plugin.*'],
      },
    ],
  },
];

export class PreferenceLayoutProvider extends InjectableService {
  getLayout(): PreferenceLayout[] {
    return DEFAULT_LAYOUT;
  }

  getCommonlyUsedLayout(): PreferenceLayout {
    return COMMONLY_USED_LAYOUT;
  }

  hasCategory(id: string): boolean {
    return [...this.getLayout(), this.getCommonlyUsedLayout()].some(e => e.id === id);
  }

  getLayoutForPreference(preferenceId: string): PreferenceLayout | undefined {
    const layout = this.getLayout();
    for (const section of layout) {
      const item = this.findItemInSection(section, preferenceId);
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  protected findItemInSection(section: PreferenceLayout, preferenceId: string): PreferenceLayout | undefined {
    // First check whether any of its children match the preferenceId.
    if (section.children) {
      for (const child of section.children) {
        const item = this.findItemInSection(child, preferenceId);
        if (item) {
          return item;
        }
      }
    }
    // Then check whether the section itself matches the preferenceId.
    if (section.settings) {
      for (const setting of section.settings) {
        if (this.matchesSetting(preferenceId, setting)) {
          return section;
        }
      }
    }
    return undefined;
  }

  protected matchesSetting(preferenceId: string, setting: string): boolean {
    if (setting.includes('*')) {
      return this.createRegExp(setting).test(preferenceId);
    }
    return preferenceId === setting;
  }

  protected createRegExp(setting: string): RegExp {
    return new RegExp(`^${setting.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  }
}

export const IPreferenceLayoutProvider = createServiceDecorator<IPreferenceLayoutProvider>(PreferenceLayoutProvider.name);
export type IPreferenceLayoutProvider = PreferenceLayoutProvider;

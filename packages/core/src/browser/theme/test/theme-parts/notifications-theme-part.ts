import { Color, ColorDefinition } from "@gepick/core/common";
import { AbstractThemePart } from "../../theme-part-contribution";

export class NotificationsThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: 'notificationCenter.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Notifications center border color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationToast.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Notification toast border color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notifications.foreground',
        defaults: {
          dark: 'editorWidget.foreground',
          light: 'editorWidget.foreground',
          hcDark: 'editorWidget.foreground',
          hcLight: 'editorWidget.foreground',
        },
        description: 'Notifications foreground color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notifications.background',
        defaults: {
          dark: 'editorWidget.background',
          light: 'editorWidget.background',
          hcDark: 'editorWidget.background',
          hcLight: 'editorWidget.background',
        },
        description: 'Notifications background color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationLink.foreground',
        defaults: {
          dark: 'textLink.foreground',
          light: 'textLink.foreground',
          hcDark: 'textLink.foreground',
          hcLight: 'textLink.foreground',
        },
        description: 'Notification links foreground color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationCenterHeader.foreground',
        description: 'Notifications center header foreground color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationCenterHeader.background',
        defaults: {
          dark: Color.lighten('notifications.background', 0.3),
          light: Color.darken('notifications.background', 0.05),
          hcDark: 'notifications.background',
          hcLight: 'notifications.background',
        },
        description: 'Notifications center header background color. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notifications.border',
        defaults: {
          dark: 'notificationCenterHeader.background',
          light: 'notificationCenterHeader.background',
          hcDark: 'notificationCenterHeader.background',
          hcLight: 'notificationCenterHeader.background',

        },
        description: 'Notifications border color separating from other notifications in the notifications center. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationsErrorIcon.foreground',
        defaults: {
          dark: 'editorError.foreground',
          light: 'editorError.foreground',
          hcDark: 'editorError.foreground',
          hcLight: 'editorError.foreground',
        },
        description: 'The color used for the icon of error notifications. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationsWarningIcon.foreground',
        defaults: {
          dark: 'editorWarning.foreground',
          light: 'editorWarning.foreground',
          hcDark: 'editorWarning.foreground',
          hcLight: 'editorWarning.foreground',
        },
        description: 'The color used for the icon of warning notifications. Notifications slide in from the bottom right of the window.',
      },
      {
        id: 'notificationsInfoIcon.foreground',
        defaults: {
          dark: 'editorInfo.foreground',
          light: 'editorInfo.foreground',
          hcDark: 'editorInfo.foreground',
          hcLight: 'editorInfo.foreground',
        },
        description: 'The color used for the icon of info notifications. Notifications slide in from the bottom right of the window.',
      },
    ]);
  }
}

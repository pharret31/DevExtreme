import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { DxEvent } from '@js/events';
import type { Item } from '@js/ui/toolbar';
import { getPublicElement } from '@ts/core/m_element';
import type Widget from '@ts/core/widget/widget';
import { DISABLED_STATE_CLASS, type SupportedKeys, WIDGET_CLASS } from '@ts/core/widget/widget';
import type { KeyboardKeyDownEvent } from '@ts/events/core/m_keyboard_processor';
import { BUTTON_GROUP_CLASS } from '@ts/ui/button_group';
import type { ListBase } from '@ts/ui/list/list.base';
import { TEXTEDITOR_CLASS, TEXTEDITOR_INPUT_CLASS } from '@ts/ui/text_box/text_editor.base';

import {
  DROPDOWNMENU_BUTTON_CLASS,
  MENU_CLASS,
  MENU_ITEM_CLASS,
  MENU_ITEM_EXPANDED_CLASS,
  NATIVE_FOCUSABLE_SELECTOR,
  TOOLBAR_ITEMS,
  TOOLBAR_WIDGETS_SELECTOR,
} from './constants';
import type Toolbar from './toolbar';

// All `@ts-expect-error` directives below paper over two known core-typing gaps; remove
// each one as soon as the underlying core type is corrected:
//   1. `dxElementWrapper.data()` (no-arg) is missing from core/renderer.d.ts — only the
//      `data(key, value?)` overload is declared, while at runtime jQuery returns the full
//      data record.
//   2. `Widget.option(...args): TProperties` (core/widget/component.ts) does not narrow on
//      single-key reads, and the base `WidgetProperties` does not declare runtime options
//      contributed by descendants such as dxDropDownButton/dxMenu (e.g. `opened`).
function getItemElementData($element: dxElementWrapper): Record<string, unknown> {
  // @ts-expect-error – dxElementWrapper has no zero-arg `data()` overload (core typing gap).
  const data = $element.data() as unknown;
  return (data ?? {}) as Record<string, unknown>;
}

function isToolbarItemWidgetInstance(value: unknown): value is Widget {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { option?: unknown }).option === 'function';
}

const getItemInstance = ($element: dxElementWrapper): Widget | undefined => {
  const itemData = getItemElementData($element);
  const dxComponents = itemData.dxComponents as string[] | undefined;
  const widgetName = dxComponents?.[0];
  if (!widgetName) {
    return undefined;
  }

  const instance = itemData[widgetName];
  return isToolbarItemWidgetInstance(instance) ? instance : undefined;
};

const getWidgetName = ($element: dxElementWrapper): string => {
  const dxComponents = getItemElementData($element).dxComponents as string[] | undefined;
  return dxComponents?.[0] ?? '';
};

function getItemWidget($item: dxElementWrapper): Widget | undefined {
  const $widget = $item.find(TOOLBAR_WIDGETS_SELECTOR).first();
  return $widget.length ? getItemInstance($widget) : undefined;
}

export function isTextInputTarget(target: HTMLElement): boolean {
  const tagName = target.tagName.toLowerCase();

  return (tagName === 'input' || tagName === 'textarea')
    && $(target).closest(`.${TEXTEDITOR_CLASS}`).length > 0;
}

export function isMenuTarget(target: HTMLElement): boolean {
  return $(target).closest(`.${MENU_CLASS}, .${MENU_ITEM_CLASS}`).length > 0;
}

export function activateMenu($menu: dxElementWrapper): void {
  ($menu.get(0) as HTMLElement).focus();
}

export function closeOpenSubmenu(target: HTMLElement, e: Event): boolean {
  const $menu = $(target).closest(`.${MENU_CLASS}`);
  if (!$menu.length) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const menuInstance = $menu.data('dxMenu') as any;
  if (!menuInstance?._visibleSubmenu) {
    return false;
  }

  e.preventDefault();
  e.stopPropagation();

  const $anchor = $menu.find(`.${MENU_ITEM_EXPANDED_CLASS}`).first();
  menuInstance._hideSubmenu(menuInstance._visibleSubmenu);

  if ($anchor.length) {
    menuInstance.option('focusedElement', getPublicElement($anchor));
  }
  return true;
}

export function closeItemWidget($item: dxElementWrapper): boolean {
  const itemInstance = getItemWidget($item);
  if (!itemInstance) {
    return false;
  }

  // @ts-expect-error – WidgetProperties does not declare `opened` (added by descendants
  // like dxDropDownButton/dxMenu); core's Widget.option(...args): TProperties also does
  // not narrow on single-key reads.
  const { opened } = itemInstance.option();
  if (!opened) {
    return false;
  }

  itemInstance.option('opened', false);
  return true;
}

export function isItemDisabled($item: dxElementWrapper, widgetDisabled: boolean): boolean {
  if (widgetDisabled) {
    return true;
  }
  if ($item.hasClass(DISABLED_STATE_CLASS)) {
    return true;
  }
  const $widget = $item.find(`.${WIDGET_CLASS}`).first();
  return $widget.length > 0 && $widget.hasClass(DISABLED_STATE_CLASS);
}

export function isItemWidgetOpened($item: dxElementWrapper): boolean {
  // @ts-expect-error – WidgetProperties does not declare `opened` (added by descendants
  // like dxDropDownButton/dxMenu); core's Widget.option(...args): TProperties also does
  // not narrow on single-key reads.
  return !!getItemWidget($item)?.option().opened;
}

export function getItemFocusTarget($item: dxElementWrapper): dxElementWrapper | undefined {
  if ($item.hasClass(DROPDOWNMENU_BUTTON_CLASS)) {
    return $item;
  }

  const $widgets = $item.find(TOOLBAR_WIDGETS_SELECTOR);

  if (!$widgets.length) {
    const $nativeFocusable = $item.find(NATIVE_FOCUSABLE_SELECTOR).first();
    return $nativeFocusable.length ? $nativeFocusable : undefined;
  }

  const $widget = $widgets.first();
  const itemInstance = getItemInstance($widget);

  if (!itemInstance) {
    return undefined;
  }

  if ($widget.hasClass(MENU_CLASS)) return $item;
  if ($widget.hasClass(TEXTEDITOR_CLASS)) return $(itemInstance.element());

  const $base = itemInstance._focusTarget?.();
  if (getWidgetName($widget) === 'dxDropDownButton') {
    return $base?.find(`.${BUTTON_GROUP_CLASS}`);
  }
  return $base ?? $(itemInstance.element());
}

export function getPlainItemFocusTargets($item: dxElementWrapper): dxElementWrapper {
  if ($item.hasClass(DROPDOWNMENU_BUTTON_CLASS)) {
    return $();
  }

  const $widgets = $item.find(TOOLBAR_WIDGETS_SELECTOR);
  if ($widgets.length) {
    return $();
  }

  return $item.find(NATIVE_FOCUSABLE_SELECTOR);
}

export function applyItemTabIndex($item: dxElementWrapper, tabIndex: number): void {
  const $focusTarget = getItemFocusTarget($item);
  if (!$focusTarget?.length) {
    return;
  }

  const $plainTargets = getPlainItemFocusTargets($item);
  if ($plainTargets.length > 1) {
    $plainTargets.attr('tabIndex', -1);
  }

  $focusTarget.attr('tabIndex', tabIndex);

  if ($focusTarget.hasClass(TEXTEDITOR_CLASS)) {
    $focusTarget.find(`.${TEXTEDITOR_INPUT_CLASS}`).attr('tabIndex', -1);
  }

  const $menu = $item.find(`.${MENU_CLASS}`);
  if ($menu.length) {
    $menu.attr('tabIndex', -1);
    $menu.find('[tabindex]').attr('tabIndex', -1);
  }
}

export function setItemWidgetFocusState($item: dxElementWrapper, isFocused: boolean): void {
  getItemWidget($item)?._toggleFocusClass?.(isFocused, getItemFocusTarget($item));
}

export function toggleItemFocusableElementTabIndex(
  context: Toolbar | ListBase | undefined,
  item: Item,
): void {
  if (!context) return;

  const $item = context._findItemElementByItem(item);
  if (!$item.length) {
    return;
  }

  const itemData = context._getItemData($item);
  const { disabled } = context.option();
  const isItemNotFocusable = !!(itemData.options?.disabled || itemData.disabled || disabled);

  const { widget } = itemData;

  if (widget && TOOLBAR_ITEMS.includes(widget)) {
    const $widget = $item.find(widget.toLowerCase().replace('dx', '.dx-'));
    if ($widget.length) {
      const itemInstance = getItemInstance($widget);

      if (!itemInstance) {
        return;
      }

      const $base = itemInstance._focusTarget?.();
      const $focusTarget = widget === 'dxDropDownButton'
        ? $base?.find(`.${BUTTON_GROUP_CLASS}`)
        : ($base ?? $(itemInstance.element()));

      const tabIndex = itemData.options?.tabIndex;
      $focusTarget?.attr('tabIndex', isItemNotFocusable ? -1 : (tabIndex ?? 0));
    }
  }
}

// Wraps the inherited `keys.space` handler with a text-input guard. keyboard.on is
// registered with focusTarget=null in both ToolbarBase and ToolbarMenuList, so
// _keyboardHandler fires for every keydown that bubbles up — including those from
// <input>/<textarea> inside an item widget. Without this guard the inherited handler
// would call e.preventDefault() unconditionally and swallow the space character typed
// inside a TextBox or SelectBox.
export function wrapSpaceKey(keys: SupportedKeys): void {
  const originalSpace = keys.space;
  if (!originalSpace) {
    return;
  }

  keys.space = function guardedSpace(
    this: unknown,
    e: DxEvent<KeyboardEvent>,
    options?: KeyboardKeyDownEvent,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ): void | boolean {
    if (isTextInputTarget(e.target as HTMLElement)) {
      return undefined;
    }
    return originalSpace.call(this, e, options);
  };
}

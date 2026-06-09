import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { DxEvent } from '@js/events';
import type { Item } from '@js/ui/toolbar';
import { getPublicElement } from '@ts/core/m_element';
import type { SupportedKeys } from '@ts/core/widget/widget';
import { DISABLED_STATE_CLASS, WIDGET_CLASS } from '@ts/core/widget/widget';
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

// Structural shape of a widget instance attached to a toolbar item. Mirrors only the
// subset of Widget we call at runtime: a typed `option()` (Widget.option uses a
// `(...args): TProperties` signature that does not survive a narrow `option('opened')`
// read), `element()`, and optional focus hooks.
interface ToolbarItemWidgetInstance {
  option: (() => Record<string, unknown>)
  & ((name: string) => unknown)
  & ((name: string, value: unknown) => void);
  element: () => Element;
  _focusTarget?: () => dxElementWrapper | undefined;
  _toggleFocusClass?: (isFocused: boolean, $element?: dxElementWrapper) => void;
}

interface ItemElementData {
  [widgetName: string]: unknown;
  dxComponents?: string[];
}

// dxElementWrapper.data(key) is the only declared overload; jQuery's `.data()` without
// arguments returns the full data record. Isolate the cast here so callers stay typed.
function getItemElementData($element: dxElementWrapper): ItemElementData {
  const data = ($element as unknown as { data: () => unknown }).data();
  return (data ?? {}) as ItemElementData;
}

function isToolbarItemWidgetInstance(value: unknown): value is ToolbarItemWidgetInstance {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { option?: unknown }).option === 'function';
}

const getItemInstance = ($element: dxElementWrapper): ToolbarItemWidgetInstance | undefined => {
  const itemData = getItemElementData($element);
  const widgetName = itemData.dxComponents?.[0];
  if (!widgetName) {
    return undefined;
  }

  const instance = itemData[widgetName];
  return isToolbarItemWidgetInstance(instance) ? instance : undefined;
};

const getWidgetName = ($element: dxElementWrapper): string => (
  getItemElementData($element).dxComponents?.[0] ?? ''
);

function getItemWidget($item: dxElementWrapper): ToolbarItemWidgetInstance | undefined {
  const $widget = $item.find(TOOLBAR_WIDGETS_SELECTOR).first();
  return $widget.length ? getItemInstance($widget) : undefined;
}

// Maps a widget instance to its focus target using the rules shared by getItemFocusTarget
// and toggleItemFocusableElementTabIndex: dxDropDownButton drills into the inner button
// group; every other widget defaults to its declared `_focusTarget()` (or, as a fallback,
// the widget root element). The dx-menu / dx-texteditor item-level overrides stay in
// getItemFocusTarget where the item container is also in scope.
function resolveWidgetFocusTarget(
  itemInstance: ToolbarItemWidgetInstance,
  widgetName: string,
): dxElementWrapper | undefined {
  const $base = itemInstance._focusTarget?.();
  if (widgetName === 'dxDropDownButton') {
    return $base?.find(`.${BUTTON_GROUP_CLASS}`);
  }
  return $base ?? $(itemInstance.element());
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

  return resolveWidgetFocusTarget(itemInstance, getWidgetName($widget));
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

      const $focusTarget = resolveWidgetFocusTarget(itemInstance, widget);

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

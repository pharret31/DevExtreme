import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { Item } from '@js/ui/toolbar';
import { getPublicElement } from '@ts/core/m_element';
import type Widget from '@ts/core/widget/widget';
import type { ListBase } from '@ts/ui/list/list.base';

import type Toolbar from './toolbar';

const BUTTON_GROUP_CLASS = 'dx-buttongroup';
const DROP_DOWN_MENU_BUTTON_CLASS = 'dx-dropdownmenu-button';
const TOOLBAR_ITEMS = ['dxAutocomplete', 'dxButton', 'dxCheckBox', 'dxDateBox', 'dxDateRangeBox', 'dxMenu', 'dxSelectBox', 'dxSwitch', 'dxTabs', 'dxTextBox', 'dxButtonGroup', 'dxDropDownButton'];
const NATIVE_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function isTextInputTarget(target: HTMLElement): boolean {
  const tagName = target.tagName.toLowerCase();

  return (tagName === 'input' || tagName === 'textarea')
    && $(target).closest('.dx-texteditor').length > 0;
}

export function isMenuTarget(target: HTMLElement): boolean {
  return $(target).closest('.dx-menu, .dx-menu-item').length > 0;
}

export function activateMenu($menu: dxElementWrapper): void {
  ($menu.get(0) as HTMLElement).focus();
}

export function closeOpenSubmenu(target: HTMLElement, e: Event): boolean {
  const $menu = $(target).closest('.dx-menu');
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

  const $anchor = $menu.find('.dx-menu-item-expanded').first();
  menuInstance._hideSubmenu(menuInstance._visibleSubmenu);

  if ($anchor.length) {
    menuInstance.option('focusedElement', getPublicElement($anchor));
  }
  return true;
}

const getItemInstance = ($element: dxElementWrapper): Widget => {
  // @ts-expect-error ts-error
  const itemData = $element?.data();
  // @ts-expect-error ts-error
  const dxComponents = itemData?.dxComponents;
  const widgetName = dxComponents?.[0];

  return (widgetName && itemData[widgetName]) as Widget;
};

const getWidgetName = ($element: dxElementWrapper): string => {
  // @ts-expect-error ts-error
  const itemData = $element?.data();
  // @ts-expect-error ts-error
  const dxComponents = itemData?.dxComponents;
  return (dxComponents?.[0] ?? '') as string;
};

export function closeItemWidget($item: dxElementWrapper): boolean {
  const $widgets = $item.find(TOOLBAR_ITEMS.map((w) => w.toLowerCase().replace('dx', '.dx-')).join(','));

  if (!$widgets.length) {
    return false;
  }

  const $widget = $widgets.first();
  const itemInstance = getItemInstance($widget);

  if (itemInstance && typeof (itemInstance as any).option === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
    const opened = (itemInstance as any).option('opened'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (opened) {
      (itemInstance as any).option('opened', false); // eslint-disable-line @typescript-eslint/no-explicit-any
      return true;
    }
  }

  return false;
}

export function isItemDisabled($item: dxElementWrapper, widgetDisabled: boolean): boolean {
  if (widgetDisabled) {
    return true;
  }
  if ($item.hasClass('dx-state-disabled')) {
    return true;
  }
  const $widget = $item.find('.dx-widget').first();
  return $widget.length > 0 && $widget.hasClass('dx-state-disabled');
}

export function isItemWidgetOpened($item: dxElementWrapper): boolean {
  const $widgets = $item.find(TOOLBAR_ITEMS.map((w) => w.toLowerCase().replace('dx', '.dx-')).join(','));

  if (!$widgets.length) {
    return false;
  }

  const $widget = $widgets.first();
  const itemInstance = getItemInstance($widget);

  if (itemInstance && typeof (itemInstance as any).option === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
    return !!(itemInstance as any).option('opened'); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return false;
}

export function getItemFocusTarget($item: dxElementWrapper): dxElementWrapper | undefined {
  if ($item.hasClass(DROP_DOWN_MENU_BUTTON_CLASS)) {
    return $item;
  }

  const $widgets = $item.find(TOOLBAR_ITEMS.map((w) => w.toLowerCase().replace('dx', '.dx-')).join(','));

  if (!$widgets.length) {
    const $nativeFocusable = $item.find(NATIVE_FOCUSABLE_SELECTOR).first();
    return $nativeFocusable.length ? $nativeFocusable : undefined;
  }

  const $widget = $widgets.first();
  const itemInstance = getItemInstance($widget);

  if (!itemInstance) {
    return undefined;
  }

  const $base = itemInstance._focusTarget?.();
  const widgetName = getWidgetName($widget);

  if (widgetName === 'dxDropDownButton') return $base?.find(`.${BUTTON_GROUP_CLASS}`);
  if ($widget.hasClass('dx-menu')) return $item;
  if ($widget.hasClass('dx-texteditor')) return $(itemInstance.element());
  return $base ?? $(itemInstance.element());
}

export function applyItemTabIndex($item: dxElementWrapper, tabIndex: number): void {
  const $focusTarget = getItemFocusTarget($item);
  if (!$focusTarget?.length) {
    return;
  }
  $focusTarget.attr('tabIndex', tabIndex);

  if ($focusTarget.hasClass('dx-texteditor')) {
    $focusTarget.find('.dx-texteditor-input').attr('tabIndex', -1);
  }

  const $menu = $item.find('.dx-menu');
  if ($menu.length) {
    $menu.attr('tabIndex', -1);
    $menu.find('[tabindex]').attr('tabIndex', -1);
  }
}

export function setItemWidgetFocusState($item: dxElementWrapper, isFocused: boolean): void {
  const $widgets = $item.find(TOOLBAR_ITEMS.map((w) => w.toLowerCase().replace('dx', '.dx-')).join(','));

  if (!$widgets.length) {
    return;
  }

  const $widget = $widgets.first();
  const itemInstance = getItemInstance($widget);

  if (itemInstance && typeof itemInstance._toggleFocusClass === 'function') {
    itemInstance._toggleFocusClass(isFocused, getItemFocusTarget($item));
  }
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
  const isItemNotFocusable = !!(itemData.options?.disabled || itemData.disabled || context.option('disabled'));

  const { widget } = itemData;

  if (widget && TOOLBAR_ITEMS.includes(widget)) {
    const $widget = $item.find(widget.toLowerCase().replace('dx', '.dx-'));
    if ($widget.length) {
      const itemInstance = getItemInstance($widget);

      if (!itemInstance) {
        return;
      }

      let $focusTarget = itemInstance._focusTarget?.();

      if (widget === 'dxDropDownButton') {
        $focusTarget = $focusTarget?.find(`.${BUTTON_GROUP_CLASS}`);
      } else {
        $focusTarget = $focusTarget ?? $(itemInstance.element());
      }

      const tabIndex = itemData.options?.tabIndex;
      if (isItemNotFocusable) {
        $focusTarget.attr('tabIndex', -1);
      } else {
        $focusTarget.attr('tabIndex', tabIndex ?? 0);
      }
    }
  }
}

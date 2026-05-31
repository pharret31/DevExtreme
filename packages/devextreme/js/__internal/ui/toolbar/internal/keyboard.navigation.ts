import { keyboard } from '@js/common/core/events/short';
import domAdapter from '@js/core/dom_adapter';
import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { DxEvent } from '@js/events';
import { getPublicElement } from '@ts/core/m_element';
import type { KeyboardKeyDownEvent } from '@ts/events/core/m_keyboard_processor';

import type ToolbarBase from '../toolbar.base';
import {
  applyItemTabIndex,
  closeItemWidget,
  closeOpenSubmenu,
  getItemFocusTarget as defaultGetItemFocusTarget,
  getPlainItemFocusTargets,
  isItemDisabled,
  isItemWidgetOpened,
  isMenuTarget,
  isTextInputTarget,
} from '../toolbar.utils';
import type ToolbarMenuList from './toolbar.menu.list';

type Direction = 'horizontal' | 'vertical';

const HORIZONTAL_KEY_LOCATION: Record<string, string> = {
  ArrowRight: 'right',
  ArrowLeft: 'left',
  Home: 'first',
  End: 'last',
};

const VERTICAL_KEY_LOCATION: Record<string, string> = {
  ArrowDown: 'down',
  ArrowUp: 'up',
  Home: 'first',
  End: 'last',
};

type HostComponent = ToolbarBase | ToolbarMenuList;

export interface RovingTabIndexNavigatorConfig {
  component: HostComponent;
  itemsSelector: string;
  direction: Direction;
  getItemFocusTarget?: ($item: dxElementWrapper) => dxElementWrapper | undefined;
  onTabKey?: () => void;
  onEscapeKey?: () => void;
  isEnabled?: () => boolean;
}

export interface FocusRestoreDescriptor {
  index: number | undefined;
  overflow: boolean;
}

export class RovingTabIndexNavigator {
  private readonly config: RovingTabIndexNavigatorConfig;

  private keyboardListenerId?: string;

  private captureHandler?: (e: KeyboardEvent) => void;

  private $prevActiveItem?: dxElementWrapper;

  constructor(config: RovingTabIndexNavigatorConfig) {
    this.config = config;
  }

  attach(): void {
    this.detach();

    const { component } = this.config;

    this.keyboardListenerId = keyboard.on(
      component._keyboardEventBindingTarget(),
      null,
      (opts: KeyboardKeyDownEvent) => component._keyboardHandler(opts),
    );

    this.attachCaptureHandler();
  }

  detach(): void {
    if (this.keyboardListenerId) {
      keyboard.off(this.keyboardListenerId);
      this.keyboardListenerId = undefined;
    }
    this.detachCaptureHandler();
    this.$prevActiveItem = undefined;
  }

  private getFocusTarget($item: dxElementWrapper): dxElementWrapper | undefined {
    return this.config.getItemFocusTarget
      ? this.config.getItemFocusTarget($item)
      : defaultGetItemFocusTarget($item);
  }

  private getKeyToLocation(): Record<string, string> {
    return this.config.direction === 'horizontal'
      ? HORIZONTAL_KEY_LOCATION
      : VERTICAL_KEY_LOCATION;
  }

  private attachCaptureHandler(): void {
    const element = this.config.component.$element().get(0) as HTMLElement;

    this.captureHandler = (e: KeyboardEvent): void => {
      const { target } = e;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const isTextInput = isTextInputTarget(target);
      const isMenu = isMenuTarget(target);

      if (e.key === 'Tab') {
        this.config.onTabKey?.();
        return;
      }

      if ((isTextInput || isMenu) && e.key !== 'Escape') {
        return;
      }

      if (e.key === 'Escape' && (isTextInput || isMenu)) {
        this.handleEscapeInsideWidget(target, e, isMenu);
        return;
      }

      if (e.key === 'Escape') {
        if (this.config.onEscapeKey) {
          e.preventDefault();
          e.stopPropagation();
          this.config.onEscapeKey();
        }
        return;
      }

      const location = this.getKeyToLocation()[e.key];

      if (!location) {
        return;
      }

      this.syncFocusedItem(target);

      const { focusedElement } = this.config.component.option();
      const $focused = $(focusedElement);
      if ($focused.length && isItemWidgetOpened($focused)) {
        return;
      }

      if (this.moveInsidePlainItem(target, location, e)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.moveFocus(location);
      this.focusPlainItemEdge(location);
    };

    element.addEventListener('keydown', this.captureHandler as EventListener, true);
  }

  private detachCaptureHandler(): void {
    if (this.captureHandler) {
      const element = this.config.component.$element().get(0) as HTMLElement;
      element.removeEventListener('keydown', this.captureHandler as EventListener, true);
      this.captureHandler = undefined;
    }
  }

  private moveInsidePlainItem(
    target: HTMLElement,
    location: string,
    e: KeyboardEvent,
  ): boolean {
    if (this.config.direction !== 'horizontal' || (location !== 'left' && location !== 'right')) {
      return false;
    }

    const { focusedElement } = this.config.component.option();
    const $focused = $(focusedElement);
    const $item = $(target).closest(this.config.itemsSelector);

    if (!$focused.length || $focused.get(0) !== $item.get(0)) {
      return false;
    }

    const $targets = getPlainItemFocusTargets($focused);
    if ($targets.length <= 1) {
      return false;
    }

    const targets = $targets.toArray() as HTMLElement[];
    const currentIndex = targets.findIndex((
      element,
    ) => element === target || element.contains(target));
    if (currentIndex < 0) {
      return false;
    }

    const nextIndex = currentIndex + (location === 'right' ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= targets.length) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    $targets.attr('tabIndex', -1);
    $(targets[nextIndex]).attr('tabIndex', this.getItemTabIndex($focused));
    targets[nextIndex].focus();

    return true;
  }

  private focusPlainItemEdge(location: string): void {
    if (this.config.direction !== 'horizontal' || (location !== 'left' && location !== 'right')) {
      return;
    }

    const { focusedElement } = this.config.component.option();
    const $focused = $(focusedElement);
    const $targets = getPlainItemFocusTargets($focused);

    if ($targets.length <= 1) {
      return;
    }

    const targets = $targets.toArray() as HTMLElement[];
    const edgeTarget = location === 'left' ? targets[targets.length - 1] : targets[0];

    $targets.attr('tabIndex', -1);
    $(edgeTarget).attr('tabIndex', this.getItemTabIndex($focused));
    edgeTarget.focus();
  }

  private handleEscapeInsideWidget(target: HTMLElement, e: KeyboardEvent, isMenu: boolean): void {
    if (isMenu && closeOpenSubmenu(target, e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const $item = $(target).closest(this.config.itemsSelector);
    if ($item.length && closeItemWidget($item)) {
      return;
    }

    if ($item.length) {
      this.focusItemWidget($item);
    }
  }

  private syncFocusedItem(target: HTMLElement): void {
    let $item = $(target).closest(this.config.itemsSelector);

    if (!$item.length) {
      $item = $(target)
        .find('[tabindex="0"]')
        .closest(this.config.itemsSelector)
        .first();
    }

    if ($item.length && defaultGetItemFocusTarget($item)?.length) {
      this.config.component.option({ focusedElement: getPublicElement($item) });
    }
  }

  moveFocus(location: string, e?: DxEvent<KeyboardEvent>): void {
    this.config.component._moveFocus(location, e);
  }

  focusInHandler(
    component: HostComponent,
    e: DxEvent,
  ): void {
    const $target = $(e.target as Element);
    const $item = $target.closest(this.config.itemsSelector);

    if ($item.length && defaultGetItemFocusTarget($item)?.length) {
      component.option({ focusedElement: getPublicElement($item) });
    }
  }

  focusItemWidget($item: dxElementWrapper): void {
    const $focusTarget = this.getFocusTarget($item);
    if (!$focusTarget?.length) {
      return;
    }
    ($focusTarget.get(0) as HTMLElement).focus();
  }

  getAvailableItems($itemElements?: dxElementWrapper): dxElementWrapper {
    return this.config.component._getAvailableItems($itemElements);
  }

  getItemTabIndex($item: dxElementWrapper): number {
    const itemData = this.config.component._getItemData($item) as
      | { options?: { tabIndex?: number } }
      | undefined;
    return itemData?.options?.tabIndex ?? 0;
  }

  updateRovingTabIndex($activeItem?: dxElementWrapper): void {
    const { isEnabled } = this.config;
    const enabled = isEnabled?.() ?? false;
    if (!enabled) {
      return;
    }

    const $prev = this.$prevActiveItem;
    const prev = $prev?.get(0);
    const next = $activeItem?.get(0);

    if ($prev && prev && prev !== next && prev.isConnected) {
      applyItemTabIndex($prev, -1);
    }

    if ($activeItem?.length) {
      applyItemTabIndex($activeItem, this.getItemTabIndex($activeItem));
      this.$prevActiveItem = $activeItem;
      return;
    }

    const $first = this.getAvailableItems().first();
    if ($first.length) {
      applyItemTabIndex($first, this.getItemTabIndex($first));
      this.$prevActiveItem = $first;
    } else {
      this.$prevActiveItem = undefined;
    }
  }

  resetRovingTabIndex(itemsContainer: dxElementWrapper): void {
    const { isEnabled } = this.config;
    const enabled = isEnabled?.() ?? false;
    if (!enabled) {
      return;
    }

    const $allItems = itemsContainer.find(this.config.itemsSelector);
    $allItems.each((_index: number, item: Element): boolean => {
      applyItemTabIndex($(item), -1);
      return true;
    });

    this.$prevActiveItem = undefined;

    const { focusedElement } = this.config.component.option();
    const $focused = $(focusedElement);
    const $available = this.getAvailableItems();
    const focusedEl = $focused.get(0);
    const isFocusedAvailable = !!focusedEl && $available.toArray().includes(focusedEl);
    const $newActive = isFocusedAvailable ? $focused : $available.first();

    if ($newActive.length) {
      applyItemTabIndex($newActive, this.getItemTabIndex($newActive));
      this.$prevActiveItem = $newActive;
    }
  }

  // NOTE: tri-state result consumed before a full re-render:
  // - descriptor: DOM focus was on a toolbar item -> remember it for restore;
  // - null: focus moved to a real element outside the toolbar -> drop pending state;
  // - undefined: navigation disabled or focus on body/null -> keep pending state intact
  //   (a nested re-render may run after the item DOM was already cleaned).
  captureFocusedItem(): FocusRestoreDescriptor | null | undefined {
    const enabled = this.config.isEnabled?.() ?? false;
    if (!enabled) {
      return undefined;
    }

    const root = this.config.component.$element().get(0) as HTMLElement | undefined;
    const active = domAdapter.getActiveElement(root);
    const insideToolbar = !!active && active !== root && !!root?.contains(active);

    if (!insideToolbar) {
      // Focus on body/null (e.g. the focused item was removed mid re-render) keeps the
      // pending state, so a nested re-render does not lose the original capture. Focus on
      // any other real element means the user moved away -> drop the pending state.
      const body = domAdapter.getBody();
      return active && active !== body ? null : undefined;
    }

    const $item = $(active).closest(this.config.itemsSelector);
    if (!$item.length) {
      return null;
    }

    const itemIndexKey = this.config.component._itemIndexKey();
    const index = $item.data(itemIndexKey) as unknown as number | undefined;

    return {
      index: typeof index === 'number' ? index : undefined,
      overflow: $item.hasClass('dx-dropdownmenu-button'),
    };
  }

  // Returns a descriptor for $item only if it currently owns DOM focus — e.g. the focused
  // item is being disabled in place (an incremental option('items[n].disabled', true), not a
  // full re-render). The caller restores focus onto an adjacent enabled item afterwards.
  captureItemIfFocused($item: dxElementWrapper): FocusRestoreDescriptor | undefined {
    const enabled = this.config.isEnabled?.() ?? false;
    if (!enabled || !$item?.length) {
      return undefined;
    }

    const root = this.config.component.$element().get(0) as HTMLElement | undefined;
    const active = domAdapter.getActiveElement(root);
    const item = $item.get(0);
    if (!active || !item?.contains(active)) {
      return undefined;
    }

    const itemIndexKey = this.config.component._itemIndexKey();
    const index = $item.data(itemIndexKey) as unknown as number | undefined;

    return {
      index: typeof index === 'number' ? index : undefined,
      overflow: $item.hasClass('dx-dropdownmenu-button'),
    };
  }

  restoreFocus(descriptor: FocusRestoreDescriptor): void {
    const enabled = this.config.isEnabled?.() ?? false;
    if (!enabled) {
      return;
    }

    const $available = this.getAvailableItems();
    if (!$available.length) {
      return;
    }

    const $target = this.resolveRestoreTarget($available, descriptor);
    if (!$target?.length) {
      return;
    }

    // NOTE: updateRovingTabIndex moves the single tab stop from the reset default
    // (first item) onto the restored target before focus, so there is never a moment
    // with two tab stops, regardless of whether focusin fires synchronously.
    this.updateRovingTabIndex($target);
    this.focusItemWidget($target);
  }

  private resolveRestoreTarget(
    $available: dxElementWrapper,
    descriptor: FocusRestoreDescriptor,
  ): dxElementWrapper | undefined {
    const { index, overflow } = descriptor;

    if (overflow) {
      const $overflow = $available.filter('.dx-dropdownmenu-button');
      if ($overflow.length) {
        return $overflow.first();
      }
    }

    if (index !== undefined) {
      const itemIndexKey = this.config.component._itemIndexKey();
      const available = $available.toArray();
      const getIndex = (el: Element): number | undefined => (
        $(el).data(itemIndexKey) as unknown as number | undefined
      );

      const exact = available.find((el) => getIndex(el) === index);
      if (exact) {
        return $(exact);
      }

      const nearest = available.find((el) => {
        const elIndex = getIndex(el);
        return elIndex !== undefined && elIndex >= index;
      });

      return $(nearest ?? available[available.length - 1]);
    }

    return $available.first();
  }
}

export function enterKeyHandler(
  component: HostComponent,
  e: DxEvent<KeyboardEvent>,
  callSuper: (e: DxEvent<KeyboardEvent>) => void,
): void {
  const { focusStateEnabled, focusedElement } = component.option();

  if (!focusStateEnabled) {
    callSuper(e);
    return;
  }

  const target = e.target as HTMLElement;
  if (isTextInputTarget(target) || isMenuTarget(target)) {
    return;
  }

  component._handleActivationAtNavLevel(e);
  if (e.defaultPrevented) {
    return;
  }

  const $item = $(focusedElement);
  if ($item.length) {
    const $textEditor = $item.find('.dx-texteditor-input').first();
    if ($textEditor.length) {
      e.preventDefault();
      ($textEditor.get(0) as HTMLElement).focus();
      return;
    }
  }

  callSuper(e);
}

export function focusOutHandler(
  component: HostComponent,
  e: DxEvent,
  callSuper: (e: DxEvent) => void,
): void {
  const { relatedTarget } = e as DxEvent & { relatedTarget: Element };
  const target = e.target as Element;

  if (relatedTarget && component.$element().get(0)?.contains(relatedTarget)) {
    return;
  }

  if (relatedTarget && $(relatedTarget).closest('.dx-overlay-content').length) {
    return;
  }

  if (target && $(target).closest('.dx-overlay-content').length) {
    return;
  }

  callSuper(e);
}

export function focusItemWidget(
  component: HostComponent,
  $item: dxElementWrapper,
): void {
  if (component._navigator) {
    component._navigator.focusItemWidget($item);
    return;
  }
  const $focusTarget = component._getItemFocusTarget($item);
  if (!$focusTarget?.length) {
    return;
  }
  ($focusTarget.get(0) as HTMLElement).focus();
}

export function getAvailableItems(
  component: HostComponent,
  $itemElements?: dxElementWrapper,
): dxElementWrapper {
  const $visible = component._getVisibleItems($itemElements);
  const { disabled } = component.option();
  const widgetDisabled = !!disabled;
  const elements = Array.from($visible.toArray()).filter(
    (item) => !isItemDisabled($(item), widgetDisabled)
      && !!component._getItemFocusTarget($(item))?.length,
  );

  return $(elements) as unknown as dxElementWrapper;
}

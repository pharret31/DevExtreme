import { keyboard } from '@js/common/core/events/short';
import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { DxEvent } from '@js/events';
import type { Item } from '@js/ui/toolbar';

import {
  applyItemTabIndex,
  closeItemWidget,
  closeOpenSubmenu,
  getItemFocusTarget as defaultGetItemFocusTarget,
  isItemWidgetOpened,
  isMenuTarget,
  isTextInputTarget,
} from '../toolbar.utils';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HostWidget = any;

export interface RovingTabIndexNavigatorConfig {
  widget: HostWidget;
  itemsSelector: string;
  direction: Direction;
  getItemFocusTarget?: ($item: dxElementWrapper) => dxElementWrapper | undefined;
  onTabKey?: () => void;
  onEscapeKey?: () => void;
}

export class RovingTabIndexNavigator {
  private readonly config: RovingTabIndexNavigatorConfig;

  private keyboardListenerId?: string;

  private captureHandler?: EventListener;

  private $prevActiveItem?: dxElementWrapper;

  constructor(config: RovingTabIndexNavigatorConfig) {
    this.config = config;
  }

  attach(): void {
    this.detach();

    const { widget } = this.config;

    this.keyboardListenerId = keyboard.on(
      widget._keyboardEventBindingTarget(),
      null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (opts: any) => widget._keyboardHandler(opts),
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
    const element = this.config.widget.$element().get(0) as HTMLElement;

    this.captureHandler = (evt: Event): void => {
      const e = evt as KeyboardEvent;
      const target = e.target as HTMLElement;

      const isTextInput = isTextInputTarget(target);
      const isMenu = isMenuTarget(target);

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

      if (e.key === 'Tab') {
        this.config.onTabKey?.();
        return;
      }

      const location = this.getKeyToLocation()[e.key];

      if (!location) {
        return;
      }

      const { focusedElement } = this.config.widget.option();
      const $focused = $(focusedElement);
      if ($focused.length && isItemWidgetOpened($focused)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.moveFocus(location);
    };

    element.addEventListener('keydown', this.captureHandler, true);
  }

  private detachCaptureHandler(): void {
    if (this.captureHandler) {
      const element = this.config.widget.$element().get(0) as HTMLElement;
      element.removeEventListener('keydown', this.captureHandler, true);
      this.captureHandler = undefined;
    }
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

  moveFocus(location: string, e?: DxEvent<KeyboardEvent>): void {
    this.config.widget._moveFocus(location, e);
  }

  focusItemWidget($item: dxElementWrapper): void {
    const $focusTarget = this.getFocusTarget($item);
    if (!$focusTarget?.length) {
      return;
    }
    ($focusTarget.get(0) as HTMLElement).focus();
  }

  getAvailableItems($itemElements?: dxElementWrapper): dxElementWrapper {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.config.widget._getAvailableItems($itemElements);
  }

  getItemTabIndex($item: dxElementWrapper): number {
    const itemData = this.config.widget._getItemData($item);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (itemData as Item)?.options?.tabIndex ?? 0;
  }

  updateRovingTabIndex($activeItem?: dxElementWrapper): void {
    if (!this.config.widget.option('focusStateEnabled')) {
      return;
    }

    const prev = this.$prevActiveItem?.get(0);
    const next = $activeItem?.get(0);

    if (prev && prev !== next && prev.isConnected) {
      applyItemTabIndex(this.$prevActiveItem as dxElementWrapper, -1);
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
    if (!this.config.widget.option('focusStateEnabled')) {
      return;
    }

    const $allItems = itemsContainer.find(this.config.itemsSelector);
    $allItems.each((_index: number, item: Element): boolean => {
      applyItemTabIndex($(item), -1);
      return true;
    });

    this.$prevActiveItem = undefined;

    const { focusedElement } = this.config.widget.option();
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
}

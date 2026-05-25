import { keyboard } from '@js/common/core/events/short';
import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import type { DxEvent } from '@js/events';
import type { Item } from '@js/ui/toolbar';
import type { KeyboardKeyDownEvent } from '@ts/events/core/m_keyboard_processor';

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

interface HostComponent {
  $element: () => dxElementWrapper;
  _keyboardEventBindingTarget: () => dxElementWrapper;
  _keyboardHandler: (opts: KeyboardKeyDownEvent) => boolean;
  option: () => {
    focusedElement?: Element | dxElementWrapper | null;
    focusStateEnabled?: boolean;
  };
  _moveFocus: (location: string, e?: DxEvent<KeyboardEvent>) => void;
  _getAvailableItems: ($itemElements?: dxElementWrapper) => dxElementWrapper;
  _getItemData: ($item: dxElementWrapper) => Item;
}

export interface RovingTabIndexNavigatorConfig {
  component: HostComponent;
  itemsSelector: string;
  direction: Direction;
  getItemFocusTarget?: ($item: dxElementWrapper) => dxElementWrapper | undefined;
  onTabKey?: () => void;
  onEscapeKey?: () => void;
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

      const { focusedElement } = this.config.component.option();
      const $focused = $(focusedElement);
      if ($focused.length && isItemWidgetOpened($focused)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.moveFocus(location);
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
    this.config.component._moveFocus(location, e);
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
    const itemData = this.config.component._getItemData($item);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return itemData?.options?.tabIndex ?? 0;
  }

  updateRovingTabIndex($activeItem?: dxElementWrapper): void {
    if (!this.config.component.option().focusStateEnabled) {
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
    if (!this.config.component.option().focusStateEnabled) {
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
}

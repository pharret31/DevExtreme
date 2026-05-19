import type { ToolbarItemComponent } from '@js/common';
import { keyboard } from '@js/common/core/events/short';
import type { DataSourceOptions } from '@js/common/data';
import type { dxElementWrapper } from '@js/core/renderer';
import $ from '@js/core/renderer';
import { each } from '@js/core/utils/iterator';
import type { DxEvent } from '@js/events';
import type { Item } from '@js/ui/toolbar';
import { getPublicElement } from '@ts/core/m_element';
import type { ActionConfig } from '@ts/core/widget/component';
import type { SupportedKeys } from '@ts/core/widget/widget';
import type { ItemRenderInfo, ItemTemplate } from '@ts/ui/collection/collection_widget.base';
import { ListBase } from '@ts/ui/list/list.base';
import {
  closeItemWidget, getItemFocusTarget, isItemWidgetOpened, setItemWidgetFocusState,
} from '@ts/ui/toolbar/toolbar.utils';

export const TOOLBAR_MENU_ACTION_CLASS = 'dx-toolbar-menu-action';
const TOOLBAR_HIDDEN_BUTTON_CLASS = 'dx-toolbar-hidden-button';
const TOOLBAR_HIDDEN_BUTTON_GROUP_CLASS = 'dx-toolbar-hidden-button-group';
const TOOLBAR_MENU_SECTION_CLASS = 'dx-toolbar-menu-section';
const TOOLBAR_MENU_CUSTOM_CLASS = 'dx-toolbar-menu-custom';
const TOOLBAR_MENU_LAST_SECTION_CLASS = 'dx-toolbar-menu-last-section';
const SCROLLVIEW_CONTENT_CLASS = 'dx-scrollview-content';

type ActionableComponents = Extract<ToolbarItemComponent, 'dxButton' | 'dxButtonGroup'>;
export default class ToolbarMenuList extends ListBase {
  _captureKeydownHandler?: EventListener;

  _onEscapePress?: () => void;

  _keyboardListenerId?: string;

  protected _activeStateUnit(): string {
    return `.${TOOLBAR_MENU_ACTION_CLASS}:not(.${TOOLBAR_HIDDEN_BUTTON_GROUP_CLASS})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _toggleFocusClass(_isFocused: boolean, _$element?: dxElementWrapper): void {
    // Intentionally empty: visual focus is managed by setItemWidgetFocusState on inner widgets,
    // not by dx-state-focused on the list item container.
  }

  _initMarkup(): void {
    this._renderSections();
    super._initMarkup();
    this._setMenuRole();
  }

  _getSections(): dxElementWrapper {
    return this._itemContainer().children();
  }

  _itemElements(): dxElementWrapper {
    return this._getSections().children(this._itemSelector());
  }

  _renderSections(): void {
    const $container = this._itemContainer();

    each(['before', 'center', 'after', 'menu'], (_, section) => {
      const sectionName = `_$${section}Section`;

      if (!this[sectionName]) {
        this[sectionName] = $('<div>')
          .addClass(TOOLBAR_MENU_SECTION_CLASS);
      }

      this[sectionName].appendTo($container);
    });
  }

  _renderItems(items: Item[]): void {
    super._renderItems(items);
    this._updateSections();
  }

  _setMenuRole(): void {
    const $menuContainer = this.$element().find(`.${SCROLLVIEW_CONTENT_CLASS}`);

    $menuContainer.attr('role', 'menu');
  }

  _updateSections(): void {
    const $sections = this.$element().find(`.${TOOLBAR_MENU_SECTION_CLASS}`);
    $sections.removeClass(TOOLBAR_MENU_LAST_SECTION_CLASS);
    $sections.not(':empty').eq(-1).addClass(TOOLBAR_MENU_LAST_SECTION_CLASS);
  }

  _renderItem(
    index: number,
    item: Item,
    _$container: dxElementWrapper,
    $itemToReplace: dxElementWrapper,
  ): dxElementWrapper {
    const $container = this[`_$${item.location ?? 'menu'}Section`];
    const $itemElement = super._renderItem(index, item, $container, $itemToReplace);

    const itemCssClasses = this._getItemCssClasses(item);
    $itemElement.addClass(itemCssClasses.join(' '));

    return $itemElement;
  }

  _getItemCssClasses(item: Item): string[] {
    const cssClasses: string[] = [];
    const actionableComponents = this._getActionableComponents();
    // @ts-expect-error ts-error
    if (this._getItemTemplateName({ itemData: item })) {
      cssClasses.push(TOOLBAR_MENU_CUSTOM_CLASS);
    }

    if ((!item.location && !item.widget)
      || actionableComponents.some((component) => component === item.widget)) {
      cssClasses.push(TOOLBAR_MENU_ACTION_CLASS);
    }

    if (item.widget === 'dxButton') {
      cssClasses.push(TOOLBAR_HIDDEN_BUTTON_CLASS);
    }

    if (item.widget === 'dxButtonGroup') {
      cssClasses.push(TOOLBAR_HIDDEN_BUTTON_GROUP_CLASS);
    }

    if (item.cssClass) {
      cssClasses.push(item.cssClass);
    }

    return cssClasses;
  }

  _getActionableComponents(): ActionableComponents[] {
    return ['dxButton', 'dxButtonGroup'];
  }

  _getItemTemplateName(args: ItemRenderInfo<Item>): ItemTemplate<Item> {
    const template = super._getItemTemplateName(args);
    const data = args.itemData;
    const menuTemplate = data?.menuItemTemplate;

    return menuTemplate ?? template;
  }

  _dataSourceOptions(): DataSourceOptions {
    return {
      paginate: false,
    };
  }

  _supportedKeys(): SupportedKeys {
    const keys = super._supportedKeys();

    delete keys.leftArrow;
    delete keys.rightArrow;
    delete keys.upArrow;
    delete keys.downArrow;
    delete keys.home;
    delete keys.end;

    const originalEnter = keys.enter;
    keys.enter = (e: DxEvent<KeyboardEvent>): void => {
      const target = e.target as HTMLElement;

      if (this._isTextInputTarget(target) || this._isMenuTarget(target)) {
        return;
      }

      const { focusedElement } = this.option();
      const $item = $(focusedElement);

      if ($item.length) {
        const $textEditor = $item.find('.dx-texteditor-input').first();
        if ($textEditor.length) {
          e.preventDefault();
          ($textEditor.get(0) as HTMLElement).focus();
          return;
        }

        const $menu = $item.find('.dx-menu').first();
        if ($menu.length) {
          e.preventDefault();
          const menuInstance = $menu.data('dxMenu');
          if (menuInstance) {
            // @ts-expect-error ts-error
            menuInstance.focus();
          }
          return;
        }
      }

      originalEnter?.call(this, e);
    };

    return keys;
  }

  _attachKeyboardEvents(): void {
    this._detachKeyboardEvents();

    const { focusStateEnabled } = this.option();

    if (focusStateEnabled) {
      this._keyboardListenerId = keyboard.on(
        this._keyboardEventBindingTarget(),
        null,
        (opts) => this._keyboardHandler(opts),
      );

      this._attachCaptureKeyHandler();
    }
  }

  _detachKeyboardEvents(): void {
    if (this._keyboardListenerId) {
      keyboard.off(this._keyboardListenerId);
      this._keyboardListenerId = undefined;
    }

    this._detachCaptureKeyHandler();
  }

  _attachCaptureKeyHandler(): void {
    this._detachCaptureKeyHandler();

    const element = this.$element().get(0) as HTMLElement;

    this._captureKeydownHandler = (evt: Event): void => {
      const e = evt as KeyboardEvent;
      const target = e.target as HTMLElement;

      const isTextInput = this._isTextInputTarget(target);
      const isMenu = this._isMenuTarget(target);

      if ((isTextInput || isMenu) && e.key !== 'Escape') {
        return;
      }

      if (e.key === 'Escape' && (isTextInput || isMenu)) {
        e.preventDefault();
        e.stopPropagation();

        const $item = $(target).closest(this._itemSelector());
        if ($item.length && closeItemWidget($item)) {
          return;
        }

        if ($item.length) {
          this._focusItemWidget($item);
        }

        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this._onEscapePress?.();

        return;
      }

      const keyToLocation: Record<string, string> = {
        ArrowDown: 'down',
        ArrowUp: 'up',
        Home: 'first',
        End: 'last',
      };

      const location = keyToLocation[e.key];

      if (!location) {
        return;
      }

      const { focusedElement } = this.option();
      const $focused = $(focusedElement);
      if ($focused.length && isItemWidgetOpened($focused)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this._moveFocus(location);
    };

    element.addEventListener('keydown', this._captureKeydownHandler, true);
  }

  _detachCaptureKeyHandler(): void {
    if (this._captureKeydownHandler) {
      const element = this.$element().get(0) as HTMLElement;
      element.removeEventListener('keydown', this._captureKeydownHandler, true);
      this._captureKeydownHandler = undefined;
    }
  }

  _isTextInputTarget(target: HTMLElement): boolean {
    const tagName = target.tagName.toLowerCase();

    return (tagName === 'input' || tagName === 'textarea')
      && $(target).closest('.dx-texteditor').length > 0;
  }

  _isMenuTarget(target: HTMLElement): boolean {
    return $(target).closest('.dx-menu').length > 0;
  }

  _getItemFocusTarget($item: dxElementWrapper): dxElementWrapper {
    return getItemFocusTarget($item) ?? ($item.hasClass(TOOLBAR_MENU_ACTION_CLASS) ? $item : $());
  }

  _isItemDisabled($item: dxElementWrapper): boolean {
    if (this.option('disabled')) {
      return true;
    }

    if ($item.hasClass('dx-state-disabled')) {
      return true;
    }

    const $widget = $item.find('.dx-widget').first();
    if ($widget.length && $widget.hasClass('dx-state-disabled')) {
      return true;
    }

    return false;
  }

  _getAvailableItems($itemElements?: dxElementWrapper): dxElementWrapper {
    const $visible = this._getVisibleItems($itemElements);
    const elements = Array.from($visible.toArray()).filter(
      (item) => !this._isItemDisabled($(item)) && !!this._getItemFocusTarget($(item)).length,
    );

    return $(elements) as unknown as dxElementWrapper;
  }

  _setFocusedItem($target: dxElementWrapper): void {
    super._setFocusedItem($target);
    this._updateRovingTabIndex($target);
  }

  _getItemTabIndex($item: dxElementWrapper): number {
    const itemData = this._getItemData($item);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (itemData as Item)?.options?.tabIndex ?? 0;
  }

  _updateRovingTabIndex($activeItem?: dxElementWrapper): void {
    const $allVisible = this._getVisibleItems();
    const $available = this._getAvailableItems($allVisible);
    let hasActive = false;

    $allVisible.each((_index: number, item: Element): boolean => {
      const $item = $(item);
      const $focusTarget = this._getItemFocusTarget($item);

      if (!$focusTarget?.length) {
        return true;
      }

      if (this._isItemDisabled($item)) {
        $focusTarget.attr('tabIndex', -1);
        const $input = $focusTarget.hasClass('dx-texteditor')
          ? $focusTarget.find('.dx-texteditor-input')
          : undefined;
        if ($input?.length) {
          $input.attr('tabIndex', -1);
        }
        return true;
      }

      const isActive = !!$activeItem?.length && $item.get(0) === $activeItem.get(0);
      const activeTabIndex = this._getItemTabIndex($item);
      const tabIndexValue = isActive ? activeTabIndex : -1;
      $focusTarget.attr('tabIndex', tabIndexValue);
      if (isActive) {
        hasActive = true;
      }

      const $input = $focusTarget.hasClass('dx-texteditor')
        ? $focusTarget.find('.dx-texteditor-input')
        : undefined;

      if ($input?.length) {
        $input.attr('tabIndex', -1);

        const hasDropDown = $focusTarget.hasClass('dx-dropdowneditor');
        if (!hasDropDown && !$focusTarget.attr('role')) {
          const label = $input.attr('aria-label')
            ?? $input.attr('placeholder')
            ?? '';
          // @ts-expect-error ts-error
          $focusTarget.attr({
            role: 'textbox',
            'aria-readonly': 'true',
            'aria-label': label,
          });
        }
      }

      const $menu = $item.find('.dx-menu');
      if ($menu.length) {
        $menu.attr('tabIndex', -1);
        $menu.find('[tabindex]').attr('tabIndex', -1);
      }

      return true;
    });

    if (!hasActive) {
      const $first = $available.first();
      if ($first.length) {
        const $firstTarget = this._getItemFocusTarget($first);
        const firstTabIndex = this._getItemTabIndex($first);
        $firstTarget?.attr('tabIndex', firstTabIndex);

        const $firstInput = $firstTarget?.hasClass('dx-texteditor')
          ? $firstTarget.find('.dx-texteditor-input')
          : undefined;
        if ($firstInput?.length) {
          $firstInput.attr('tabIndex', -1);
        }
      }
    }
  }

  _focusInHandler(e: DxEvent): void {
    const $target = $(e.target as Element);
    const $item = $target.closest(this._itemSelector());

    if ($item.length && getItemFocusTarget($item)?.length) {
      this.option('focusedElement', getPublicElement($item));
    }
  }

  _focusItemWidget($item: dxElementWrapper): void {
    const $focusTarget = this._getItemFocusTarget($item);
    if (!$focusTarget?.length) {
      return;
    }

    ($focusTarget.get(0) as HTMLElement).focus();
    setItemWidgetFocusState($item, true);
  }

  _focusOutHandler(e: DxEvent): void {
    const { relatedTarget } = e as DxEvent & { relatedTarget: Element };
    const target = e.target as Element;

    if (relatedTarget && this.$element().get(0)?.contains(relatedTarget)) {
      return;
    }

    if (relatedTarget && $(relatedTarget).closest('.dx-overlay-content').length) {
      return;
    }

    if (target && $(target).closest('.dx-overlay-content').length) {
      return;
    }

    const { focusedElement } = this.option();
    const $focused = $(focusedElement);
    if ($focused.length) {
      setItemWidgetFocusState($focused, false);
    }

    super._focusOutHandler(e);
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  _moveFocus(location: string): boolean | undefined | void {
    const { focusedElement: prevFocusedElement } = this.option();
    const $prev = $(prevFocusedElement);
    if ($prev.length) {
      closeItemWidget($prev);
      setItemWidgetFocusState($prev, false);
    }

    const result = super._moveFocus(location);

    const { focusedElement } = this.option();
    const $focused = $(focusedElement);
    if ($focused.length) {
      this._focusItemWidget($focused);
    }

    return result;
  }

  focusFirstItem(): void {
    const $first = this._getAvailableItems().first();
    if ($first.length) {
      this.option('focusedElement', getPublicElement($first));
      this._focusItemWidget($first);
    }
  }

  focusLastItem(): void {
    const $last = this._getAvailableItems().last();
    if ($last.length) {
      this.option('focusedElement', getPublicElement($last));
      this._focusItemWidget($last);
    }
  }

  _postProcessRenderItems(): void {
    super._postProcessRenderItems();

    const { focusedElement } = this.option();
    this._updateRovingTabIndex($(focusedElement));
  }

  _itemClickHandler(
    e: DxEvent,
    args?: Record<string, unknown>,
    config?: ActionConfig,
  ): void {
    if ($(e.target).closest(`.${TOOLBAR_MENU_ACTION_CLASS}`).length) {
      super._itemClickHandler(e, args, config);
    }
  }

  _clean(): void {
    this._detachCaptureKeyHandler();
    this._getSections().empty();
    super._clean();
  }
}

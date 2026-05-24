import type { ToolbarItemComponent } from '@js/common';
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
import { RovingTabIndexNavigator } from '@ts/ui/toolbar/internal/roving.tabindex.navigator';
import {
  activateMenu,
  closeItemWidget,
  getItemFocusTarget,
  isItemDisabled,
  isItemWidgetOpened,
  isMenuTarget,
  isTextInputTarget,
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
  _onEscapePress?: () => void;

  _onTabPress?: () => void;

  _navigator?: RovingTabIndexNavigator;

  protected _activeStateUnit(): string {
    return `.${TOOLBAR_MENU_ACTION_CLASS}:not(.${TOOLBAR_HIDDEN_BUTTON_GROUP_CLASS})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _toggleFocusClass(_isFocused: boolean, _$element?: dxElementWrapper): void {
    // Intentionally empty: visual focus is managed by the inner widgets themselves
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

    if (!this.option('focusStateEnabled')) {
      return keys;
    }

    delete keys.leftArrow;
    delete keys.rightArrow;
    delete keys.upArrow;
    delete keys.downArrow;
    delete keys.home;
    delete keys.end;

    return keys;
  }

  _enterKeyHandler(e: DxEvent<KeyboardEvent>): void {
    if (!this.option('focusStateEnabled')) {
      super._enterKeyHandler(e);
      return;
    }

    const target = e.target as HTMLElement;
    if (isTextInputTarget(target) || isMenuTarget(target)) {
      return;
    }

    this._handleActivationAtNavLevel(e);
    if (e.defaultPrevented) {
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
    }

    super._enterKeyHandler(e);
  }

  _attachKeyboardEvents(): void {
    this._detachKeyboardEvents();

    if (!this.option('focusStateEnabled')) {
      super._attachKeyboardEvents();
      return;
    }

    this._navigator = new RovingTabIndexNavigator({
      widget: this,
      itemsSelector: this._itemSelector(),
      direction: 'vertical',
      getItemFocusTarget: ($item): dxElementWrapper => this._getItemFocusTarget($item),
      onEscapeKey: (): void => this._onEscapePress?.(),
      onTabKey: (): void => this._onTabPress?.(),
    });
    this._navigator.attach();
  }

  _detachKeyboardEvents(): void {
    this._navigator?.detach();
    this._navigator = undefined;
    super._detachKeyboardEvents();
  }

  _getItemFocusTarget($item: dxElementWrapper): dxElementWrapper {
    return getItemFocusTarget($item) ?? ($item.hasClass(TOOLBAR_MENU_ACTION_CLASS) ? $item : $());
  }

  _getAvailableItems($itemElements?: dxElementWrapper): dxElementWrapper {
    const $visible = this._getVisibleItems($itemElements);
    const widgetDisabled = !!this.option('disabled');
    const elements = Array.from($visible.toArray()).filter(
      (item) => !isItemDisabled($(item), widgetDisabled)
        && !!this._getItemFocusTarget($(item)).length,
    );

    return $(elements) as unknown as dxElementWrapper;
  }

  _setFocusedItem($target: dxElementWrapper): void {
    super._setFocusedItem($target);
    this._updateRovingTabIndex($target);
  }

  _updateRovingTabIndex($activeItem?: dxElementWrapper): void {
    this._navigator?.updateRovingTabIndex($activeItem);
  }

  _resetRovingTabIndex(): void {
    this._navigator?.resetRovingTabIndex(this.$element());
  }

  _focusInHandler(e: DxEvent): void {
    const $target = $(e.target as Element);
    const $item = $target.closest(this._itemSelector());

    if ($item.length && getItemFocusTarget($item)?.length) {
      this.option('focusedElement', getPublicElement($item));
    }
  }

  _focusItemWidget($item: dxElementWrapper): void {
    if (this._navigator) {
      this._navigator.focusItemWidget($item);
      return;
    }
    const $focusTarget = this._getItemFocusTarget($item);
    if (!$focusTarget?.length) {
      return;
    }
    ($focusTarget.get(0) as HTMLElement).focus();
  }

  _handleActivationAtNavLevel(e: KeyboardEvent): void {
    const { focusedElement } = this.option();
    const $focused = $(focusedElement);

    if (!$focused.length || isItemWidgetOpened($focused)) {
      return;
    }

    const $menu = $focused.find('.dx-menu').first();
    if ($menu.length) {
      e.preventDefault();
      e.stopPropagation();
      activateMenu($menu);
    }
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

    super._focusOutHandler(e);
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  _moveFocus(location: string): boolean | undefined | void {
    if (!this.option('focusStateEnabled')) {
      return super._moveFocus(location);
    }

    const { focusedElement: prevFocusedElement } = this.option();
    const $prev = $(prevFocusedElement);
    if ($prev.length) {
      closeItemWidget($prev);
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
    this._resetRovingTabIndex();
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
    this._navigator?.detach();
    this._navigator = undefined;
    this._getSections().empty();
    super._clean();
  }
}

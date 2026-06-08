export const TOOLBAR_CLASS = 'dx-toolbar';
export const TOOLBAR_FOCUS_MODE_CLASS = 'dx-toolbar-focus-mode';
export const DROPDOWNMENU_LIST_FOCUS_MODE_CLASS = 'dx-dropdownmenu-list-focus-mode';

export const DROPDOWNMENU_BUTTON_CLASS = 'dx-dropdownmenu-button';

export const MENU_CLASS = 'dx-menu';
export const MENU_ITEM_CLASS = 'dx-menu-item';
export const MENU_ITEM_EXPANDED_CLASS = 'dx-menu-item-expanded';

export const TOOLBAR_ITEMS = ['dxAutocomplete', 'dxButton', 'dxCheckBox', 'dxDateBox', 'dxDateRangeBox', 'dxMenu', 'dxSelectBox', 'dxSwitch', 'dxTabs', 'dxTextBox', 'dxButtonGroup', 'dxDropDownButton'] as const;
export const TOOLBAR_WIDGETS_SELECTOR = TOOLBAR_ITEMS.map((w) => w.toLowerCase().replace('dx', '.dx-')).join(',');
export const NATIVE_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

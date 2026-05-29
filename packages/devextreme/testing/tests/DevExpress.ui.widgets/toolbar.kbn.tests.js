import $ from 'jquery';
import fx from 'common/core/animation/fx';
import { TOOLBAR_ITEM_CLASS } from '__internal/ui/toolbar/toolbar.base';
import {
    DROP_DOWN_MENU_BUTTON_CLASS,
    DROP_DOWN_MENU_POPUP_WRAPPER_CLASS,
} from '__internal/ui/toolbar/internal/toolbar.menu';
import { TOOLBAR_FOCUS_MODE_CLASS, DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS } from '__internal/ui/toolbar/constants';
import { BUTTON_CLASS } from '__internal/ui/button/button';
import { LIST_ITEM_CLASS } from '__internal/ui/list/list.base';
import {
    DISABLED_STATE_CLASS,
} from '__internal/core/widget/widget';

import 'ui/toolbar';
import 'ui/button';
import 'ui/select_box';
import 'ui/drop_down_button';
import 'ui/button_group';
import 'ui/text_box';
import 'ui/number_box';
import 'ui/date_box';
import 'ui/date_range_box';
import 'ui/color_box';
import 'ui/tag_box';
import 'ui/autocomplete';
import 'ui/switch';
import 'ui/check_box';
import 'ui/menu';
import 'ui/tabs';

import 'fluent_blue_light.css!';

QUnit.testStart(function() {
    const markup = `
        <style nonce="qunit-test">
            #toolbarWithMenu .dx-toolbar-menu-container {
                width: 100px;
            }
            .dx-list-item {
                line-height: 1;
            }
        </style>

        <div id="toolbar"></div>
        <div id="toolbarWithMenu"></div>
        <div id="widget"></div>
        <div id="widthRootStyle"></div>
    `;

    $('#qunit-fixture').html(markup);
    $('#widthRootStyle').css('width', '300px');
});


const TOOLBAR_SELECTOR = '#toolbar';

const buttonItem = (text, extra = {}) => ({
    widget: 'dxButton',
    locateInMenu: 'never',
    ...extra,
    options: { text, ...(extra.options || {}) },
});

const editorItem = (widget, options = {}, extra = {}) => ({
    widget,
    locateInMenu: 'never',
    ...extra,
    options,
});

const labelItem = (text) => ({ text, locateInMenu: 'never' });

const overflowButtonItem = (text, extra = {}) => ({
    widget: 'dxButton',
    locateInMenu: 'always',
    ...extra,
    options: { text, ...(extra.options || {}) },
});

const createToolbar = (items, options = {}, selector = TOOLBAR_SELECTOR) =>
    $(selector).dxToolbar({ items, ...options }).dxToolbar('instance');

const press = (key, target, modifiers = {}) => {
    const el = target instanceof Element
        ? target
        : (target && target.get ? target.get(0) : $(TOOLBAR_SELECTOR).get(0));
    el.dispatchEvent(new KeyboardEvent('keydown', {
        key, bubbles: true, cancelable: true, ...modifiers,
    }));
};

const focusItemAt = (toolbar, index) => {
    const $items = toolbar._getAvailableItems();
    const $item = $items.eq(index);
    toolbar.option('focusedElement', $item.get(0));
    toolbar._focusItemWidget($item);
    return $item;
};

const findFocusTarget = ($item) => {
    const $dropDownButton = $item.find('.dx-dropdownbutton').first();
    if($dropDownButton.length) {
        return $item.find('.dx-buttongroup').first();
    }
    const $button = $item.find('.dx-button').first();
    if($button.length) return $button;
    const $textEditor = $item.find('.dx-texteditor').first();
    if($textEditor.length) return $textEditor;
    const $buttonGroup = $item.find('.dx-buttongroup').first();
    if($buttonGroup.length) return $buttonGroup;
    const $menu = $item.find('.dx-menu').first();
    if($menu.length) return $menu;
    const $native = $item.find('button:not([disabled]), input:not([disabled]), a[href], [tabindex]').first();
    if($native.length) return $native;
    const $tabEl = $item.find('[tabindex]').first();
    if($tabEl.length) return $tabEl;
    return $item;
};

const findInput = ($item) => $item.find('.dx-texteditor-input').first();
const getActiveItem = (toolbar) => $(toolbar.option('focusedElement'));

const assertFocusedItemAt = (assert, toolbar, expectedIndex, message) => {
    const $items = toolbar._getAvailableItems();
    assert.strictEqual(
        getActiveItem(toolbar).get(0),
        $items.eq(expectedIndex).get(0),
        message || `focusedElement is item #${expectedIndex}`,
    );
};

const assertOneTabStop = (assert, $toolbar, message) => {
    const $stops = $toolbar.find('[tabindex="0"]').not('.dx-texteditor-input');
    assert.strictEqual($stops.length, 1, message || 'exactly one tab stop in toolbar');
};

const assertActiveTabIndex = (assert, $item, expected, message) => {
    const actual = parseInt(findFocusTarget($item).attr('tabindex'), 10);
    assert.strictEqual(actual, expected, message || `active item tabindex=${expected}`);
};

const EDITOR_FIXTURES = {
    textInput: [
        { widget: 'dxTextBox', options: { value: 'hello', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxNumberBox', options: { value: 42, inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxAutocomplete', options: { items: ['Item 1', 'Item 2'], inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxSelectBox', options: { items: ['A', 'B', 'C'], value: 'A', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxDateBox', options: { type: 'date', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxDateRangeBox', options: { startDateInputAttr: { 'aria-label': 'Start' }, endDateInputAttr: { 'aria-label': 'End' } } },
        { widget: 'dxColorBox', options: { value: '#ff0000', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxTagBox', options: { items: ['x', 'y', 'z'], inputAttr: { 'aria-label': 'Test' } } },
    ],
    popup: [
        { widget: 'dxSelectBox', options: { items: ['A', 'B', 'C'], inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxDateBox', options: { type: 'date', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxColorBox', options: { value: '#0080ff', inputAttr: { 'aria-label': 'Test' } } },
        { widget: 'dxDateRangeBox', options: { startDateInputAttr: { 'aria-label': 'Start' }, endDateInputAttr: { 'aria-label': 'End' } } },
        { widget: 'dxTagBox', options: { items: ['x', 'y', 'z'], inputAttr: { 'aria-label': 'Test' } } },
    ],
    toggle: [
        { widget: 'dxSwitch', options: { value: false } },
        { widget: 'dxCheckBox', options: { value: false } },
    ],
    collection: [
        { widget: 'dxButtonGroup', options: { items: [{ text: 'A' }, { text: 'B' }, { text: 'C' }] } },
    ],
};

const moduleConfig = {
    beforeEach: function() {
        fx.off = true;
        this.clock = sinon.useFakeTimers();
        this.$element = $(TOOLBAR_SELECTOR);
    },
    afterEach: function() {
        fx.off = false;
        this.clock.restore();
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
};


QUnit.module('Enter/Exit: text input editors', moduleConfig, function() {
    const setupSandwich = (widget, options) =>
        createToolbar([buttonItem('Prev'), editorItem(widget, options), buttonItem('Next')]);

    EDITOR_FIXTURES.textInput.forEach(({ widget, options }) => {
        QUnit.test(`${widget}: Enter focuses input`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);

            const $input = findInput(toolbar._getAvailableItems().eq(1));
            assert.strictEqual(document.activeElement, $input.get(0),
                `Enter focuses ${widget} input`);
        });

        QUnit.test(`${widget}: arrows blocked while input focused`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);

            const $input = findInput(toolbar._getAvailableItems().eq(1));
            press('ArrowLeft', $input.get(0));
            press('ArrowRight', $input.get(0));

            assertFocusedItemAt(assert, toolbar, 1,
                `arrows do not navigate toolbar while ${widget} input is focused`);
        });

        QUnit.test(`${widget}: Esc keeps focusedElement on the editor item`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            const $input = findInput(toolbar._getAvailableItems().eq(1));
            press('Escape', $input.get(0));
            this.clock.tick(50);

            assertFocusedItemAt(assert, toolbar, 1,
                `Esc keeps focusedElement on ${widget} item`);
        });

        QUnit.test(`${widget}: arrows navigate toolbar after Esc exits the editor`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            const $input = findInput(toolbar._getAvailableItems().eq(1));
            press('Escape', $input.get(0));
            this.clock.tick(50);
            press('ArrowRight');

            assertFocusedItemAt(assert, toolbar, 2,
                `ArrowRight navigates after Esc from ${widget}`);
        });

        QUnit.test(`${widget}: enter→exit→arrow cycle preserves single tab stop`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            const $input = findInput(toolbar._getAvailableItems().eq(1));
            press('Escape', $input.get(0));
            this.clock.tick(50);
            press('ArrowRight');

            assertOneTabStop(assert, this.$element,
                `single tab stop preserved through ${widget} enter/exit/navigate cycle`);
        });

        QUnit.test(`${widget}: editor stays unfocused during plain toolbar navigation`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            const $editor = toolbar._getAvailableItems().eq(1).find('.dx-texteditor').first();
            assert.notOk($editor.hasClass('dx-state-focused'),
                `${widget} root has no dx-state-focused before Enter`);
        });

        QUnit.test(`${widget}: editor gets dx-state-focused after Enter`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);

            const $editor = toolbar._getAvailableItems().eq(1).find('.dx-texteditor').first();
            assert.ok($editor.hasClass('dx-state-focused'),
                `${widget} root has dx-state-focused after Enter`);
        });
    });
});

QUnit.module('Enter/Exit: dropdown/popup editors (matrix)', moduleConfig, function() {
    const POPUP_WIDGETS = [
        {
            widget: 'dxDropDownButton',
            options: { items: ['Option 1', 'Option 2'], text: 'Actions' },
            getInstance($item) {
                return $item.find('.dx-dropdownbutton').dxDropDownButton('instance');
            },
            getFocusTarget($item) {
                return $item.find('.dx-buttongroup');
            },
            prepareFocus($item) {
                const bgInstance = $item.find('.dx-buttongroup').dxButtonGroup('instance');
                const $firstItem = bgInstance._buttonsCollection._itemElements().eq(0);
                bgInstance._buttonsCollection.option('focusedElement', $firstItem.get(0));
            },
        },
    ];

    const setupSandwich = (widget, options) =>
        createToolbar([buttonItem('Prev'), editorItem(widget, options), buttonItem('Next')]);

    POPUP_WIDGETS.forEach(({ widget, options, getInstance, getFocusTarget, prepareFocus }) => {
        const focusInner = (toolbar) => {
            const $item = focusItemAt(toolbar, 1);
            prepareFocus($item);
            return $item;
        };

        ['Enter', ' ', 'ArrowDown'].forEach((key) => {
            const label = key === ' ' ? 'Space' : key;
            QUnit.test(`${widget}: ${label} opens popup`, function(assert) {
                const toolbar = setupSandwich(widget, options);
                const $item = key === 'ArrowDown' ? focusItemAt(toolbar, 1) : focusInner(toolbar);

                press(key, getFocusTarget($item).get(0));
                this.clock.tick(300);

                assert.strictEqual(getInstance($item).option('opened'), true,
                    `${label} opens ${widget} popup`);
            });
        });

        QUnit.test(`${widget}: arrows blocked while popup is open`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            const $item = focusInner(toolbar);

            press('Enter', getFocusTarget($item).get(0));
            this.clock.tick(300);

            press('ArrowRight');
            press('ArrowLeft');

            assertFocusedItemAt(assert, toolbar, 1,
                `arrows do not navigate toolbar while ${widget} popup is open`);
        });

        QUnit.test(`${widget}: Esc closes popup and keeps toolbar focus`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            const $item = focusItemAt(toolbar, 1);
            const instance = getInstance($item);
            instance.option('opened', true);
            this.clock.tick(300);

            press('Escape', getFocusTarget($item).get(0));
            this.clock.tick(300);

            assert.strictEqual(instance.option('opened'), false,
                `Esc closes ${widget} popup`);
            assertFocusedItemAt(assert, toolbar, 1,
                `toolbar focus stays on ${widget} item after Esc`);
        });
    });
});

QUnit.module('Enter/Exit: toggle widgets', moduleConfig, function() {
    const TOGGLES = [
        {
            widget: 'dxSwitch',
            options: { value: false, width: 70 },
            containerSelector: '.dx-switch',
            toggledByEnter: true,
        },
        {
            widget: 'dxCheckBox',
            options: { text: 'Check', value: false },
            containerSelector: '.dx-checkbox',
            toggledByEnter: false,
        },
    ];

    const setupSandwich = (widget, options) =>
        createToolbar([buttonItem('Prev'), editorItem(widget, options), buttonItem('Next')]);

    TOGGLES.forEach(({ widget, options, containerSelector, toggledByEnter }) => {
        const buildAndFocusInner = (toolbar) => {
            const $widgetEl = toolbar.$element().find(containerSelector);
            const widgetInstance = $widgetEl[widget]('instance');
            $widgetEl.get(0).focus();
            return { $widgetEl, widgetInstance };
        };

        const enterLabel = toggledByEnter ? 'toggles' : 'does not toggle';
        QUnit.test(`${widget}: Enter ${enterLabel} value`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            const { $widgetEl, widgetInstance } = buildAndFocusInner(toolbar);
            const valueBefore = widgetInstance.option('value');

            press('Enter', $widgetEl.get(0));
            this.clock.tick(50);

            const valueAfter = widgetInstance.option('value');
            if(toggledByEnter) {
                assert.notStrictEqual(valueAfter, valueBefore, `Enter toggles ${widget} value`);
            } else {
                assert.strictEqual(valueAfter, valueBefore, `Enter does not toggle ${widget} value`);
            }
        });

        QUnit.test(`${widget}: Space toggles value`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            const { $widgetEl, widgetInstance } = buildAndFocusInner(toolbar);
            const valueBefore = widgetInstance.option('value');

            press(' ', $widgetEl.get(0));
            this.clock.tick(50);

            assert.notStrictEqual(widgetInstance.option('value'), valueBefore,
                `Space toggles ${widget} value`);
        });

        QUnit.test(`${widget}: ArrowRight navigates toolbar (no inner edit mode)`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('ArrowRight');

            assertFocusedItemAt(assert, toolbar, 2,
                `ArrowRight navigates from ${widget} (no inner edit mode)`);
        });

        QUnit.test(`${widget}: ArrowLeft navigates toolbar`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('ArrowLeft');

            assertFocusedItemAt(assert, toolbar, 0,
                `ArrowLeft navigates from ${widget} (no inner edit mode)`);
        });
    });
});

QUnit.module('Enter/Exit: collection widgets', moduleConfig, function() {
    const COLLECTIONS = [
        {
            widget: 'dxMenu',
            options: {
                items: [
                    { text: 'File', items: [{ text: 'New' }, { text: 'Open' }] },
                    { text: 'Edit', items: [{ text: 'Cut' }, { text: 'Copy' }] },
                ],
            },
            innerFocusableSelector: '.dx-menu-item',
        },
    ];

    const setupSandwich = (widget, options) =>
        createToolbar([buttonItem('Prev'), editorItem(widget, options), buttonItem('Next')]);

    COLLECTIONS.forEach(({ widget, options, innerFocusableSelector }) => {
        QUnit.test(`${widget}: Enter activates inner navigation`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);

            const $item = toolbar._getAvailableItems().eq(1);
            assert.ok($item.get(0).contains(document.activeElement),
                `Enter places DOM focus inside ${widget}`);
            assert.ok($item.find(innerFocusableSelector).length > 0,
                `${widget} has inner focusable elements`);
        });

        QUnit.test(`${widget}: arrows do not navigate toolbar while inner mode is active`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);

            const activeEl = document.activeElement;
            press('ArrowRight', activeEl);
            press('ArrowLeft', activeEl);

            assertFocusedItemAt(assert, toolbar, 1,
                `arrows do not navigate toolbar while inside ${widget}`);
        });

        QUnit.test(`${widget}: Esc returns focus to the toolbar item`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            press('Escape', document.activeElement);
            this.clock.tick(50);

            const $item = toolbar._getAvailableItems().eq(1);
            assert.ok($item.get(0).contains(document.activeElement),
                `Esc keeps DOM focus inside the ${widget} toolbar item`);
        });

        QUnit.test(`${widget}: arrows navigate toolbar after Esc`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            press('Escape', document.activeElement);
            this.clock.tick(50);
            press('ArrowRight');

            assertFocusedItemAt(assert, toolbar, 2,
                `ArrowRight navigates toolbar after Esc from ${widget}`);
        });

        QUnit.test(`${widget}: enter/exit cycle preserves single tab stop`, function(assert) {
            const toolbar = setupSandwich(widget, options);
            focusItemAt(toolbar, 1);

            press('Enter');
            this.clock.tick(50);
            press('Escape', document.activeElement);
            this.clock.tick(50);
            press('ArrowRight');

            const $tabZero = this.$element.find('[tabindex="0"]');
            assert.strictEqual($tabZero.length, 1,
                `single tab stop preserved through ${widget} enter/exit/navigate cycle`);
        });
    });
});

QUnit.module('Enter/Exit: dxTabs in toolbar', moduleConfig, function() {
    const tabsItem = editorItem('dxTabs', {
        items: [{ text: 'Home' }, { text: 'Insert' }, { text: 'Layout' }],
        selectedIndex: 0,
        width: 'auto',
    });
    const setupTabsToolbar = () => createToolbar([buttonItem('Prev'), tabsItem, buttonItem('Next')]);

    const focusTabsContainer = (toolbar, clock) => {
        focusItemAt(toolbar, 1);
        const $tabs = toolbar._getAvailableItems().eq(1).find('.dx-tabs');
        $tabs.get(0).focus();
        clock.tick(50);
        return $tabs.dxTabs('instance');
    };

    QUnit.test('ArrowRight on tabs moves toolbar focus to next item', function(assert) {
        const toolbar = setupTabsToolbar();
        focusItemAt(toolbar, 1);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 2,
            'ArrowRight navigates toolbar away from dxTabs');
    });

    QUnit.test('ArrowLeft on tabs moves toolbar focus to previous item', function(assert) {
        const toolbar = setupTabsToolbar();
        focusItemAt(toolbar, 1);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 0,
            'ArrowLeft navigates toolbar away from dxTabs');
    });

    QUnit.test('ArrowDown on focused tabs switches tabs and does not move toolbar focus', function(assert) {
        const toolbar = setupTabsToolbar();
        const tabs = focusTabsContainer(toolbar, this.clock);
        const selectedBefore = tabs.option('selectedIndex');

        press('ArrowDown', document.activeElement);
        this.clock.tick(50);

        assertFocusedItemAt(assert, toolbar, 1, 'ArrowDown keeps toolbar focus on tabs item');
        assert.strictEqual(tabs.option('selectedIndex'), selectedBefore + 1,
            'ArrowDown selects the next tab');
    });

    QUnit.test('ArrowUp on focused tabs switches tabs and does not move toolbar focus', function(assert) {
        const toolbar = setupTabsToolbar();
        const tabs = focusTabsContainer(toolbar, this.clock);
        tabs.option('selectedIndex', 1);
        const selectedBefore = tabs.option('selectedIndex');

        press('ArrowUp', document.activeElement);
        this.clock.tick(50);

        assertFocusedItemAt(assert, toolbar, 1, 'ArrowUp keeps toolbar focus on tabs item');
        assert.strictEqual(tabs.option('selectedIndex'), selectedBefore - 1,
            'ArrowUp selects the previous tab');
    });
});

const dispatchKeydown = (element, key, options = {}) => press(key, element, options);
const getItemFocusTarget = findFocusTarget;

QUnit.module('Core Navigation', moduleConfig, function() {
    const makeButtonItems = (count) =>
        Array.from({ length: count }, (_, i) => buttonItem(String.fromCharCode(65 + i)));

    QUnit.test('first available item is the roving tabindex anchor on init', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        const $available = toolbar._getAvailableItems();

        const $tabZeroElements = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabZeroElements.length, 1, 'exactly one element with tabindex=0');
        assert.strictEqual(
            $tabZeroElements.closest(`.${TOOLBAR_ITEM_CLASS}`).get(0),
            $available.eq(0).get(0),
            'the anchor belongs to the first available item',
        );
    });

    QUnit.test('ArrowRight moves focus to the next item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        focusItemAt(toolbar, 0);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 1, 'focus moved to item[1]');
        assertOneTabStop(assert, this.$element);
    });

    QUnit.test('ArrowRight on last item wraps focus to first item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        focusItemAt(toolbar, 2);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 0, 'focus wrapped to first item');
    });

    QUnit.test('ArrowLeft on first item wraps focus to last item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        focusItemAt(toolbar, 0);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 2, 'focus wrapped to last item');
    });

    QUnit.test('Home moves focus to the first item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        focusItemAt(toolbar, 2);

        press('Home');

        assertFocusedItemAt(assert, toolbar, 0, 'focus moved to first item');
    });

    QUnit.test('End moves focus to the last item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        focusItemAt(toolbar, 0);

        press('End');

        assertFocusedItemAt(assert, toolbar, 2, 'focus moved to last item');
    });

    const disabledScenarios = [
        {
            name: 'options.disabled',
            items: [
                buttonItem('A'),
                buttonItem('B', { options: { disabled: true } }),
                buttonItem('C'),
            ],
        },
        {
            name: 'item.disabled (item-level flag)',
            items: [
                buttonItem('A'),
                buttonItem('B', { disabled: true }),
                buttonItem('C'),
            ],
        },
    ];

    disabledScenarios.forEach(({ name, items }) => {
        QUnit.test(`ArrowRight skips disabled item (${name})`, function(assert) {
            const toolbar = createToolbar(items);
            const $items = toolbar._getAvailableItems();
            assert.strictEqual($items.length, 2, 'only 2 available items (disabled filtered out)');

            focusItemAt(toolbar, 0);
            press('ArrowRight');

            assertFocusedItemAt(assert, toolbar, 1,
                `ArrowRight skips disabled (${name}) and lands on next enabled item`);
        });
    });

    QUnit.test('ArrowLeft skips a disabled item between two enabled items', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B', { options: { disabled: true } }),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 1);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 0,
            'ArrowLeft skips disabled item and lands on A');
    });

    QUnit.test('Home skips leading disabled items', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A', { disabled: true }),
            buttonItem('B'),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 1);

        press('Home');

        assertFocusedItemAt(assert, toolbar, 0,
            'Home lands on first enabled item, skipping disabled leader');
    });

    QUnit.test('End skips trailing disabled items', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B'),
            buttonItem('C', { disabled: true }),
        ]);
        focusItemAt(toolbar, 0);

        press('End');

        assertFocusedItemAt(assert, toolbar, 1,
            'End lands on last enabled item, skipping disabled trailer');
    });

    QUnit.test('multiple consecutive disabled items are all skipped', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B', { disabled: true }),
            buttonItem('C', { options: { disabled: true } }),
            buttonItem('D'),
        ]);
        assert.strictEqual(toolbar._getAvailableItems().length, 2, 'only 2 available items');

        focusItemAt(toolbar, 0);
        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 1,
            'ArrowRight skips two consecutive disabled items and lands on D');
    });

    QUnit.test('disabled item never has tabindex=0', function(assert) {
        createToolbar([
            buttonItem('A'),
            buttonItem('B', { options: { disabled: true } }),
            buttonItem('C'),
        ]);

        const $disabledButton = this.$element.find('.dx-button.dx-state-disabled');
        assert.strictEqual($disabledButton.attr('tabindex'), '-1',
            'disabled button has tabindex=-1');
    });

    QUnit.test('toolbar.disabled=true sets all items to tabindex=-1', function(assert) {
        createToolbar([buttonItem('A'), buttonItem('B')], { disabled: true });

        const $buttons = this.$element.find('.dx-button');
        $buttons.each(function() {
            assert.strictEqual($(this).attr('tabindex'), '-1',
                'button has tabindex=-1 when toolbar is disabled');
        });
    });

    QUnit.test('exactly one tabindex=0 is maintained after a sequence of navigation keys', function(assert) {
        const toolbar = createToolbar(makeButtonItems(4));
        focusItemAt(toolbar, 0);

        ['ArrowRight', 'ArrowRight', 'End', 'Home'].forEach((key) => {
            press(key);
            assertOneTabStop(assert, this.$element, `one tab stop after ${key}`);
        });
    });

    QUnit.test('ArrowRight transfers tabindex=0 from previous to newly focused item', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        const $items = toolbar._getAvailableItems();
        focusItemAt(toolbar, 0);

        press('ArrowRight');

        assertActiveTabIndex(assert, $items.eq(1), 0, 'item[1] is now the stop');
        assertActiveTabIndex(assert, $items.eq(0), -1, 'item[0] released the stop');
        assertActiveTabIndex(assert, $items.eq(2), -1, 'item[2] remained at -1');
    });

    QUnit.test('focusing an item via pointer makes it the roving tabindex anchor', function(assert) {
        const toolbar = createToolbar(makeButtonItems(3));
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        assertOneTabStop(assert, this.$element);
        const $tabZero = this.$element.find('[tabindex="0"]');
        assert.strictEqual(
            $tabZero.closest(`.${TOOLBAR_ITEM_CLASS}`).get(0),
            $items.eq(1).get(0),
            'item[1] is now the anchor',
        );
        assertFocusedItemAt(assert, toolbar, 1,
            'focusedElement updated to item[1] after pointer focus');
    });
});

QUnit.module('Widget interaction', moduleConfig, function() {
    const triggerKey = (element, key) => press(key, element);

    QUnit.test('Enter on dxButton fires click', function(assert) {
        let clicked = false;
        this.$element.dxToolbar({
            items: [{ widget: 'dxButton', options: { text: 'A', onClick: () => { clicked = true; } } }]
        });

        triggerKey(this.$element.find('.dx-button').get(0), 'Enter');
        this.clock.tick(10);

        assert.strictEqual(clicked, true, 'Enter fires click on dxButton');
    });

    QUnit.test('Space on dxButton fires click', function(assert) {
        let clicked = false;
        this.$element.dxToolbar({
            items: [{ widget: 'dxButton', options: { text: 'A', onClick: () => { clicked = true; } } }]
        });

        triggerKey(this.$element.find('.dx-button').get(0), ' ');
        this.clock.tick(10);

        assert.strictEqual(clicked, true, 'Space fires click on dxButton');
    });

    function createButtonGroupToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxButtonGroup', options: { items: [{ text: 'B' }, { text: 'I' }], keyExpr: 'text' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ]
        }).dxToolbar('instance');
    }

    QUnit.test('ArrowDown/Up on dxButtonGroup pass through: toolbar focus stays on ButtonGroup', function(assert) {
        const toolbar = createButtonGroupToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $buttonGroupItem = $items.eq(1);

        toolbar.option('focusedElement', $buttonGroupItem.get(0));
        const $buttonGroupFocusTarget = $buttonGroupItem.find('.dx-buttongroup');

        triggerKey($buttonGroupFocusTarget.get(0), 'ArrowDown');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $buttonGroupItem.get(0), 'ArrowDown keeps toolbar focus on ButtonGroup');

        triggerKey($buttonGroupFocusTarget.get(0), 'ArrowUp');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $buttonGroupItem.get(0), 'ArrowUp keeps toolbar focus on ButtonGroup');
    });

    QUnit.test('ArrowLeft on dxButtonGroup moves toolbar focus to previous item', function(assert) {
        const toolbar = createButtonGroupToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'ArrowLeft moves toolbar focus to previous item');
    });

    QUnit.test('ArrowRight on dxButtonGroup moves toolbar focus to next item', function(assert) {
        const toolbar = createButtonGroupToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0), 'ArrowRight moves toolbar focus to next item');
    });

    function createDropDownButtonToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxDropDownButton', options: { items: ['Option 1', 'Option 2'], text: 'Actions' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ]
        }).dxToolbar('instance');
    }

    function getDropDownButton($el) {
        return $el.find('.dx-dropdownbutton').dxDropDownButton('instance');
    }

    function setButtonGroupFocusedItem($dropDownButtonItem) {
        const bgInstance = $dropDownButtonItem.find('.dx-buttongroup').dxButtonGroup('instance');
        const $firstItem = bgInstance._buttonsCollection._itemElements().eq(0);
        bgInstance._buttonsCollection.option('focusedElement', $firstItem.get(0));
    }

    QUnit.test('Enter on dxDropDownButton opens popup', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $dropDownButtonItem = toolbar._getAvailableItems().eq(1);
        const dropDownButton = getDropDownButton(this.$element);

        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Enter');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opens on Enter');
    });

    QUnit.test('Space on dxDropDownButton opens popup', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $dropDownButtonItem = toolbar._getAvailableItems().eq(1);
        const dropDownButton = getDropDownButton(this.$element);

        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), ' ');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opens on Space');
    });

    QUnit.test('ArrowDown on dxDropDownButton opens popup', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $dropDownButtonItem = toolbar._getAvailableItems().eq(1);
        const dropDownButton = getDropDownButton(this.$element);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'ArrowDown');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opens on ArrowDown');
    });

    QUnit.test('Esc on dxDropDownButton (open) closes popup and keeps toolbar focus', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $dropDownButtonItem = toolbar._getAvailableItems().eq(1);
        const dropDownButton = getDropDownButton(this.$element);

        dropDownButton.option('opened', true);
        this.clock.tick(300);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Escape');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), false, 'popup closes on Esc');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $dropDownButtonItem.get(0), 'toolbar focus stays on DropDownButton item');
    });

    QUnit.test('ArrowLeft/Right on dxDropDownButton (popup closed) navigates toolbar', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0), 'ArrowRight moves to next toolbar item');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'ArrowLeft moves to previous toolbar item');
    });

    QUnit.test('ArrowLeft/Right on dxDropDownButton (popup open) does NOT navigate toolbar', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $dropDownButtonItem = $items.eq(1);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Enter');
        this.clock.tick(300);

        const dropDownButton = getDropDownButton(this.$element);
        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opened via Enter');

        triggerKey(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $dropDownButtonItem.get(0),
            'ArrowRight does not move focus when popup is open');

        triggerKey(this.$element.get(0), 'ArrowLeft');
        this.clock.tick(0);
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $dropDownButtonItem.get(0),
            'ArrowLeft does not move focus when popup is open');
    });

    QUnit.test('selecting item in dxDropDownButton popup via keyboard preserves toolbar focusedElement', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $dropDownButtonItem = $items.eq(1);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Enter');
        this.clock.tick(300);

        const dropDownButton = getDropDownButton(this.$element);
        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opened');

        const $listItem = $(dropDownButton._list.$element().find('.dx-list-item').first());
        $listItem.trigger('dxclick');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), false, 'popup closed after item click');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $dropDownButtonItem.get(0),
            'toolbar focusedElement stays on DropDownButton item after selection');
    });

    QUnit.test('focus moves to popup content on open — toolbar does not lose focusedElement', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $dropDownButtonItem = $items.eq(1);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Enter');
        this.clock.tick(300);

        const dropDownButton = getDropDownButton(this.$element);
        assert.strictEqual(dropDownButton.option('opened'), true, 'popup opened');

        const $listItem = $(dropDownButton._list.$element().find('.dx-list-item').first());
        $listItem.get(0).focus();
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $dropDownButtonItem.get(0),
            'focusedElement preserved when focus is inside popup overlay');
    });

    QUnit.test('tabindex stays on DropDownButton after selecting item via keyboard', function(assert) {
        const toolbar = createDropDownButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $dropDownButtonItem = $items.eq(1);

        toolbar.option('focusedElement', $dropDownButtonItem.get(0));
        setButtonGroupFocusedItem($dropDownButtonItem);
        triggerKey($dropDownButtonItem.find('.dx-buttongroup').get(0), 'Enter');
        this.clock.tick(300);

        const dropDownButton = getDropDownButton(this.$element);
        const $listItem = $(dropDownButton._list.$element().find('.dx-list-item').first());
        $listItem.trigger('dxclick');
        this.clock.tick(300);

        assert.strictEqual(getItemFocusTarget($dropDownButtonItem).attr('tabindex'), '0',
            'DropDownButton focus target retains tabindex=0 after selection');

        $items.not($dropDownButtonItem).each(function() {
            assert.strictEqual(getItemFocusTarget($(this)).attr('tabindex'), '-1',
                'other toolbar items have tabindex=-1');
        });
    });

    function createSelectBoxToolbar($element) {
        return $element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxSelectBox', options: { items: ['A', 'B', 'C'], value: 'A' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');
    }

    QUnit.test('Enter on dxSelectBox (toolbar mode) focuses the input', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));

        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        const $input = $items.eq(1).find('.dx-texteditor-input');
        assert.strictEqual(document.activeElement, $input.get(0), 'Enter focuses SelectBox input');
    });

    QUnit.test('ArrowDown on dxSelectBox (toolbar mode) does not open list', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));

        const selectBox = $items.eq(1).find('.dx-selectbox').dxSelectBox('instance');
        triggerKey(this.$element.get(0), 'ArrowDown');
        this.clock.tick(100);

        assert.strictEqual(selectBox.option('opened'), false, 'ArrowDown in toolbar mode does not open SelectBox list');
    });

    QUnit.test('Esc on dxSelectBox (list open) closes list; ←/→ stay in input mode', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const selectBox = $items.eq(1).find('.dx-selectbox').dxSelectBox('instance');
        const $input = $items.eq(1).find('.dx-texteditor-input');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        selectBox.option('opened', true);
        this.clock.tick(300);
        $input.get(0).focus();

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(100);

        assert.strictEqual(selectBox.option('opened'), false, 'Esc closes SelectBox list');
        triggerKey($input.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowLeft does not navigate toolbar while input is focused');
    });

    QUnit.test('Esc on dxSelectBox (list closed, input focused) returns focus to root div', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');
        const $rootDiv = $items.eq(1).find('.dx-selectbox');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        $input.get(0).focus();
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $rootDiv.get(0), 'Esc returns focus to SelectBox root div');
    });

    QUnit.test('arrows on dxSelectBox (toolbar mode) navigates toolbar', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'ArrowLeft moves to previous item');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0), 'ArrowRight moves to next item');
    });

    function createTextBoxToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxTextBox', options: { value: 'hello' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');
    }

    QUnit.test('arrows on dxTextBox (toolbar mode) navigates toolbar', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'ArrowLeft navigates to previous item');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0), 'ArrowRight navigates to next item');
    });

    QUnit.test('Enter on dxTextBox focuses input; arrows do not navigate toolbar', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $input.get(0), 'Enter focuses TextBox input');

        triggerKey($input.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowLeft does not navigate toolbar while in input mode');
    });

    QUnit.test('Esc on dxTextBox (input focused) returns to toolbar mode; arrows navigate', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft navigates toolbar after Esc from TextBox');
    });

    QUnit.test('Esc from TextBox then ArrowRight: TextBox input has tabindex=-1', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');
        const $textEditor = $items.eq(1).find('.dx-textbox');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        triggerKey(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($input.attr('tabindex'), '-1',
            'TextBox input has tabindex=-1 after navigating away');
        assert.strictEqual($textEditor.attr('tabindex'), '-1',
            'TextBox container has tabindex=-1 after navigating away');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).attr('tabindex'), '0',
            'target button has tabindex=0');
    });

    QUnit.test('Esc from TextBox then ArrowLeft: TextBox input has tabindex=-1', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        triggerKey(this.$element.get(0), 'ArrowLeft');
        this.clock.tick(0);

        assert.strictEqual($input.attr('tabindex'), '-1',
            'TextBox input has tabindex=-1 after ArrowLeft away');
        assert.strictEqual(getItemFocusTarget($items.eq(0)).attr('tabindex'), '0',
            'Prev button has tabindex=0');
    });

    QUnit.test('Esc from SelectBox then ArrowRight: SelectBox input has tabindex=-1', function(assert) {
        const toolbar = createSelectBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');
        const $selectBox = $items.eq(1).find('.dx-selectbox');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        $input.get(0).focus();
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        triggerKey(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($input.attr('tabindex'), '-1',
            'SelectBox input has tabindex=-1 after navigating away');
        assert.strictEqual($selectBox.attr('tabindex'), '-1',
            'SelectBox container has tabindex=-1 after navigating away');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).attr('tabindex'), '0',
            'Next button has tabindex=0');
    });

    QUnit.test('TextBox stays active after Esc: only TextBox has tabindex=0', function(assert) {
        const toolbar = createTextBoxToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');
        const $textEditor = $items.eq(1).find('.dx-textbox');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        assert.strictEqual($textEditor.attr('tabindex'), '0',
            'TextBox container has tabindex=0 while it is the active item');
        assert.strictEqual($input.attr('tabindex'), '-1',
            'TextBox input has tabindex=-1 while TextBox is the active item');
        assert.strictEqual(getItemFocusTarget($items.eq(0)).attr('tabindex'), '-1',
            'Prev button has tabindex=-1');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).attr('tabindex'), '-1',
            'Next button has tabindex=-1');
    });
});

QUnit.module('Mouse and keyboard sync', moduleConfig, function() {
    const threeButtons = () => [buttonItem('A'), buttonItem('B'), buttonItem('C')];

    const focusInner = ($el) => $el.get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

    QUnit.test('focusin on item[j] sets it as the roving anchor (others release the stop)', function(assert) {
        const toolbar = createToolbar(threeButtons());
        const $items = toolbar._getAvailableItems();

        focusInner($items.eq(1).find('.dx-button'));

        assert.strictEqual($items.eq(1).find('.dx-button').attr('tabindex'), '0',
            'focused item has tabindex=0');
        assert.strictEqual($items.eq(0).find('.dx-button').attr('tabindex'), '-1',
            'previous item released the stop');
        assert.strictEqual($items.eq(2).find('.dx-button').attr('tabindex'), '-1',
            'next item released the stop');
    });

    QUnit.test('focusin on item[j], then ArrowRight moves to item[j+1]', function(assert) {
        const toolbar = createToolbar(threeButtons());
        const $items = toolbar._getAvailableItems();

        focusInner($items.eq(1).find('.dx-button'));
        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 2,
            'ArrowRight from click-focused item moves to next');
    });

    QUnit.test('focusin on item[j], then ArrowLeft moves to item[j-1]', function(assert) {
        const toolbar = createToolbar(threeButtons());
        const $items = toolbar._getAvailableItems();

        focusInner($items.eq(1).find('.dx-button'));
        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 0,
            'ArrowLeft from click-focused item moves to previous');
    });

    QUnit.test('focusin on TextBox input keeps focusedElement on its item; arrows do not navigate', function(assert) {
        const toolbar = createToolbar([
            buttonItem('Prev'),
            editorItem('dxTextBox', { value: 'hello' }),
            buttonItem('Next'),
        ]);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        focusInner($input);
        press('ArrowLeft', $input.get(0));

        assertFocusedItemAt(assert, toolbar, 1,
            'ArrowLeft does not navigate toolbar after clicking TextBox input');
    });

    QUnit.test('focusin on TextBox → Esc → ArrowLeft navigates toolbar', function(assert) {
        const toolbar = createToolbar([
            buttonItem('Prev'),
            editorItem('dxTextBox', { value: 'hello' }),
            buttonItem('Next'),
        ]);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        focusInner($input);
        press('Escape', $input.get(0));
        this.clock.tick(50);
        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 0,
            'ArrowLeft navigates toolbar after Esc from click-focused TextBox');
    });

    QUnit.test('focusin on SelectBox input promotes its item to be focusedElement', function(assert) {
        const toolbar = createToolbar([
            buttonItem('Prev'),
            editorItem('dxSelectBox', { items: ['A', 'B', 'C'], value: 'A' }),
            buttonItem('Next'),
        ]);
        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        focusInner($input);

        assertFocusedItemAt(assert, toolbar, 1,
            'focusedElement promoted to SelectBox item');
    });

    QUnit.test('focusin on DropDownButton item promotes it and Enter opens its popup', function(assert) {
        const toolbar = createToolbar([
            buttonItem('Prev'),
            editorItem('dxDropDownButton', { items: ['Option 1', 'Option 2'], text: 'Actions' }),
            buttonItem('Next'),
        ]);
        const $items = toolbar._getAvailableItems();
        const $buttonGroup = $items.eq(1).find('.dx-buttongroup');
        const dropDownButton = this.$element.find('.dx-dropdownbutton').dxDropDownButton('instance');

        focusInner($buttonGroup);
        assertFocusedItemAt(assert, toolbar, 1,
            'focusedElement promoted to DropDownButton item');

        const bgInstance = $buttonGroup.dxButtonGroup('instance');
        const $firstItem = bgInstance._buttonsCollection._itemElements().eq(0);
        bgInstance._buttonsCollection.option('focusedElement', $firstItem.get(0));
        press('Enter', $buttonGroup.get(0));
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), true,
            'Enter opens DropDownButton popup after click-focus');
    });
});

QUnit.module('Disabled items skip (focusin-driven)', moduleConfig, function() {

    const triadWithMiddleDisabled = () => [
        buttonItem('A'),
        buttonItem('Disabled', { disabled: true }),
        buttonItem('C'),
    ];

    const triggerFocusinOn = ($item, clock) => {
        $(TOOLBAR_SELECTOR).trigger($.Event('focusin', { target: findFocusTarget($item).get(0) }));
        clock.tick(0);
    };

    QUnit.test('ArrowRight skips disabled middle item (focusin-driven)', function(assert) {
        const toolbar = createToolbar(triadWithMiddleDisabled());
        const $available = toolbar._getAvailableItems();

        triggerFocusinOn($available.eq(0), this.clock);
        press('ArrowRight', findFocusTarget($available.eq(0)).get(0));

        assertFocusedItemAt(assert, toolbar, 1,
            'ArrowRight skipped disabled item and landed on C');
    });

    QUnit.test('ArrowLeft skips disabled middle item (focusin-driven)', function(assert) {
        const toolbar = createToolbar(triadWithMiddleDisabled());
        const $available = toolbar._getAvailableItems();

        triggerFocusinOn($available.eq(1), this.clock);
        press('ArrowLeft', findFocusTarget($available.eq(1)).get(0));

        assertFocusedItemAt(assert, toolbar, 0,
            'ArrowLeft skipped disabled item and landed on A');
    });

    QUnit.test('Home skips leading disabled items (focusin-driven)', function(assert) {
        const toolbar = createToolbar([
            buttonItem('Disabled', { disabled: true }),
            buttonItem('B'),
            buttonItem('C'),
        ]);
        const $available = toolbar._getAvailableItems();

        triggerFocusinOn($available.eq(1), this.clock);
        press('Home', findFocusTarget($available.eq(1)).get(0));

        assertFocusedItemAt(assert, toolbar, 0,
            'Home landed on first enabled item (B), skipping leading disabled');
    });

    QUnit.test('End skips trailing disabled items (focusin-driven)', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B'),
            buttonItem('Disabled', { disabled: true }),
        ]);
        const $available = toolbar._getAvailableItems();

        triggerFocusinOn($available.eq(0), this.clock);
        press('End', findFocusTarget($available.eq(0)).get(0));

        assertFocusedItemAt(assert, toolbar, 1,
            'End landed on last enabled item (B), skipping trailing disabled');
    });

    QUnit.test('disabled item never receives tabindex=0 even after navigation', function(assert) {
        const toolbar = createToolbar(triadWithMiddleDisabled());
        const $available = toolbar._getAvailableItems();
        const $disabled = this.$element.find(`.${TOOLBAR_ITEM_CLASS}.${DISABLED_STATE_CLASS}`).first();

        triggerFocusinOn($available.eq(0), this.clock);
        press('ArrowRight', findFocusTarget($available.eq(0)).get(0));

        const tabIndexOnDisabled = parseInt(findFocusTarget($disabled).attr('tabindex'), 10);
        assert.notStrictEqual(tabIndexOnDisabled, 0,
            'disabled item focus target never has tabindex=0');
    });
});

QUnit.module('Resize and overflow', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$container = $('<div>').width(1000).appendTo('#qunit-fixture');
        this.$element = $('<div>').appendTo(this.$container);
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        this.$container.remove();
    }
}, function() {

    QUnit.test('item moved to overflow menu loses tabindex=0; first visible gets it', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'A', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'B', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'C', width: 200 } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        assert.strictEqual($items.length, 3, 'all 3 items visible initially');

        toolbar.option('focusedElement', $items.eq(2).get(0));
        assert.strictEqual(getItemFocusTarget($items.eq(2)).attr('tabindex'), '0',
            'item C has tabindex=0 before resize');

        this.$container.width(300);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $visibleAfter = toolbar._getAvailableItems();
        assert.ok($visibleAfter.length < 3, 'fewer items visible after shrink');

        assert.strictEqual(getItemFocusTarget($visibleAfter.eq(0)).attr('tabindex'), '0',
            'first visible item has tabindex=0 after resize');
    });

    QUnit.test('item returns from overflow menu: tabindex stays on current active item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'A', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'B', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'C', width: 200 } },
            ],
        }).dxToolbar('instance');

        this.$container.width(300);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $visibleSmall = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $visibleSmall.eq(0).get(0));

        this.$container.width(1000);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $visibleLarge = toolbar._getAvailableItems();
        assert.strictEqual($visibleLarge.length, 3, 'all items visible after expand');
        assert.strictEqual(getItemFocusTarget($visibleLarge.eq(0)).attr('tabindex'), '0',
            'active item A still has tabindex=0');
        assert.strictEqual(getItemFocusTarget($visibleLarge.eq(1)).attr('tabindex'), '-1',
            'item B has tabindex=-1');
        assert.strictEqual(getItemFocusTarget($visibleLarge.eq(2)).attr('tabindex'), '-1',
            'returned item C has tabindex=-1');
    });

    QUnit.test('only one tabindex=0 exists after resize shrinks toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'A', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'B', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'C', width: 200 } },
            ],
        }).dxToolbar('instance');

        toolbar.option('focusedElement', toolbar._getAvailableItems().eq(1).get(0));

        this.$container.width(100);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $tabZero = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabZero.length, 1, 'exactly one tabindex=0 after shrink');
    });

    QUnit.test('TextBox input tabindex=-1 after TextBox item moves to overflow', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'never', options: { text: 'A' } },
                { location: 'before', widget: 'dxTextBox', locateInMenu: 'auto', options: { value: 'text', width: 300 } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));

        this.$container.width(100);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $input = this.$element.find('.dx-texteditor-input');
        assert.strictEqual($input.attr('tabindex'), '-1',
            'hidden TextBox input has tabindex=-1');
    });

    QUnit.test('overflow button gets tabindex=0 after all items move to menu', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'A', width: 300 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'B', width: 300 } },
            ],
        }).dxToolbar('instance');

        toolbar.option('focusedElement', toolbar._getAvailableItems().eq(0).get(0));

        this.$container.width(50);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $overflowBtn = this.$element.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);
        assert.strictEqual($overflowBtn.attr('tabindex'), '0',
            'overflow button has tabindex=0 when it is the only focusable element');
    });

    QUnit.test('resize shrink then expand: tabindex restored correctly on all items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'A', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'B', width: 200 } },
                { location: 'before', widget: 'dxButton', locateInMenu: 'auto', options: { text: 'C', width: 200 } },
            ],
        }).dxToolbar('instance');

        toolbar.option('focusedElement', toolbar._getAvailableItems().eq(1).get(0));

        this.$container.width(100);
        toolbar.updateDimensions();
        this.clock.tick(0);

        this.$container.width(1000);
        toolbar.updateDimensions();
        this.clock.tick(0);

        const $items = toolbar._getAvailableItems();
        assert.strictEqual($items.length, 3, 'all items visible');
        assert.strictEqual(getItemFocusTarget($items.eq(1)).attr('tabindex'), '0',
            'previously focused item B has tabindex=0');
        assert.strictEqual(getItemFocusTarget($items.eq(0)).attr('tabindex'), '-1',
            'item A has tabindex=-1');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).attr('tabindex'), '-1',
            'item C has tabindex=-1');
    });
});

QUnit.module('Overflow menu', moduleConfig, function() {
    const makeOverflowToolbar = function($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');
    };

    const getOverflowBtn = ($el) => $el.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);

    QUnit.test('Enter on overflow button opens menu; first item is focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        assert.strictEqual($overflowBtn.length > 0, true, 'Overflow button is rendered');

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), 'Enter');
        this.clock.tick(0);

        const menu = toolbar._layoutStrategy._menu;
        assert.strictEqual(menu.option('opened'), true, 'Menu is opened after Enter');

        const $popup = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        assert.strictEqual($popup.length > 0, true, 'Popup wrapper exists in DOM');

        const list = menu._list;
        const $firstListItem = list._getAvailableItems().first();
        assert.strictEqual($firstListItem.length > 0, true, 'List has at least one item');

        const $firstFocusTarget = getItemFocusTarget($firstListItem);
        assert.strictEqual(
            document.activeElement === $firstFocusTarget.get(0),
            true,
            'Focus is on first menu item after Enter',
        );
    });

    QUnit.test('Space on overflow button opens menu; first item is focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), ' ');
        this.clock.tick(0);

        const menu = toolbar._layoutStrategy._menu;
        assert.strictEqual(menu.option('opened'), true, 'Menu is opened after Space');
    });

    QUnit.test('ArrowDown/Up navigate inside menu; ArrowRight/Left do not navigate toolbar', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const list = menu._list;
        const $items = list._getAvailableItems();
        assert.strictEqual($items.length >= 2, true, 'At least 2 items in menu');

        const $firstFocusTarget = getItemFocusTarget($items.first());
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowDown');
        this.clock.tick(0);

        const { focusedElement: afterDown } = list.option();
        assert.strictEqual(
            $(afterDown).get(0) !== $items.first().get(0),
            true,
            'ArrowDown moved focus inside menu',
        );

        const { focusedElement: toolbarFocused } = toolbar.option();
        const $currentListFocus = $(list.option('focusedElement'));
        const $currentFocusTarget = getItemFocusTarget($currentListFocus);
        dispatchKeydown($currentFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement: toolbarFocusedAfterRight } = toolbar.option();
        assert.strictEqual(
            $(toolbarFocusedAfterRight).get(0),
            $(toolbarFocused).get(0),
            'ArrowRight inside menu does not change toolbar focusedElement',
        );
    });

    QUnit.test('Escape closes menu; focus returns to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));

        menu.openWithFocus('first');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const list = menu._list;
        const $firstItem = list._getAvailableItems().first();
        const $focusTarget = getItemFocusTarget($firstItem);
        dispatchKeydown($focusTarget.get(0), 'Escape');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu closed after Escape');
        assert.strictEqual(
            document.activeElement,
            $overflowBtn.get(0),
            'Focus returned to overflow button after Escape',
        );
    });

    QUnit.test('item click closes menu; focus returns to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        menu.openWithFocus('first');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const $popup = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        const $listItems = $popup.find(`.${LIST_ITEM_CLASS}`);
        assert.strictEqual($listItems.length > 0, true, 'Popup has list items');

        $listItems.first().trigger('dxclick');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu closed after item click');
        assert.strictEqual(
            document.activeElement,
            $overflowBtn.get(0),
            'Focus returned to overflow button after item click',
        );
    });

    QUnit.test('Tab inside menu closes popup and moves focus to overflow button (allows Tab default to exit toolbar)', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const $firstFocusTarget = getItemFocusTarget(menu._list._getAvailableItems().first());
        assert.strictEqual(
            document.activeElement,
            $firstFocusTarget.get(0),
            'First item is focused before Tab',
        );

        dispatchKeydown($firstFocusTarget.get(0), 'Tab');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu is closed after Tab (APG-compliant)');
        assert.strictEqual(
            document.activeElement === $overflowBtn.get(0),
            true,
            'Focus is on overflow button — in a real browser, Tab default will then move focus to the next element after the toolbar',
        );
    });

    QUnit.test('Shift+Tab inside menu closes popup and moves focus to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const $firstFocusTarget = getItemFocusTarget(menu._list._getAvailableItems().first());

        dispatchKeydown($firstFocusTarget.get(0), 'Tab', { shiftKey: true });
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu is closed after Shift+Tab');
        assert.strictEqual(
            document.activeElement === $overflowBtn.get(0),
            true,
            'Focus is on overflow button after Shift+Tab',
        );
    });

    QUnit.skip('after close, overflow button retains tabindex=0; others have tabindex=-1', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = this.$element.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $firstItem = list._getAvailableItems().first();
        dispatchKeydown(getItemFocusTarget($firstItem).get(0), 'Escape');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu closed after Escape');
        assert.strictEqual(
            parseInt($overflowBtn.attr('tabindex'), 10),
            0,
            'Overflow button has tabindex=0 after close',
        );

        const $otherButtons = this.$element.find(`.${BUTTON_CLASS}`).not(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);
        const allTabindexMinus1 = $otherButtons.toArray().every(
            el => parseInt($(el).attr('tabindex'), 10) === -1,
        );
        assert.strictEqual(allTabindexMinus1, true, 'All other buttons have tabindex=-1');
    });

    QUnit.test('ArrowDown on overflow button opens menu; first item focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), 'ArrowDown');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), true, 'Menu opened via ArrowDown');

        const list = menu._list;
        const $firstItem = list._getAvailableItems().first();
        const $focusTarget = getItemFocusTarget($firstItem);
        assert.strictEqual(
            document.activeElement,
            $focusTarget.get(0),
            'First menu item is focused after ArrowDown',
        );
    });

    QUnit.test('ArrowUp on overflow button opens menu; last item focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), 'ArrowUp');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), true, 'Menu opened via ArrowUp');

        const list = menu._list;
        const $items = list._getAvailableItems();
        const $lastItem = $items.last();
        const $focusTarget = getItemFocusTarget($lastItem);
        assert.strictEqual(
            document.activeElement,
            $focusTarget.get(0),
            'Last menu item is focused after ArrowUp',
        );
    });

    QUnit.test('disabled items inside menu are skipped by ArrowDown', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', disabled: true, options: { text: 'Menu B (disabled)' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        assert.strictEqual($items.length, 2, 'disabled item filtered out of available menu items');

        const $firstFocusTarget = getItemFocusTarget($items.first());
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowDown');
        this.clock.tick(0);

        const $focused = $(list.option('focusedElement'));
        assert.strictEqual($focused.get(0), $items.eq(1).get(0),
            'ArrowDown skips disabled item and lands on Menu C');
    });

    QUnit.test('disabled items inside menu are skipped by ArrowUp', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', disabled: true, options: { text: 'Menu B (disabled)' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('last');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();

        const $lastFocusTarget = getItemFocusTarget($items.last());
        dispatchKeydown($lastFocusTarget.get(0), 'ArrowUp');
        this.clock.tick(0);

        const $focused = $(list.option('focusedElement'));
        assert.strictEqual($focused.get(0), $items.eq(0).get(0),
            'ArrowUp skips disabled item and lands on Menu A');
    });

    QUnit.test('disabled item in menu never gets tabindex=0', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', disabled: true, options: { text: 'Menu B (disabled)' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('first');
        this.clock.tick(0);

        const $popup = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        const $disabledItems = $popup.find('.dx-list-item.dx-state-disabled');
        $disabledItems.each(function() {
            const $btn = $(this).find('.dx-button');
            assert.strictEqual(parseInt($btn.attr('tabindex'), 10), -1,
                'disabled menu item button has tabindex=-1');
        });
    });

    QUnit.test('options.disabled item inside menu is skipped by navigation', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B', disabled: true } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        assert.strictEqual($items.length, 2, 'options.disabled item filtered from menu available items');

        const $firstFocusTarget = getItemFocusTarget($items.first());
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowDown');
        this.clock.tick(0);

        const $focused = $(list.option('focusedElement'));
        assert.strictEqual($focused.get(0), $items.eq(1).get(0),
            'ArrowDown skips options.disabled item in menu');
    });

    QUnit.test('opening menu with leading disabled items focuses first available item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', disabled: true, options: { text: 'Menu A (disabled)' } },
                { widget: 'dxButton', locateInMenu: 'always', disabled: true, options: { text: 'Menu B (disabled)' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu C' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), 'Enter');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), true, 'Menu opened');

        const list = menu._list;
        const $items = list._getAvailableItems();
        assert.strictEqual($items.length, 1, 'Only 1 non-disabled item available');

        const $firstAvailableFocus = getItemFocusTarget($items.first());
        assert.strictEqual(
            document.activeElement === $firstAvailableFocus.get(0),
            true,
            'Focus lands on first available (non-disabled) menu item, skipping disabled leading items',
        );
    });

    QUnit.test('focused menu item does not get dx-state-focused class', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        const $firstItem = $items.first();

        assert.strictEqual($firstItem.hasClass('dx-state-focused'), false,
            'focused list item does not have dx-state-focused');
    });

    QUnit.test('navigating menu items never adds dx-state-focused to list items', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        const $firstFocusTarget = getItemFocusTarget($items.first());

        dispatchKeydown($firstFocusTarget.get(0), 'ArrowDown');
        this.clock.tick(0);

        const $focused = $(list.option('focusedElement'));
        assert.strictEqual($focused.hasClass('dx-state-focused'), false,
            'second item does not have dx-state-focused after ArrowDown');

        assert.strictEqual($items.first().hasClass('dx-state-focused'), false,
            'first item lost dx-state-focused class');

        const $allFocused = list.$element().find('.dx-list-item.dx-state-focused');
        assert.strictEqual($allFocused.length, 0,
            'no dx-state-focused list items in the menu list');
    });

    QUnit.test('overflow button is included in toolbar keyboard navigation sequence', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const $available = toolbar._getAvailableItems();

        assert.strictEqual($available.last().get(0), $overflowBtn.get(0),
            'overflow button is the last available item in the navigation sequence');
    });

    QUnit.test('overflow button gets tabindex=0 when it becomes the active toolbar item', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const $available = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $available.last().get(0));

        assert.strictEqual($overflowBtn.get(0).getAttribute('tabindex'), '0',
            'overflow button has tabindex=0 when it is the active toolbar item');
    });

    QUnit.test('focused menu item gets tabindex=0 after ArrowDown; previously focused item gets tabindex=-1', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        dispatchKeydown(getItemFocusTarget($items.first()).get(0), 'ArrowDown');
        this.clock.tick(0);

        assert.strictEqual(getItemFocusTarget($items.eq(1)).get(0).getAttribute('tabindex'), '0',
            'item[1] (newly focused) has tabindex=0');
        assert.strictEqual(getItemFocusTarget($items.eq(0)).get(0).getAttribute('tabindex'), '-1',
            'item[0] (previously focused) has tabindex=-1');
    });

    QUnit.test('all non-focused menu items have tabindex=-1 after navigation', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();
        dispatchKeydown(getItemFocusTarget($items.first()).get(0), 'ArrowDown');
        this.clock.tick(0);

        assert.strictEqual(getItemFocusTarget($items.eq(0)).get(0).getAttribute('tabindex'), '-1',
            'item[0] has tabindex=-1 after focus moved away');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).get(0).getAttribute('tabindex'), '-1',
            'item[2] has tabindex=-1 (never focused)');
    });

    QUnit.test('mouse click on overflow button opens menu; first item is focused (allowKeyboardNavigation=true)', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        assert.strictEqual(toolbar.option('allowKeyboardNavigation'), true, 'allowKeyboardNavigation is true (default)');

        $overflowBtn.trigger('dxclick');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), true, 'Menu is opened after click');

        const list = menu._list;
        const $firstFocusTarget = getItemFocusTarget(list._getAvailableItems().first());

        assert.strictEqual(
            document.activeElement === $firstFocusTarget.get(0),
            true,
            'First menu item is focused after mouse click (same behavior as Enter)',
        );
    });

    QUnit.test('popup overlay content does not steal focus when menu opens (focus goes to first list item)', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        $overflowBtn.trigger('dxclick');
        this.clock.tick(0);

        const popupContent = menu._popup.$overlayContent().get(0);
        const list = menu._list;
        const $firstFocusTarget = getItemFocusTarget(list._getAvailableItems().first());

        assert.strictEqual(
            document.activeElement === popupContent,
            false,
            'Popup overlay content is NOT the active element',
        );
        assert.strictEqual(
            document.activeElement === $firstFocusTarget.get(0),
            true,
            'Focus is on the first menu item, not on the popup overlay',
        );
    });

    QUnit.test('Escape closes menu after mouse open; focus returns to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        $overflowBtn.trigger('dxclick');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu is opened');

        const list = menu._list;
        const $firstFocusTarget = getItemFocusTarget(list._getAvailableItems().first());

        assert.strictEqual(
            document.activeElement === $firstFocusTarget.get(0),
            true,
            'First item is focused after mouse open',
        );

        dispatchKeydown($firstFocusTarget.get(0), 'Escape');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu is closed after Escape');
        assert.strictEqual(
            document.activeElement === $overflowBtn.get(0),
            true,
            'Focus returns to overflow button after Escape',
        );
    });

    QUnit.test('Escape closes menu after keyboard open; focus returns to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        toolbar.option('focusedElement', $overflowBtn.get(0));
        dispatchKeydown($overflowBtn.get(0), 'Enter');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'Menu is opened after Enter');

        const list = menu._list;
        const $firstFocusTarget = getItemFocusTarget(list._getAvailableItems().first());

        assert.strictEqual(
            document.activeElement === $firstFocusTarget.get(0),
            true,
            'First item is focused after keyboard open',
        );

        dispatchKeydown($firstFocusTarget.get(0), 'Escape');
        this.clock.tick(0);

        assert.strictEqual(menu.option('opened'), false, 'Menu is closed after Escape');
        assert.strictEqual(
            document.activeElement === $overflowBtn.get(0),
            true,
            'Focus returns to overflow button after Escape',
        );
    });

    QUnit.test('closing menu while focus is outside popup keeps focus on the outside element', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;
        const $outside = $('<button type="button">outside</button>').appendTo(document.body);

        try {
            menu.openWithFocus('first');
            this.clock.tick(0);

            $outside.get(0).focus();
            this.clock.tick(0);
            assert.strictEqual(document.activeElement, $outside.get(0), 'Focus moved outside popup');

            menu.option('opened', false);
            this.clock.tick(0);

            assert.strictEqual(menu.option('opened'), false, 'Menu is closed');
            assert.notStrictEqual(
                document.activeElement,
                $overflowBtn.get(0),
                'Focus is NOT moved to overflow button when it was already outside the popup',
            );
        } finally {
            $outside.remove();
        }
    });

    QUnit.test('ArrowDown on dxMenu inside overflow list navigates list, does not activate menu', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                {
                    locateInMenu: 'always',
                    widget: 'dxMenu',
                    options: {
                        items: [
                            { text: 'File', items: [{ text: 'New' }, { text: 'Open' }] },
                        ],
                    },
                },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'After Menu' } },
            ],
        }).dxToolbar('instance');
        const $overflowBtn = this.$element.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);
        const menu = toolbar._layoutStrategy._menu;

        $overflowBtn.trigger('dxclick');
        this.clock.tick(0);
        assert.strictEqual(menu.option('opened'), true, 'overflow popup opened');

        const $listItems = menu._list._getAvailableItems();
        const $menuListItem = $listItems.toArray().map((el) => $(el)).find(($i) => $i.find('.dx-menu').length > 0);
        assert.ok($menuListItem, 'found a list item containing dxMenu');

        menu._list.option('focusedElement', $menuListItem.get(0));
        menu._list._focusItemWidget($menuListItem);
        this.clock.tick(0);

        const $menuRoot = $menuListItem.find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu is at list nav level — internal focusedElement is null');

        dispatchKeydown($menuRoot.get(0), 'ArrowDown');
        this.clock.tick(0);

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu did NOT activate on ArrowDown — its keyboard handler did not process the key');

        const newFocused = $(menu._list.option('focusedElement')).get(0);
        assert.notStrictEqual(newFocused, $menuListItem.get(0),
            'list moved to the next item on ArrowDown (instead of menu reacting)');
    });

});

QUnit.module('Template items', moduleConfig, function() {
    QUnit.test('template item with focusable content is in roving tabindex sequence', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 3, 'All 3 items (including template) are in navigation sequence');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $focusTarget = getItemFocusTarget($templateItem);
        assert.strictEqual(
            $focusTarget !== undefined && $focusTarget !== null && $focusTarget.length > 0, true,
            'getItemFocusTarget returns the native button inside the template',
        );
    });

    QUnit.test('template item with no focusable content is skipped in navigation', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<span>').text('Static Text') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 2, 'Template item with no focusable content is excluded from navigation');
    });

    QUnit.test('ArrowRight to template item: container gets tabindex=0; _insideActiveItem===false', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemA = $allItems.eq(0);
        const $templateItem = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        const $focusTarget = getItemFocusTarget($templateItem);
        assert.strictEqual(
            parseInt($focusTarget.attr('tabindex'), 10),
            0,
            'Template item focus target has tabindex=0 after ArrowRight',
        );

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $templateItem.get(0), 'focusedElement is template item container');
    });

    QUnit.test('ArrowLeft to template item: container gets tabindex=0; _insideActiveItem===false', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemC = $allItems.eq(2);
        const $templateItem = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemC).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemC).get(0), 'ArrowLeft');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $templateItem.get(0), 'ArrowLeft moved focus to template item');
    });

    QUnit.test('ArrowLeft/Right while template container is focused navigate toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $itemC = $allItems.eq(2);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0), 'ArrowRight from template item moves focus to C');
    });

    QUnit.test('template item with [tabindex] div (not native button) is in roving tabindex sequence', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div tabindex="0">').text('Group item') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 3, 'Template item with [tabindex] div is in navigation sequence');
    });

    QUnit.test('ArrowRight navigates to template item with [tabindex] div content', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div tabindex="0" class="tmpl-div">').text('Group item') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemA = $allItems.eq(0);
        const $templateItem = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $templateItem.get(0), 'focusedElement is the template item container');

        const $focusTarget = getItemFocusTarget($templateItem);
        assert.strictEqual(parseInt($focusTarget.attr('tabindex'), 10), 0, 'Template div has tabindex=0');
    });

    QUnit.test('navigation round-trip: leave and return to [tabindex] div template item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', template: () => $('<div tabindex="0" class="tmpl-div">').text('Group item') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(0);
        const $itemB = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'ArrowRight');
        this.clock.tick(0);
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $itemB.get(0), 'moved to B');

        dispatchKeydown(getItemFocusTarget($itemB).get(0), 'ArrowLeft');
        this.clock.tick(0);
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $templateItem.get(0), 'returned to template item');
        assert.strictEqual(parseInt(getItemFocusTarget($templateItem).attr('tabindex'), 10), 0, 'template div tabindex restored to 0');
    });

    QUnit.skip('Enter on template container: _insideActiveItem===true; focus moves to first focusable', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button" class="template-btn">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        const $nativeBtn = $templateItem.find('.template-btn');
        assert.strictEqual(
            document.activeElement,
            $nativeBtn.get(0),
            'Enter on template container moves focus to first focusable inside template',
        );
    });

    QUnit.skip('Space on template container: same as Enter', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button" class="template-btn">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), ' ');
        this.clock.tick(0);

        const $nativeBtn = $templateItem.find('.template-btn');
        assert.strictEqual(
            document.activeElement,
            $nativeBtn.get(0),
            'Space on template container moves focus to first focusable inside template',
        );
    });

    QUnit.skip('Escape inside template: _insideActiveItem===false; focus returns to container', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button" class="template-btn">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $nativeBtn = $templateItem.find('.template-btn');

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        dispatchKeydown($nativeBtn.get(0), 'Escape');
        this.clock.tick(0);

        assert.strictEqual(
            document.activeElement,
            getItemFocusTarget($templateItem).get(0),
            'Escape inside template returns focus to template container',
        );
    });

    QUnit.skip('Tab inside template moves through focusable elements in DOM order', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="tmpl-btn-1">').text('T1'),
                        $('<button type="button" class="tmpl-btn-2">').text('T2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $btn2 = $templateItem.find('.tmpl-btn-2');

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        dispatchKeydown(document.activeElement, 'Tab');
        this.clock.tick(0);

        assert.strictEqual(
            document.activeElement,
            $btn2.get(0),
            'Tab inside template moved focus to second button',
        );
    });

    QUnit.test('Tab after last focusable inside template exits toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<button type="button" class="only-btn">').text('Only'),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);

        toolbar.option('focusedElement', $templateItem.get(0));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        dispatchKeydown(document.activeElement, 'Tab');
        this.clock.tick(0);

        assert.strictEqual(
            this.$element.get(0).contains(document.activeElement),
            false,
            'Tab after last focusable inside template exits toolbar',
        );
    });

    QUnit.test('click on focusable inside template sets active item and enters inner-focus mode', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<button type="button" class="tmpl-btn">').text('Custom') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $nativeBtn = $templateItem.find('.tmpl-btn');

        this.$element.trigger($.Event('focusin', { target: $nativeBtn.get(0) }));
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual(
            $(focusedElement).get(0),
            $templateItem.get(0),
            'Mouse click on template content sets focusedElement to template item container',
        );
    });


    QUnit.test('template with <a href> is included in _getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<a href="#" class="tmpl-link">').text('Link') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 3, 'template with <a href> is included in available items');
    });

    QUnit.test('template with <a href>: getItemFocusTarget returns the <a> element', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<a href="#" class="tmpl-link">').text('Link') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $focusTarget = getItemFocusTarget($templateItem);

        assert.strictEqual($focusTarget.get(0), $templateItem.find('.tmpl-link').get(0),
            'getItemFocusTarget returns the <a> element inside template');
    });

    QUnit.test('template with <a href>: tabindex=0 when active, -1 when not', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<a href="#" class="tmpl-link">').text('Link') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $link = $templateItem.find('.tmpl-link');

        assert.strictEqual($link.attr('tabindex'), '-1',
            'link has tabindex=-1 when not the active item');

        const $available = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($available.eq(0)).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($available.eq(0)).get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($link.attr('tabindex'), '0',
            'link has tabindex=0 when it is the active item');
    });

    QUnit.test('template with <a href>: ArrowRight navigates to next toolbar item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<a href="#" class="tmpl-link">').text('Link') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $linkItem = $available.eq(1);
        const $itemC = $available.eq(2);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($linkItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($linkItem).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0),
            'ArrowRight from link template navigates to next toolbar item');
    });

    QUnit.test('template with <a href>: ArrowLeft navigates to previous toolbar item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<a href="#" class="tmpl-link">').text('Link') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $linkItem = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($linkItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($linkItem).get(0), 'ArrowLeft');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemA.get(0),
            'ArrowLeft from link template navigates to previous toolbar item');
    });


    QUnit.test('template with dxButton widget: included in _getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div>').dxButton({ text: 'TemplateBtn' }) },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 3, 'template with dxButton is included in available items');
    });

    QUnit.test('template with dxButton widget: getItemFocusTarget returns the dx-button element', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div>').dxButton({ text: 'TemplateBtn' }) },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $focusTarget = getItemFocusTarget($templateItem);
        const $dxButton = $templateItem.find('.dx-button').first();

        assert.strictEqual($focusTarget.get(0), $dxButton.get(0),
            'getItemFocusTarget returns the dx-button inside the template');
    });

    QUnit.test('template with dxButton widget: ArrowRight navigates toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div>').dxButton({ text: 'TemplateBtn' }) },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $templateItem = $available.eq(1);
        const $itemC = $available.eq(2);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0),
            'ArrowRight from template dxButton navigates to next toolbar item');
    });


    QUnit.test('template with multiple focusable elements: item is one stop in _getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="inner-btn-1">').text('B1'),
                        $('<button type="button" class="inner-btn-2">').text('B2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 3,
            'template with multiple buttons is one stop — 3 available items total');
    });

    QUnit.test('template with multiple focusable elements: ArrowRight moves to next toolbar item, not into template', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="inner-btn-1">').text('B1'),
                        $('<button type="button" class="inner-btn-2">').text('B2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $templateItem = $available.eq(1);
        const $itemC = $available.eq(2);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0),
            'ArrowRight from multi-button template moves to next toolbar item, not into inner buttons');
    });

    QUnit.test('template with multiple focusable elements: ArrowLeft moves to prev toolbar item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="inner-btn-1">').text('B1'),
                        $('<button type="button" class="inner-btn-2">').text('B2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $templateItem = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'ArrowLeft');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemA.get(0),
            'ArrowLeft from multi-button template moves to previous toolbar item');
    });

    QUnit.skip('template with multiple focusable: inner elements have tabindex=-1 before activation', function(assert) {

        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="inner-btn-1">').text('B1'),
                        $('<button type="button" class="inner-btn-2">').text('B2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $templateItem = $allItems.eq(1);
        const $btn1 = $templateItem.find('.inner-btn-1');
        const $btn2 = $templateItem.find('.inner-btn-2');

        assert.strictEqual($btn1.attr('tabindex'), '-1',
            'first inner button has tabindex=-1 (not the active item)');
        assert.strictEqual($btn2.attr('tabindex'), '-1',
            'second inner button has tabindex=-1 before activation');
    });

    QUnit.skip('template with multiple focusable: ArrowRight/Left inside activated mode do NOT navigate toolbar', function(assert) {

        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                {
                    locateInMenu: 'never',
                    template: () => $('<div>').append(
                        $('<button type="button" class="inner-btn-1">').text('B1'),
                        $('<button type="button" class="inner-btn-2">').text('B2'),
                    ),
                },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $templateItem = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($templateItem).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $templateItem.get(0),
            'ArrowRight inside activated template does NOT navigate toolbar');
    });
});

QUnit.module('Extra — Core behaviors', moduleConfig, function() {
    QUnit.test('exactly one tabindex=0 exists inside toolbar at all times', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxSelectBox', options: { items: ['x', 'y'] } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        this.$element.trigger($.Event('focusin', { target: this.$element.get(0) }));
        this.clock.tick(0);

        const $tabindex0 = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabindex0.length, 1, 'Exactly one element inside toolbar has tabindex=0');
    });

    QUnit.test('Empty toolbar — no crash, no tabindex=0 items', function(assert) {
        this.$element.dxToolbar({ items: [] });
        const $tabindex0 = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabindex0.length, 0, 'No tabindex=0 elements in empty toolbar');
    });

    QUnit.test('allowKeyboardNavigation:false — no keyboard handling', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $firstFocusTarget = getItemFocusTarget($items.first());

        const focusBefore = toolbar.option('focusedElement');
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        const focusAfter = toolbar.option('focusedElement');
        assert.strictEqual(focusBefore, focusAfter, 'focusedElement unchanged when allowKeyboardNavigation:false');
    });

    QUnit.test('allowKeyboardNavigation:false — roving tabindex is not applied', function(assert) {
        this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
            ],
        });

        const $buttons = this.$element.find('.dx-button');
        const allHaveNaturalTabindex = $buttons.toArray().every(
            el => $(el).attr('tabindex') === undefined || $(el).attr('tabindex') === '0',
        );
        assert.strictEqual(allHaveNaturalTabindex, true,
            'buttons keep natural tabindex when allowKeyboardNavigation:false');
    });

    QUnit.test('allowKeyboardNavigation:false propagates to overflow menu list but not to DropDownMenu itself', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        assert.strictEqual(menu.option('focusStateEnabled'), true,
            'DropDownMenu keeps its own focusStateEnabled:true (default)');
        assert.strictEqual(menu.option('listFocusStateEnabled'), false,
            'DropDownMenu receives listFocusStateEnabled:false from toolbar');

        menu.option('opened', true);
        this.clock.tick(0);

        assert.strictEqual(menu._list.option('focusStateEnabled'), false,
            'ToolbarMenuList gets focusStateEnabled:false via listFocusStateEnabled');
    });

    QUnit.test('changing allowKeyboardNavigation at runtime propagates listFocusStateEnabled to menu and list', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        assert.strictEqual(menu.option('focusStateEnabled'), true, 'menu starts with focusStateEnabled:true');
        assert.strictEqual(menu.option('listFocusStateEnabled'), true, 'menu starts with listFocusStateEnabled:true');
        assert.strictEqual(menu._list.option('focusStateEnabled'), true, 'list starts with focusStateEnabled:true');

        toolbar.option('allowKeyboardNavigation', false);

        assert.strictEqual(menu.option('focusStateEnabled'), true,
            'DropDownMenu keeps its own focusStateEnabled:true after runtime change');
        assert.strictEqual(menu.option('listFocusStateEnabled'), false,
            'DropDownMenu gets listFocusStateEnabled:false after runtime change');
        assert.strictEqual(menu._list.option('focusStateEnabled'), false,
            'ToolbarMenuList gets focusStateEnabled:false after runtime change');
    });

    QUnit.test('changing allowKeyboardNavigation at runtime toggles keyboard navigation', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $firstFocusTarget = getItemFocusTarget($items.first());
        const $secondItem = $items.eq(1).get(0);

        this.$element.trigger($.Event('focusin', { target: $firstFocusTarget.get(0) }));
        this.clock.tick(0);

        dispatchKeydown($firstFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $secondItem,
            'ArrowRight moves focus to second item when allowKeyboardNavigation:true');

        toolbar.option('allowKeyboardNavigation', false);

        const focusBefore = toolbar.option('focusedElement');
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        const focusAfterDisabled = toolbar.option('focusedElement');
        assert.strictEqual(focusBefore, focusAfterDisabled,
            'ArrowRight does not move focus after allowKeyboardNavigation changed to false');
    });

    QUnit.test('allowKeyboardNavigation:true→false — items reset to natural tabindex (all 0)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $firstFocusTarget = getItemFocusTarget($items.first());
        this.$element.trigger($.Event('focusin', { target: $firstFocusTarget.get(0) }));
        this.clock.tick(0);

        const tabIndicesBefore = $items.toArray().map(item => getItemFocusTarget($(item)).attr('tabindex'));
        assert.strictEqual(tabIndicesBefore[0], '0', 'First item has tabindex=0 (roving)');
        assert.strictEqual(tabIndicesBefore[1], '-1', 'Second item has tabindex=-1 (roving)');

        toolbar.option('allowKeyboardNavigation', false);

        const tabIndicesAfter = $items.toArray().map(item => getItemFocusTarget($(item)).attr('tabindex'));
        assert.strictEqual(tabIndicesAfter[0], '0', 'First item has natural tabindex=0 after allowKeyboardNavigation:false');
        assert.strictEqual(tabIndicesAfter[1], '0', 'Second item has natural tabindex=0 after allowKeyboardNavigation:false');
        assert.strictEqual(tabIndicesAfter[2], '0', 'Third item has natural tabindex=0 after allowKeyboardNavigation:false');
    });

    QUnit.test('allowKeyboardNavigation:false→true — roving tabindex is applied (only first item at 0)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();

        const tabIndicesBefore = $items.toArray().map(item => getItemFocusTarget($(item)).attr('tabindex'));
        assert.strictEqual(tabIndicesBefore[0], '0', 'All items start at natural tabindex=0');
        assert.strictEqual(tabIndicesBefore[1], '0', 'All items start at natural tabindex=0');

        toolbar.option('allowKeyboardNavigation', true);

        const tabIndicesAfter = $items.toArray().map(item => getItemFocusTarget($(item)).attr('tabindex'));
        assert.strictEqual(tabIndicesAfter[0], '0', 'First item gets tabindex=0 from roving tabindex');
        assert.strictEqual(tabIndicesAfter[1], '-1', 'Second item gets tabindex=-1 from roving tabindex');
        assert.strictEqual(tabIndicesAfter[2], '-1', 'Third item gets tabindex=-1 from roving tabindex');
    });

    QUnit.test('allowKeyboardNavigation:false — overflow menu items use toggleItemFocusableElementTabIndex (not roving)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $listItems = menu._list.$element().find('.dx-list-item');
        const allButtonsHaveTabindex = $listItems.toArray().every(el => {
            const $btn = $(el).find('.dx-button');
            return $btn.length === 0 || $btn.attr('tabindex') === '0' || $btn.attr('tabindex') === undefined;
        });
        assert.strictEqual(allButtonsHaveTabindex, true,
            'menu items use natural tabindex (toggleItemFocusableElementTabIndex) when allowKeyboardNavigation:false');
    });

    QUnit.test('allowKeyboardNavigation:false — opening overflow menu does not auto-focus items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const focusedElement = menu._list.option('focusedElement');
        assert.strictEqual(focusedElement, null,
            'no item auto-focused on open when allowKeyboardNavigation:false');
    });

    QUnit.test('allowKeyboardNavigation:true — overflow menu uses roving tabindex', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $listItems = menu._list.$element().find('.dx-list-item');
        const tabindexValues = $listItems.toArray().map(el => {
            const $btn = $(el).find('.dx-button');
            return $btn.length ? $btn.attr('tabindex') : undefined;
        });
        const countZero = tabindexValues.filter(v => v === '0').length;
        const countMinusOne = tabindexValues.filter(v => v === '-1').length;

        assert.strictEqual(countZero, 1, 'exactly one item has tabindex=0 (roving tabindex)');
        assert.strictEqual(countMinusOne, 1, 'other items have tabindex=-1');
    });

    QUnit.test('focusOut to overlay content does not reset focus state', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxSelectBox', options: { items: ['A', 'B'] } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(0).get(0));
        toolbar._focusItemWidget($items.eq(0));
        this.clock.tick(0);

        const $overlay = $('<div class="dx-overlay-content">').appendTo('#qunit-fixture');
        this.$element.trigger($.Event('focusout', {
            target: this.$element.find('.dx-texteditor').get(0),
            relatedTarget: $overlay.get(0),
        }));
        this.clock.tick(0);

        assert.ok($(toolbar.option('focusedElement')).length > 0,
            'focusedElement is preserved when focus moves to overlay content');
        $overlay.remove();
    });

    QUnit.test('Tab key is not intercepted by toolbar', function(assert) {
        this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B' } },
            ],
        });

        const $button = this.$element.find('.dx-button').first();
        const event = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });
        $button.get(0).dispatchEvent(event);

        assert.strictEqual(event.defaultPrevented, false,
            'Tab keydown is not prevented by toolbar');
    });

    QUnit.test('allowKeyboardNavigation:true (default) — toolbar element has dx-toolbar-focus-mode class', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        });

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'toolbar has dx-toolbar-focus-mode class when allowKeyboardNavigation:true'
        );
    });

    QUnit.test('allowKeyboardNavigation:false — toolbar element does NOT have dx-toolbar-focus-mode class', function(assert) {
        this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        });

        assert.notOk(
            this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'toolbar does not have dx-toolbar-focus-mode class when allowKeyboardNavigation:false'
        );
    });

    QUnit.test('changing allowKeyboardNavigation at runtime toggles dx-toolbar-focus-mode class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        }).dxToolbar('instance');

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'class is present when allowKeyboardNavigation:true'
        );

        toolbar.option('allowKeyboardNavigation', false);

        assert.notOk(
            this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'class is removed after setting allowKeyboardNavigation:false'
        );

        toolbar.option('allowKeyboardNavigation', true);

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'class is re-added after setting allowKeyboardNavigation:true'
        );
    });

    QUnit.test('allowKeyboardNavigation:true — overflow popup wrapper has dx-dropdownmenu-list-focus-mode class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        assert.ok(
            $wrapper.hasClass(DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS),
            'popup wrapper has dx-dropdownmenu-list-focus-mode class when allowKeyboardNavigation:true'
        );
    });

    QUnit.test('allowKeyboardNavigation:false — overflow popup wrapper does NOT have dx-dropdownmenu-list-focus-mode class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        assert.notOk(
            $wrapper.hasClass(DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS),
            'popup wrapper does not have dx-dropdownmenu-list-focus-mode class when allowKeyboardNavigation:false'
        );
    });

    QUnit.test('changing allowKeyboardNavigation at runtime toggles dx-dropdownmenu-list-focus-mode on popup wrapper', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);

        assert.ok(
            $wrapper.hasClass(DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS),
            'popup wrapper has class when allowKeyboardNavigation:true'
        );

        toolbar.option('allowKeyboardNavigation', false);

        assert.notOk(
            $wrapper.hasClass(DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS),
            'popup wrapper loses class after setting allowKeyboardNavigation:false'
        );

        toolbar.option('allowKeyboardNavigation', true);

        assert.ok(
            $wrapper.hasClass(DROPDOWN_MENU_LIST_FOCUS_MODE_CLASS),
            'popup wrapper regains class after setting allowKeyboardNavigation:true'
        );
    });
});

QUnit.module('Non-focusable service items', moduleConfig, function() {
    QUnit.test('separator template is excluded from _getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div class="dx-toolbar-separator">') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 2, 'separator template is excluded from available items');
    });

    QUnit.test('label template (plain text span) is excluded from _getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<span>').text('Title') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 2, 'label template is excluded from available items');
    });

    QUnit.test('ArrowRight skips separator and moves to next focusable item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div class="dx-toolbar-separator">') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $itemC = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0),
            'ArrowRight skipped separator and landed on C');
    });

    QUnit.test('ArrowLeft skips separator and moves to previous focusable item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div class="dx-toolbar-separator">') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $itemC = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemC).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemC).get(0), 'ArrowLeft');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemA.get(0),
            'ArrowLeft skipped separator and landed on A');
    });

    QUnit.test('Home ignores non-focusable item at the start', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', template: () => $('<div class="dx-toolbar-separator">') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $itemB = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemB).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemB).get(0), 'Home');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemA.get(0),
            'Home landed on first focusable item, ignoring leading separator');
    });

    QUnit.test('End ignores non-focusable item at the end', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', template: () => $('<span>').text('Label') },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        const $itemA = $available.eq(0);
        const $itemB = $available.eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'End');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemB.get(0),
            'End landed on last focusable item, ignoring trailing label');
    });

    QUnit.test('non-focusable item does not receive tabindex=0 on init', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', template: () => $('<div class="dx-toolbar-separator">') },
                { locateInMenu: 'never', template: () => $('<span>').text('Label') },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $separatorItem = $allItems.eq(1);
        const $labelItem = $allItems.eq(2);

        assert.strictEqual($separatorItem.find('[tabindex="0"]').length, 0,
            'separator item has no element with tabindex=0');
        assert.strictEqual($separatorItem.attr('tabindex'), undefined,
            'separator item container has no tabindex attribute');
        assert.strictEqual($labelItem.find('[tabindex="0"]').length, 0,
            'label item has no element with tabindex=0');
        assert.strictEqual($labelItem.attr('tabindex'), undefined,
            'label item container has no tabindex attribute');
    });
});

QUnit.module('Enter/Exit: dxMenu (APG Menu Button)', moduleConfig, function() {
    const menuItems = [
        { text: 'File', items: [{ text: 'New' }, { text: 'Open' }] },
        { text: 'Edit', items: [{ text: 'Cut' }, { text: 'Copy' }] },
    ];

    function createMenuToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxMenu', options: { items: menuItems } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');
    }

    QUnit.test('dxMenu is a single toolbar stop — ArrowRight skips past it', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowRight from button lands on dxMenu item');

        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
            'second ArrowRight skips past dxMenu to Next button');
    });

    QUnit.test('dxMenu root does NOT get dx-state-focused on toolbar navigation', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        toolbar._focusItemWidget($items.eq(1));
        this.clock.tick(0);

        assert.strictEqual($items.eq(1).find('.dx-menu').first().hasClass('dx-state-focused'), false,
            '.dx-menu root does NOT have dx-state-focused during toolbar navigation (before Enter)');
    });

    QUnit.test('Enter activates menu — focus moves inside .dx-menu', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        assert.ok(
            $items.eq(1).get(0).contains(document.activeElement),
            'focus is inside the dxMenu toolbar item',
        );
    });

    QUnit.test('first menu-item gets dx-state-focused after Enter', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        const $firstMenuItem = $items.eq(1).find('.dx-menu-item').first();
        assert.ok($firstMenuItem.hasClass('dx-state-focused'),
            'first .dx-menu-item has dx-state-focused after Enter');
    });

    QUnit.test('ArrowRight inside menu navigates to next root item (not toolbar)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'toolbar focusedElement stays on dxMenu item');

        const $menu = $items.eq(1).find('.dx-menu');
        const menuInstance = $menu.dxMenu('instance');
        const $menuItems = $menu.find('.dx-menu-item');

        assert.strictEqual($(menuInstance.option('focusedElement')).get(0), $menuItems.eq(1).get(0),
            'menu focusedElement moved to second root item');
    });

    QUnit.test('ArrowLeft inside menu navigates to previous root item (not toolbar)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(0);

        dispatchKeydown(document.activeElement, 'ArrowLeft');
        this.clock.tick(0);

        const $menu = $items.eq(1).find('.dx-menu');
        const menuInstance = $menu.dxMenu('instance');
        const $menuItems = $menu.find('.dx-menu-item');

        assert.strictEqual($(menuInstance.option('focusedElement')).get(0), $menuItems.eq(0).get(0),
            'menu focusedElement moved back to first root item');
    });

    QUnit.test('Escape exits menu — focus returns to .dx-toolbar-item (nav level)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $items.eq(1).get(0),
            'focus returned to .dx-toolbar-item after Escape (nav-level focus target)');
        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        assert.strictEqual($menuRoot.hasClass('dx-state-focused'), false,
            '.dx-menu root does NOT have dx-state-focused after Escape (back to toolbar nav level)');
    });

    QUnit.test('menu-item dx-state-focused removed after Escape', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        const $firstMenuItem = $items.eq(1).find('.dx-menu-item').first();
        assert.ok($firstMenuItem.hasClass('dx-state-focused'),
            'menu-item has dx-state-focused while inside menu');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.notOk($firstMenuItem.hasClass('dx-state-focused'),
            'menu-item lost dx-state-focused after Escape');
    });

    QUnit.test('after Escape, ArrowRight navigates toolbar to next item', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
            'ArrowRight navigates toolbar after Escape from menu');
    });

    QUnit.test('ArrowDown on root menu item opens submenu', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowDown');
        this.clock.tick(300);

        const $expanded = $items.eq(1).find('.dx-menu-item-expanded');
        assert.ok($expanded.length > 0, 'submenu opened — menu item has expanded class');
    });

    QUnit.test('tabindex invariant after enter/exit cycle', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        const $tabZero = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabZero.length, 1,
            'exactly one tabindex=0 after enter/exit/navigate cycle');
    });

    QUnit.test('tabindex=0 is on .dx-toolbar-item wrapper, not on .dx-menu root', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($items.eq(1).attr('tabindex'), '0',
            '.dx-toolbar-item is the Tab stop (tabindex=0)');
        assert.strictEqual($items.eq(1).find('.dx-menu').first().attr('tabindex'), '-1',
            '.dx-menu root is NOT a Tab stop (tabindex=-1, programmatic focus only)');
    });

    QUnit.test('dxMenu does not get dx-state-focused on toolbar navigation (before Enter)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        toolbar._focusItemWidget($items.eq(1));
        this.clock.tick(0);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        assert.strictEqual($menuRoot.hasClass('dx-state-focused'), false,
            '.dx-menu root does not have dx-state-focused during toolbar navigation');

        const $menuItems = $menuRoot.find('.dx-menu-item');
        const anyMenuItemFocused = $menuItems.toArray().some(
            (el) => $(el).hasClass('dx-state-focused')
        );
        assert.strictEqual(anyMenuItemFocused, false,
            'no .dx-menu-item is activated/highlighted during toolbar navigation (silent like texteditor)');

        const menuInstance = $menuRoot.dxMenu('instance');
        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'menu internal focusedElement is null (not auto-activated)');
    });

    QUnit.test('Non-activation keys at toolbar nav level do not activate dxMenu', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        toolbar._focusItemWidget($items.eq(1));
        this.clock.tick(0);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        ['a', 'F1', 'PageDown', 'PageUp', 'Tab'].forEach(function(key) {
            dispatchKeydown($menuRoot.get(0), key);
            this.clock.tick(0);

            assert.strictEqual(menuInstance.option('focusedElement'), null,
                `dxMenu focusedElement is still null after "${key}" at nav level`);
            assert.strictEqual($menuRoot.find('.dx-state-focused').length, 0,
                `no .dx-menu-item is highlighted after "${key}" at nav level`);
        }, this);
    });

    QUnit.test('Tab landing on .dx-toolbar-item does not auto-activate dxMenu', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        $items.eq(1).get(0).focus();
        this.clock.tick(0);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'menu does not auto-activate when Tab lands on .dx-toolbar-item');
        assert.strictEqual($menuRoot.hasClass('dx-state-focused'), false,
            '.dx-menu root does not have dx-state-focused');
    });

    QUnit.test('Escape with open submenu closes submenu first; second Escape exits to toolbar nav', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowDown');
        this.clock.tick(300);

        const $expanded = $items.eq(1).find('.dx-menu-item-expanded');
        assert.ok($expanded.length > 0, 'submenu is open after ArrowDown');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        assert.ok($items.eq(1).get(0).contains(document.activeElement),
            'focus is still inside dxMenu toolbar item after first Escape');
        assert.strictEqual($items.eq(1).find('.dx-menu-item-expanded').length, 0,
            'submenu is closed after first Escape');
        assert.notStrictEqual(menuInstance.option('focusedElement'), null,
            'menu is still active (focusedElement set) after first Escape');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $items.eq(1).get(0),
            'focus returned to .dx-toolbar-item after second Escape (nav-level focus target)');
        assert.strictEqual($menuRoot.find('.dx-state-focused').length, 0,
            'no menu-item is visually focused after exiting to nav level');
        assert.strictEqual($menuRoot.hasClass('dx-state-focused'), false,
            '.dx-menu root does not have dx-state-focused at nav level');
    });

    QUnit.test('ArrowDown at nav level does NOT activate dxMenu (menu is already visible)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'ArrowDown');
        this.clock.tick(50);

        const $menu = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menu.dxMenu('instance');

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu is NOT activated by ArrowDown — focusedElement stays null');
        assert.strictEqual($menu.find('.dx-state-focused').length, 0,
            'no .dx-menu-item is highlighted after ArrowDown at nav level');
    });

    QUnit.test('ArrowUp at nav level does NOT activate dxMenu', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'ArrowUp');
        this.clock.tick(50);

        const $menu = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menu.dxMenu('instance');

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu is NOT activated by ArrowUp — focusedElement stays null');
        assert.strictEqual($menu.find('.dx-state-focused').length, 0,
            'no .dx-menu-item is highlighted after ArrowUp at nav level');
    });

    QUnit.test('Re-activating dxMenu restores previously focused item (menu remembers position)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(50);

        const $menu = $items.eq(1).find('.dx-menu').first();
        const $menuItems = $menu.find('.dx-menu-item');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        assert.ok($menuItems.eq(1).hasClass('dx-state-focused'),
            'second menu-item (the last focused one) is restored on re-activation');
        assert.notOk($menuItems.eq(0).hasClass('dx-state-focused'),
            'first menu-item is NOT focused (would be a regression to old behavior)');
    });

    QUnit.test('ArrowDown after opening submenu navigates within submenu (does not re-activate root)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        const $menu = $items.eq(1).find('.dx-menu').first();

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowDown');
        this.clock.tick(300);

        const $expandedBefore = $menu.find('.dx-menu-item-expanded');
        assert.strictEqual($expandedBefore.length, 1, 'submenu open on the second root item');
        const expandedElement = $expandedBefore.get(0);

        dispatchKeydown(document.activeElement, 'ArrowDown');
        this.clock.tick(50);

        const $expandedAfter = $menu.find('.dx-menu-item-expanded');
        assert.strictEqual($expandedAfter.length, 1, 'submenu still open after second ArrowDown');
        assert.strictEqual($expandedAfter.get(0), expandedElement,
            'submenu is still on the second root item (not jumped to the first)');
    });
});

QUnit.module('Enter/Exit: dxMenu inside overflow list', moduleConfig, function() {
    const menuItems = [
        { text: 'File', items: [{ text: 'New' }, { text: 'Open' }] },
        { text: 'Edit', items: [{ text: 'Cut' }, { text: 'Copy' }] },
    ];

    function setupOverflowWithMenu($el, clock) {
        const toolbar = $el.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { locateInMenu: 'always', widget: 'dxMenu', options: { items: menuItems } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'After' } },
            ],
        }).dxToolbar('instance');

        const $overflowBtn = $el.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);
        $overflowBtn.trigger('dxclick');
        clock.tick(0);

        const menu = toolbar._layoutStrategy._menu;
        const list = menu._list;
        const $menuListItem = list._getAvailableItems()
            .toArray()
            .map((el) => $(el))
            .find(($i) => $i.find('.dx-menu').length > 0);

        list.option('focusedElement', $menuListItem.get(0));
        list._focusItemWidget($menuListItem);
        clock.tick(0);

        const $menuRoot = $menuListItem.find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        return { list, $menuListItem, $menuRoot, menuInstance };
    }

    QUnit.test('Enter activates dxMenu — focus moves into .dx-menu, first item highlighted', function(assert) {
        const { $menuListItem, $menuRoot, menuInstance } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        assert.ok($menuListItem.get(0).contains(document.activeElement),
            'focus is inside the list item that hosts dxMenu');
        const $firstMenuItem = $menuRoot.find('.dx-menu-item').first();
        assert.ok($firstMenuItem.hasClass('dx-state-focused'),
            'first .dx-menu-item has dx-state-focused after Enter');
        assert.strictEqual($(menuInstance.option('focusedElement')).get(0), $firstMenuItem.get(0),
            'dxMenu focusedElement is on the first item');
    });

    QUnit.test('ArrowDown at list nav level navigates list — does NOT activate dxMenu', function(assert) {
        const { list, $menuListItem, $menuRoot, menuInstance } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown($menuRoot.get(0), 'ArrowDown');
        this.clock.tick(0);

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu is NOT activated by ArrowDown — focusedElement stays null');
        assert.notStrictEqual($(list.option('focusedElement')).get(0), $menuListItem.get(0),
            'list moved focus to the next list item');
    });

    QUnit.test('ArrowUp at list nav level navigates list — does NOT activate dxMenu', function(assert) {
        const { list, $menuListItem, $menuRoot, menuInstance } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown($menuRoot.get(0), 'ArrowUp');
        this.clock.tick(0);

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'dxMenu is NOT activated by ArrowUp — focusedElement stays null');
        assert.notStrictEqual($(list.option('focusedElement')).get(0), $menuListItem.get(0),
            'list moved focus on ArrowUp');
    });

    QUnit.test('ArrowRight inside menu navigates between root items (not list)', function(assert) {
        const { list, $menuListItem, $menuRoot, menuInstance } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(0);

        const $menuItems = $menuRoot.find('.dx-menu-item');
        assert.strictEqual($(menuInstance.option('focusedElement')).get(0), $menuItems.eq(1).get(0),
            'menu focusedElement moved to second root item');
        assert.strictEqual($(list.option('focusedElement')).get(0), $menuListItem.get(0),
            'list focus stays on the dxMenu list item');
    });

    QUnit.test('Escape exits dxMenu — focus returns to list-item wrapper (nav level)', function(assert) {
        const { $menuListItem, $menuRoot } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $menuListItem.get(0),
            'focus returned to the list-item wrapper after Escape');
        assert.strictEqual($menuRoot.find('.dx-state-focused').length, 0,
            'no menu-item is visually focused after exiting to list nav level');
    });

    QUnit.test('Escape with open submenu closes submenu first; second Escape exits to list nav', function(assert) {
        const { $menuListItem, $menuRoot } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowDown');
        this.clock.tick(300);

        assert.ok($menuRoot.find('.dx-menu-item-expanded').length > 0,
            'submenu is open after ArrowDown');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.strictEqual($menuRoot.find('.dx-menu-item-expanded').length, 0,
            'submenu is closed after first Escape');
        assert.ok($menuListItem.get(0).contains(document.activeElement),
            'focus is still inside dxMenu list item after first Escape');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        assert.strictEqual(document.activeElement, $menuListItem.get(0),
            'focus returned to list-item wrapper after second Escape');
        assert.strictEqual($menuRoot.find('.dx-state-focused').length, 0,
            'no menu-item is visually focused after exit');
    });

    QUnit.test('Re-activating dxMenu restores previously focused item', function(assert) {
        const { $menuRoot } = setupOverflowWithMenu(this.$element, this.clock);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'ArrowRight');
        this.clock.tick(50);

        const $menuItems = $menuRoot.find('.dx-menu-item');

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Enter');
        this.clock.tick(50);

        assert.ok($menuItems.eq(1).hasClass('dx-state-focused'),
            'second menu-item (the last focused one) is restored on re-activation');
        assert.notOk($menuItems.eq(0).hasClass('dx-state-focused'),
            'first menu-item is NOT focused (would be a regression)');
    });

    QUnit.test('tabindex=0 is on the list-item wrapper, not on .dx-menu root', function(assert) {
        const { $menuListItem, $menuRoot } = setupOverflowWithMenu(this.$element, this.clock);

        assert.strictEqual($menuListItem.attr('tabindex'), '0',
            'list-item is the Tab stop (tabindex=0)');
        assert.strictEqual($menuRoot.attr('tabindex'), '-1',
            '.dx-menu root is NOT a Tab stop (tabindex=-1)');
    });
});

QUnit.module('Overflow menu: visual focus states', moduleConfig, function() {
    function makeOverflowToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
            ],
        }).dxToolbar('instance');
    }

    const getOverflowBtn = ($el) => $el.find(`.${DROP_DOWN_MENU_BUTTON_CLASS}`);

    QUnit.test('overflow button is focused when navigated to via keyboard', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        toolbar._focusItemWidget($overflowBtn);
        this.clock.tick(0);

        assert.strictEqual(document.activeElement, $overflowBtn.get(0),
            'overflow button is the active element');
    });

    QUnit.test('overflow button retains focus after Escape closes popup', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        toolbar.option('focusedElement', $overflowBtn.get(0));
        toolbar._focusItemWidget($overflowBtn);
        this.clock.tick(0);

        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $firstItem = list._getAvailableItems().first();
        const $focusTarget = getItemFocusTarget($firstItem);
        dispatchKeydown($focusTarget.get(0), 'Escape');
        this.clock.tick(0);

        assert.notOk(menu.option('opened'), 'popup closed after Escape');
        assert.strictEqual(document.activeElement, $overflowBtn.get(0),
            'overflow button retains focus after popup closes');
    });

    QUnit.test('ArrowRight from visible button navigates focus to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $items.eq(0).get(0));
        toolbar._focusItemWidget($items.eq(0));
        this.clock.tick(0);

        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $overflowBtn.get(0),
            'focusedElement is the overflow button');
        assert.strictEqual(document.activeElement, $overflowBtn.get(0),
            'overflow button is focused after navigation');
    });

    QUnit.test('previous button loses dx-state-focused when focus moves to overflow button', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        toolbar._focusItemWidget($items.eq(0));
        this.clock.tick(0);

        const $button = $items.eq(0).find('.dx-button');
        assert.ok($button.hasClass('dx-state-focused'),
            'visible button has dx-state-focused before navigation');

        dispatchKeydown(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.notOk($button.hasClass('dx-state-focused'),
            'visible button lost dx-state-focused after focus moved');
    });

    QUnit.test('overflow list does not set aria-activedescendant on its container when item is focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $listEl = list.$element();

        assert.strictEqual($listEl.attr('aria-activedescendant'), undefined,
            'list container has no aria-activedescendant (roving tabindex owns focus)');
    });

    QUnit.test('overflow list items do not receive a synthetic id attribute when focused', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        menu.openWithFocus('first');
        this.clock.tick(0);

        const list = menu._list;
        const $items = list._getAvailableItems();

        $items.each(function() {
            assert.strictEqual($(this).attr('id'), undefined,
                'list item has no synthetic id (roving tabindex owns focus)');
        });
    });
});


QUnit.module('Arrow navigation — RTL', moduleConfig, function() {
    QUnit.test('ArrowLeft navigates to the visually-right item when rtlEnabled', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { rtlEnabled: true },
        );
        focusItemAt(toolbar, 0);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 1, 'ArrowLeft navigates forward in RTL');
    });

    QUnit.test('ArrowRight navigates to the visually-left item when rtlEnabled', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { rtlEnabled: true },
        );
        focusItemAt(toolbar, 2);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 1, 'ArrowRight navigates backward in RTL');
    });

    QUnit.test('Home/End remain absolute regardless of RTL', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { rtlEnabled: true },
        );
        focusItemAt(toolbar, 1);

        press('Home');
        assertFocusedItemAt(assert, toolbar, 0, 'Home goes to first item in DOM order');

        press('End');
        assertFocusedItemAt(assert, toolbar, 2, 'End goes to last item in DOM order');
    });

    QUnit.test('RTL toggled at runtime flips the arrow semantics', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        press('ArrowRight');
        assertFocusedItemAt(assert, toolbar, 1, 'ArrowRight goes forward in LTR');

        toolbar.option('rtlEnabled', true);
        focusItemAt(toolbar, 0);

        press('ArrowLeft');
        assertFocusedItemAt(assert, toolbar, 1, 'ArrowLeft goes forward after switching to RTL');
    });
});

QUnit.module('Arrow navigation — loopItemFocus', moduleConfig, function() {
    QUnit.test('default loops at the right edge (ArrowRight on last → first)', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 2);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 0, 'ArrowRight at last loops to first');
    });

    QUnit.test('default loops at the left edge (ArrowLeft on first → last)', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 2, 'ArrowLeft at first loops to last');
    });

    QUnit.test('loopItemFocus:false keeps focus on last item when pressing ArrowRight', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { loopItemFocus: false },
        );
        focusItemAt(toolbar, 2);

        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 2, 'ArrowRight at last stays put when loopItemFocus:false');
    });

    QUnit.test('loopItemFocus:false keeps focus on first item when pressing ArrowLeft', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { loopItemFocus: false },
        );
        focusItemAt(toolbar, 0);

        press('ArrowLeft');

        assertFocusedItemAt(assert, toolbar, 0, 'ArrowLeft at first stays put when loopItemFocus:false');
    });

    QUnit.test('Home/End work identically regardless of loopItemFocus', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B'), buttonItem('C')],
            { loopItemFocus: false },
        );
        focusItemAt(toolbar, 1);

        press('End');
        assertFocusedItemAt(assert, toolbar, 2, 'End jumps to last');

        press('Home');
        assertFocusedItemAt(assert, toolbar, 0, 'Home jumps to first');
    });
});

QUnit.module('Item-level tabIndex option', moduleConfig, function() {
    QUnit.test('active item receives custom tabIndex from item.options.tabIndex', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B', { options: { tabIndex: 5 } }),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 1);

        const $items = toolbar._getAvailableItems();
        assertActiveTabIndex(assert, $items.eq(1), 5,
            'item with options.tabIndex=5 keeps that value while active');
    });

    QUnit.test('inactive item with custom tabIndex falls back to -1', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            buttonItem('B', { options: { tabIndex: 5 } }),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 1);

        press('ArrowRight');

        const $items = toolbar._getAvailableItems();
        assertActiveTabIndex(assert, $items.eq(1), -1,
            'previously active item with custom tabIndex returns to -1 when inactive');
        assertActiveTabIndex(assert, $items.eq(2), 0,
            'newly active item gets default tabIndex=0');
    });

    QUnit.test('exactly one tab stop is maintained when using custom item tabIndex', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A', { options: { tabIndex: 3 } }),
            buttonItem('B', { options: { tabIndex: 5 } }),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 0);

        const $tabStops = this.$element.find('[tabindex]:not([tabindex="-1"])').not('.dx-texteditor-input');
        assert.strictEqual($tabStops.length, 1, 'exactly one positive-tabindex stop exists');
    });
});

QUnit.module('Roving tabindex — incremental vs reset paths', moduleConfig, function() {
    QUnit.test('arrow navigation is incremental: unrelated items are not affected', function(assert) {
        // Use 4 items so we can distinguish the two changed items from the untouched ones
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C'), buttonItem('D')]);
        focusItemAt(toolbar, 1); // start on B

        const $items = toolbar._getAvailableItems();

        press('ArrowRight'); // only B and C should change

        assert.strictEqual(parseInt(findFocusTarget($items.eq(0)).attr('tabindex'), 10), -1,
            'A is still -1 (was not re-scanned)');
        assert.strictEqual(parseInt(findFocusTarget($items.eq(1)).attr('tabindex'), 10), -1,
            'B lost tabindex=0');
        assert.strictEqual(parseInt(findFocusTarget($items.eq(2)).attr('tabindex'), 10), 0,
            'C gained tabindex=0');
        assert.strictEqual(parseInt(findFocusTarget($items.eq(3)).attr('tabindex'), 10), -1,
            'D is still -1 (was not re-scanned)');
    });

    QUnit.test('item disabled option change triggers _resetRovingTabIndex (full pass)', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        const resetSpy = sinon.spy(toolbar, '_resetRovingTabIndex');

        const items = toolbar.option('items').slice();
        items[1] = { ...items[1], disabled: true };
        toolbar.option('items', items);
        this.clock.tick(0);

        assert.ok(resetSpy.called, '_resetRovingTabIndex was called after disabled change');

        resetSpy.restore();
    });

    QUnit.test('items option change triggers _resetRovingTabIndex', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B')]);
        focusItemAt(toolbar, 0);

        const resetSpy = sinon.spy(toolbar, '_resetRovingTabIndex');

        toolbar.option('items', [buttonItem('X'), buttonItem('Y'), buttonItem('Z')]);
        this.clock.tick(0);

        assert.ok(resetSpy.called, '_resetRovingTabIndex was called after items option change');

        resetSpy.restore();
    });

    QUnit.test('after _resetRovingTabIndex, exactly one item has tabindex=0', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        toolbar._resetRovingTabIndex();

        assertOneTabStop(assert, this.$element,
            'one tab stop after explicit reset (focused item retains the stop)');
    });

    QUnit.test('ArrowRight: only the previously active and newly active items change tabindex', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        const $items = toolbar._getAvailableItems();
        const initialFirst = parseInt(findFocusTarget($items.eq(0)).attr('tabindex'), 10);

        press('ArrowRight');

        const afterFirst = parseInt(findFocusTarget($items.eq(0)).attr('tabindex'), 10);
        const afterSecond = parseInt(findFocusTarget($items.eq(1)).attr('tabindex'), 10);
        const afterThird = parseInt(findFocusTarget($items.eq(2)).attr('tabindex'), 10);

        assert.strictEqual(initialFirst, 0, 'first started as the tab stop');
        assert.strictEqual(afterFirst, -1, 'first lost the stop');
        assert.strictEqual(afterSecond, 0, 'second became the stop');
        assert.strictEqual(afterThird, -1, 'third remained untouched at -1');
    });
});

QUnit.module('Tab key — toolbar does not intercept', moduleConfig, function() {
    QUnit.test('Tab does not invoke roving navigation', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        const focusBefore = toolbar.option('focusedElement');
        press('Tab');
        this.clock.tick(0);

        assert.strictEqual(toolbar.option('focusedElement'), focusBefore,
            'Tab leaves focusedElement unchanged (browser handles natively)');
    });

    QUnit.test('Shift+Tab does not invoke roving navigation', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        const focusBefore = toolbar.option('focusedElement');
        press('Tab', undefined, { shiftKey: true });
        this.clock.tick(0);

        assert.strictEqual(toolbar.option('focusedElement'), focusBefore,
            'Shift+Tab leaves focusedElement unchanged');
    });
});

QUnit.module('allowKeyboardNavigation — runtime toggle', moduleConfig, function() {
    QUnit.test('toggling false removes the focus-state-enabled marker class', function(assert) {
        const toolbar = createToolbar(
            [buttonItem('A'), buttonItem('B')],
            { allowKeyboardNavigation: true },
        );
        assert.ok(this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'marker class present when allowKeyboardNavigation:true');

        toolbar.option('allowKeyboardNavigation', false);

        assert.notOk(this.$element.hasClass(TOOLBAR_FOCUS_MODE_CLASS),
            'marker class removed after toggling to false');
    });

    QUnit.test('toggling false detaches arrow navigation', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        toolbar.option('allowKeyboardNavigation', false);

        const focusBefore = toolbar.option('focusedElement');
        press('ArrowRight');
        this.clock.tick(0);

        assert.strictEqual(toolbar.option('focusedElement'), focusBefore,
            'ArrowRight is ignored when allowKeyboardNavigation becomes false');
    });

    QUnit.test('toggling back to true re-enables arrow navigation', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        toolbar.option('allowKeyboardNavigation', false);
        toolbar.option('allowKeyboardNavigation', true);

        focusItemAt(toolbar, 0);
        press('ArrowRight');

        assertFocusedItemAt(assert, toolbar, 1, 'navigation works again after re-enabling');
    });

    QUnit.test('toolbar item containers never get dx-state-focused regardless of allowKeyboardNavigation', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B')]);
        focusItemAt(toolbar, 0);
        this.clock.tick(0);

        assert.strictEqual(this.$element.find('.dx-toolbar-item.dx-state-focused').length, 0,
            'item container has no dx-state-focused while focused');
        assert.strictEqual(this.$element.filter('.dx-state-focused').length, 0,
            'toolbar root has no dx-state-focused while focused');

        toolbar.option('allowKeyboardNavigation', false);
        this.clock.tick(0);

        assert.strictEqual(this.$element.find('.dx-toolbar-item.dx-state-focused').length, 0,
            'item container still has no dx-state-focused after allowKeyboardNavigation becomes false');
    });
});

QUnit.module('Item collection updates — navigator stability', moduleConfig, function() {
    QUnit.test('replacing all items after focus does not throw', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        try {
            toolbar.option('items', [buttonItem('X'), buttonItem('Y')]);
            this.clock.tick(0);
            assert.ok(true, 'no error when items replaced after focus');
        } catch(e) {
            assert.notOk(true, `unexpected error: ${e.message}`);
        }
    });

    QUnit.test('extending items keeps a single tab stop', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        toolbar.option('items', [buttonItem('A'), buttonItem('B'), buttonItem('C'), buttonItem('D')]);
        this.clock.tick(0);

        assertOneTabStop(assert, this.$element,
            'one tab stop preserved after items extended');
    });

    QUnit.test('removing focused item leaves a single tab stop on a remaining item', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        toolbar.option('items', [buttonItem('A'), buttonItem('C')]);
        this.clock.tick(0);

        assertOneTabStop(assert, this.$element,
            'one tab stop after focused item removal');
    });

    QUnit.test('emptying items removes all tab stops without throwing', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 0);

        try {
            toolbar.option('items', []);
            this.clock.tick(0);
            const $stops = this.$element.find('[tabindex="0"]').not('.dx-texteditor-input');
            assert.strictEqual($stops.length, 0, 'no tab stops when items list is empty');
        } catch(e) {
            assert.notOk(true, `unexpected error: ${e.message}`);
        }
    });
});

QUnit.module('Escape semantics (consolidated)', moduleConfig, function() {
    QUnit.test('Escape on text-editor input closes editor and keeps focusedElement on item', function(assert) {
        const toolbar = createToolbar([
            buttonItem('A'),
            editorItem('dxTextBox', { value: 'hello', inputAttr: { 'aria-label': 't' } }),
            buttonItem('C'),
        ]);
        focusItemAt(toolbar, 1);
        press('Enter');
        this.clock.tick(50);

        const $items = toolbar._getAvailableItems();
        const $input = findInput($items.eq(1));
        press('Escape', $input.get(0));
        this.clock.tick(50);

        assertFocusedItemAt(assert, toolbar, 1,
            'focusedElement remains on the editor item after Escape');
        assert.notStrictEqual(document.activeElement, $input.get(0),
            'input has lost DOM focus after Escape');
    });

    QUnit.test('Escape on a plain button item is a no-op (no error, focus unchanged)', function(assert) {
        const toolbar = createToolbar([buttonItem('A'), buttonItem('B'), buttonItem('C')]);
        focusItemAt(toolbar, 1);

        try {
            press('Escape');
            this.clock.tick(0);
            assertFocusedItemAt(assert, toolbar, 1, 'focus unchanged on plain item Escape');
        } catch(e) {
            assert.notOk(true, `unexpected error: ${e.message}`);
        }
    });
});

QUnit.module('allowKeyboardNavigation:false — fallback delegation to base', moduleConfig, function() {
    QUnit.test('_supportedKeys preserves base arrow/home/end handlers at allowKeyboardNavigation:false', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [buttonItem('A'), buttonItem('B')],
        }).dxToolbar('instance');

        const keys = toolbar._supportedKeys();
        assert.strictEqual(typeof keys.leftArrow, 'function', 'leftArrow inherited from CollectionWidget');
        assert.strictEqual(typeof keys.rightArrow, 'function', 'rightArrow inherited from CollectionWidget');
        assert.strictEqual(typeof keys.home, 'function', 'home inherited from CollectionWidget');
        assert.strictEqual(typeof keys.end, 'function', 'end inherited from CollectionWidget');
    });

    QUnit.test('_supportedKeys deletes arrow/home/end handlers at allowKeyboardNavigation:true (navigator owns)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [buttonItem('A'), buttonItem('B')],
        }).dxToolbar('instance');

        const keys = toolbar._supportedKeys();
        assert.strictEqual(keys.leftArrow, undefined, 'leftArrow removed (handled by RovingTabIndexNavigator capture)');
        assert.strictEqual(keys.rightArrow, undefined, 'rightArrow removed');
        assert.strictEqual(keys.home, undefined, 'home removed');
        assert.strictEqual(keys.end, undefined, 'end removed');
    });

    QUnit.test('ArrowRight delegates to base CollectionWidget when allowKeyboardNavigation:false (super attachment preserved)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [buttonItem('A'), buttonItem('B')],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(0).get(0));

        dispatchKeydown($items.eq(0).get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowRight moves focus via base CollectionWidget handler (super attachment preserved)');
    });

    QUnit.test('navigator is not created at allowKeyboardNavigation:false', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [buttonItem('A'), buttonItem('B')],
        }).dxToolbar('instance');

        assert.strictEqual(toolbar._navigator, undefined,
            'no RovingTabIndexNavigator instance when allowKeyboardNavigation:false');
    });

    QUnit.test('navigator IS created at allowKeyboardNavigation:true', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: true,
            items: [buttonItem('A'), buttonItem('B')],
        }).dxToolbar('instance');

        assert.ok(toolbar._navigator, 'RovingTabIndexNavigator instance present at allowKeyboardNavigation:true');
    });

    QUnit.test('_moveFocus at allowKeyboardNavigation:false delegates to super and moves focusedElement', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [buttonItem('A'), buttonItem('B'), buttonItem('C')],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(0).get(0));
        toolbar._moveFocus('right');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'super._moveFocus moves focusedElement to next item at allowKeyboardNavigation:false');
    });

    QUnit.test('toolbar.menu.list also delegates _supportedKeys to super at allowKeyboardNavigation:false', function(assert) {
        const toolbar = this.$element.dxToolbar({
            allowKeyboardNavigation: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const keys = menu._list._supportedKeys();
        assert.strictEqual(typeof keys.upArrow, 'function', 'menu list inherits upArrow from ListBase at allowKeyboardNavigation:false');
        assert.strictEqual(typeof keys.downArrow, 'function', 'menu list inherits downArrow from ListBase');
    });
});

QUnit.module('Audit cleanup — utilities and delegation', moduleConfig, function() {
    QUnit.test('isItemDisabled util returns true when widgetDisabled flag is set', function(assert) {
        const toolbar = this.$element.dxToolbar({
            disabled: true,
            items: [buttonItem('A')],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 0,
            'all items filtered out when widget disabled (isItemDisabled returns true)');
    });

    QUnit.test('isItemDisabled util returns true for items with dx-state-disabled class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                buttonItem('A'),
                { widget: 'dxButton', locateInMenu: 'never', disabled: true, options: { text: 'B' } },
                buttonItem('C'),
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();
        assert.strictEqual($available.length, 2,
            'disabled item excluded from available items (isItemDisabled detects dx-state-disabled)');
    });

    QUnit.test('navigator.getAvailableItems delegates to widget._getAvailableItems', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                buttonItem('A'),
                { widget: 'dxButton', locateInMenu: 'never', disabled: true, options: { text: 'B' } },
                buttonItem('C'),
            ],
        }).dxToolbar('instance');

        const navigatorResult = toolbar._navigator.getAvailableItems().toArray();
        const widgetResult = toolbar._getAvailableItems().toArray();

        assert.deepEqual(navigatorResult, widgetResult,
            'navigator returns same set as widget._getAvailableItems (delegation)');
    });

    QUnit.test('menu list navigator.getAvailableItems uses menu-list-specific focus target logic', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', locateInMenu: 'never', options: { text: 'Visible' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu B' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const navigatorResult = menu._list._navigator.getAvailableItems().toArray();
        const listResult = menu._list._getAvailableItems().toArray();

        assert.deepEqual(navigatorResult, listResult,
            'menu list navigator picks up TOOLBAR_MENU_ACTION_CLASS items via widget._getAvailableItems');
        assert.strictEqual(navigatorResult.length, 2, 'both menu action items are available');
    });
});


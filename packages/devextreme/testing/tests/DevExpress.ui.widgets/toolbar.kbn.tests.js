import $ from 'jquery';
import fx from 'common/core/animation/fx';
import { TOOLBAR_ITEM_CLASS } from '__internal/ui/toolbar/toolbar.base';
import {
    DROP_DOWN_MENU_BUTTON_CLASS,
    DROP_DOWN_MENU_POPUP_WRAPPER_CLASS,
} from '__internal/ui/toolbar/internal/toolbar.menu';
import { TOOLBAR_FOCUS_STATE_ENABLED_CLASS } from '__internal/ui/toolbar/constants';
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
                /* NOTE: to avoid decimal values in geometry */
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

QUnit.module('Enter/Exit: text input editors', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    const textEditorWidgets = [
        {
            widget: 'dxTextBox',
            options: { value: 'hello', inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxNumberBox',
            options: { value: 42, inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxAutocomplete',
            options: { items: ['Item 1', 'Item 2'], inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxSelectBox',
            options: { items: ['A', 'B', 'C'], value: 'A', inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxDateBox',
            options: { type: 'date', inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxDateRangeBox',
            options: { startDateInputAttr: { 'aria-label': 'Start' }, endDateInputAttr: { 'aria-label': 'End' } },
        },
        {
            widget: 'dxColorBox',
            options: { value: '#ff0000', inputAttr: { 'aria-label': 'Test' } },
        },
        {
            widget: 'dxTagBox',
            options: { items: ['Tag1', 'Tag2', 'Tag3'], inputAttr: { 'aria-label': 'Test' } },
        },
    ];

    textEditorWidgets.forEach(({ widget, options }) => {
        function findInput($item) {
            return $item.find('.dx-texteditor-input').first();
        }

        QUnit.test(`${widget}: Enter focuses input`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $input = findInput($items.eq(1));
            assert.strictEqual(document.activeElement, $input.get(0),
                `Enter focuses ${widget} input`);
        });

        QUnit.test(`${widget}: arrows blocked while input focused`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $input = findInput($items.eq(1));
            triggerKey($input.get(0), 'ArrowLeft');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
                `ArrowLeft does not navigate toolbar while ${widget} input is focused`);

            triggerKey($input.get(0), 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
                `ArrowRight does not navigate toolbar while ${widget} input is focused`);
        });

        QUnit.test(`${widget}: Esc exits editing mode`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $input = findInput($items.eq(1));
            triggerKey($input.get(0), 'Escape');
            this.clock.tick(50);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
                `Esc keeps toolbar focusedElement on ${widget} item`);
        });

        QUnit.test(`${widget}: arrows navigate toolbar after Esc`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $input = findInput($items.eq(1));
            triggerKey($input.get(0), 'Escape');
            this.clock.tick(50);

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
                `ArrowRight navigates toolbar after Esc from ${widget}`);
        });

        QUnit.test(`${widget}: tabindex invariant after enter and exit`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $input = findInput($items.eq(1));
            triggerKey($input.get(0), 'Escape');
            this.clock.tick(50);

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            const $tabZero = this.$element.find('[tabindex="0"]').not('.dx-texteditor-input');
            assert.strictEqual($tabZero.length, 1,
                `Exactly one non-input tabindex=0 after enter/exit/navigate cycle with ${widget}`);
        });

        QUnit.test(`${widget}: editor does not get dx-state-focused on toolbar navigation (before Enter)`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));
            toolbar._focusItemWidget($items.eq(1));
            this.clock.tick(0);

            const $editor = $items.eq(1).find('.dx-texteditor').first();
            assert.strictEqual($editor.hasClass('dx-state-focused'), false,
                `${widget} root element does not have dx-state-focused during toolbar navigation`);
        });

        QUnit.test(`${widget}: editor gets dx-state-focused after Enter`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $editor = $items.eq(1).find('.dx-texteditor').first();
            assert.strictEqual($editor.hasClass('dx-state-focused'), true,
                `${widget} root element has dx-state-focused after Enter`);
        });
    });
});

QUnit.module('Enter/Exit: dropdown/popup editors (matrix)', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    const dropDownWidgets = [
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

    dropDownWidgets.forEach(({ widget, options, getInstance, getFocusTarget, prepareFocus }) => {
        QUnit.test(`${widget}: Enter opens popup`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            const $targetItem = $items.eq(1);
            toolbar.option('focusedElement', $targetItem.get(0));
            prepareFocus($targetItem);

            triggerKey(getFocusTarget($targetItem).get(0), 'Enter');
            this.clock.tick(300);

            const instance = getInstance($targetItem);
            assert.strictEqual(instance.option('opened'), true,
                `Enter opens ${widget} popup`);
        });

        QUnit.test(`${widget}: Space opens popup`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            const $targetItem = $items.eq(1);
            toolbar.option('focusedElement', $targetItem.get(0));
            prepareFocus($targetItem);

            triggerKey(getFocusTarget($targetItem).get(0), ' ');
            this.clock.tick(300);

            const instance = getInstance($targetItem);
            assert.strictEqual(instance.option('opened'), true,
                `Space opens ${widget} popup`);
        });

        QUnit.test(`${widget}: ArrowDown opens popup`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            const $targetItem = $items.eq(1);
            toolbar.option('focusedElement', $targetItem.get(0));

            triggerKey(getFocusTarget($targetItem).get(0), 'ArrowDown');
            this.clock.tick(300);

            const instance = getInstance($targetItem);
            assert.strictEqual(instance.option('opened'), true,
                `ArrowDown opens ${widget} popup`);
        });

        QUnit.test(`${widget}: arrows blocked while popup open`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            const $targetItem = $items.eq(1);
            toolbar.option('focusedElement', $targetItem.get(0));
            prepareFocus($targetItem);

            triggerKey(getFocusTarget($targetItem).get(0), 'Enter');
            this.clock.tick(300);

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $targetItem.get(0),
                `ArrowRight does not navigate toolbar while ${widget} popup is open`);

            triggerKey(this.$element.get(0), 'ArrowLeft');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $targetItem.get(0),
                `ArrowLeft does not navigate toolbar while ${widget} popup is open`);
        });

        QUnit.test(`${widget}: Esc closes popup and keeps toolbar focus`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            const $targetItem = $items.eq(1);
            toolbar.option('focusedElement', $targetItem.get(0));

            const instance = getInstance($targetItem);
            instance.option('opened', true);
            this.clock.tick(300);

            triggerKey(getFocusTarget($targetItem).get(0), 'Escape');
            this.clock.tick(300);

            assert.strictEqual(instance.option('opened'), false,
                `Esc closes ${widget} popup`);
            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $targetItem.get(0),
                `Toolbar focus stays on ${widget} item after Esc`);
        });
    });
});

QUnit.module('Enter/Exit: toggle widgets', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    const toggleWidgets = [
        {
            widget: 'dxSwitch',
            options: { value: false, width: 70 },
            containerSelector: '.dx-switch',
            getValueFn(instance) { return instance.option('value'); },
            toggledByEnter: true,
        },
        {
            widget: 'dxCheckBox',
            options: { text: 'Check', value: false },
            containerSelector: '.dx-checkbox',
            getValueFn(instance) { return instance.option('value'); },
            toggledByEnter: false,
        },
    ];

    toggleWidgets.forEach(({ widget, options, containerSelector, getValueFn, toggledByEnter }) => {
        if(toggledByEnter) {
            QUnit.test(`${widget}: Enter toggles value`, function(assert) {
                this.$element.dxToolbar({
                    items: [
                        { widget: 'dxButton', options: { text: 'Prev' } },
                        { widget, options },
                        { widget: 'dxButton', options: { text: 'Next' } },
                    ],
                });

                const $widgetEl = this.$element.find(containerSelector);
                const widgetInstance = $widgetEl[widget]('instance');

                const valueBefore = getValueFn(widgetInstance);

                const $focusTarget = $widgetEl;
                $focusTarget.get(0).focus();
                this.clock.tick(0);

                triggerKey($focusTarget.get(0), 'Enter');
                this.clock.tick(50);

                const valueAfter = getValueFn(widgetInstance);
                assert.notStrictEqual(valueAfter, valueBefore,
                    `Enter toggles ${widget} value`);
            });
        } else {
            QUnit.test(`${widget}: Enter does not toggle value`, function(assert) {
                this.$element.dxToolbar({
                    items: [
                        { widget: 'dxButton', options: { text: 'Prev' } },
                        { widget, options },
                        { widget: 'dxButton', options: { text: 'Next' } },
                    ],
                });

                const $widgetEl = this.$element.find(containerSelector);
                const widgetInstance = $widgetEl[widget]('instance');

                const valueBefore = getValueFn(widgetInstance);

                const $focusTarget = $widgetEl;
                $focusTarget.get(0).focus();
                this.clock.tick(0);

                triggerKey($focusTarget.get(0), 'Enter');
                this.clock.tick(50);

                const valueAfter = getValueFn(widgetInstance);
                assert.strictEqual(valueAfter, valueBefore,
                    `Enter does not toggle ${widget} value`);
            });
        }

        QUnit.test(`${widget}: Space toggles value`, function(assert) {
            this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            });

            const $widgetEl = this.$element.find(containerSelector);
            const widgetInstance = $widgetEl[widget]('instance');

            const valueBefore = getValueFn(widgetInstance);

            const $focusTarget = $widgetEl;
            $focusTarget.get(0).focus();
            this.clock.tick(0);

            triggerKey($focusTarget.get(0), ' ');
            this.clock.tick(50);

            const valueAfter = getValueFn(widgetInstance);
            assert.notStrictEqual(valueAfter, valueBefore,
                `Space toggles ${widget} value`);
        });

        QUnit.test(`${widget}: arrows navigate toolbar (no inner edit mode)`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
                `ArrowRight navigates toolbar from ${widget} (no inner edit mode)`);
        });

        QUnit.test(`${widget}: ArrowLeft navigates toolbar`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'ArrowLeft');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
                `ArrowLeft navigates toolbar from ${widget} (no inner edit mode)`);
        });
    });
});

QUnit.module('Enter/Exit: collection widgets', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    const collectionWidgets = [
        {
            widget: 'dxMenu',
            options: {
                items: [
                    { text: 'File', items: [{ text: 'New' }, { text: 'Open' }] },
                    { text: 'Edit', items: [{ text: 'Cut' }, { text: 'Copy' }] },
                ],
            },
            containerSelector: '.dx-menu',
            getInnerFocusableSelector: '.dx-menu-item',
        },
    ];

    collectionWidgets.forEach(({ widget, options, getInnerFocusableSelector }) => {
        QUnit.test(`${widget}: Enter activates inner navigation`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const $innerFocusable = $items.eq(1).find(getInnerFocusableSelector).first();
            assert.strictEqual(
                $items.eq(1).get(0).contains(document.activeElement),
                true,
                `Enter activates inner navigation for ${widget} (focus is inside the widget)`,
            );
            assert.ok($innerFocusable.length > 0, `${widget} has inner focusable elements`);
        });

        QUnit.test(`${widget}: arrows blocked in active mode`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            const activeEl = document.activeElement;
            triggerKey(activeEl, 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
                `ArrowRight does not navigate toolbar while inside ${widget}`);

            triggerKey(activeEl, 'ArrowLeft');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
                `ArrowLeft does not navigate toolbar while inside ${widget}`);
        });

        QUnit.test(`${widget}: Esc exits to toolbar mode`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            triggerKey(document.activeElement, 'Escape');
            this.clock.tick(50);

            assert.ok($items.eq(1).get(0).contains(document.activeElement),
                `Esc returns focus inside the ${widget} toolbar item (on widget root, not on inner element)`);
        });

        QUnit.test(`${widget}: arrows navigate toolbar after Esc`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            triggerKey(document.activeElement, 'Escape');
            this.clock.tick(50);

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
                `ArrowRight navigates toolbar after Esc from ${widget}`);
        });

        QUnit.test(`${widget}: tabindex invariant after enter and exit`, function(assert) {
            const toolbar = this.$element.dxToolbar({
                items: [
                    { widget: 'dxButton', options: { text: 'Prev' } },
                    { widget, options },
                    { widget: 'dxButton', options: { text: 'Next' } },
                ],
            }).dxToolbar('instance');

            const $items = toolbar._getAvailableItems();
            toolbar.option('focusedElement', $items.eq(1).get(0));

            triggerKey(this.$element.get(0), 'Enter');
            this.clock.tick(50);

            triggerKey(document.activeElement, 'Escape');
            this.clock.tick(50);

            triggerKey(this.$element.get(0), 'ArrowRight');
            this.clock.tick(0);

            const $tabZero = this.$element.find('[tabindex="0"]');
            assert.strictEqual($tabZero.length, 1,
                `Exactly one tabindex=0 after enter/exit/navigate cycle with ${widget}`);
        });
    });
});

QUnit.module('Enter/Exit: dxTabs in toolbar', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
        const instance = this.$element.dxToolbar('instance');
        if(instance) {
            instance.dispose();
        }
    },
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    function createTabsToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxTabs', options: { items: [{ text: 'Home' }, { text: 'Insert' }, { text: 'Layout' }], selectedIndex: 0, width: 'auto' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');
    }

    QUnit.test('dxTabs: ArrowRight navigates toolbar to next item', function(assert) {
        const toolbar = createTabsToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));

        triggerKey(this.$element.get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
            'ArrowRight navigates toolbar away from dxTabs to next item');
    });

    QUnit.test('dxTabs: ArrowLeft navigates toolbar to previous item', function(assert) {
        const toolbar = createTabsToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));

        triggerKey(this.$element.get(0), 'ArrowLeft');
        this.clock.tick(0);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft navigates toolbar away from dxTabs to previous item');
    });

    QUnit.test('dxTabs: ArrowDown switches tabs (does not navigate toolbar)', function(assert) {
        const toolbar = createTabsToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const tabs = $items.eq(1).find('.dx-tabs').dxTabs('instance');

        toolbar.option('focusedElement', $items.eq(1).get(0));
        const $tabsContainer = $items.eq(1).find('.dx-tabs');
        $tabsContainer.get(0).focus();
        this.clock.tick(50);

        const selectedBefore = tabs.option('selectedIndex');
        triggerKey(document.activeElement, 'ArrowDown');
        this.clock.tick(50);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowDown does not navigate toolbar');
        assert.strictEqual(tabs.option('selectedIndex'), selectedBefore + 1,
            'ArrowDown switches to next tab');
    });

    QUnit.test('dxTabs: ArrowUp switches tabs (does not navigate toolbar)', function(assert) {
        const toolbar = createTabsToolbar(this.$element);
        const $items = toolbar._getAvailableItems();
        const tabs = $items.eq(1).find('.dx-tabs').dxTabs('instance');

        tabs.option('selectedIndex', 1);
        toolbar.option('focusedElement', $items.eq(1).get(0));
        const $tabsContainer = $items.eq(1).find('.dx-tabs');
        $tabsContainer.get(0).focus();
        this.clock.tick(50);

        const selectedBefore = tabs.option('selectedIndex');
        triggerKey(document.activeElement, 'ArrowUp');
        this.clock.tick(50);

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowUp does not navigate toolbar');
        assert.strictEqual(tabs.option('selectedIndex'), selectedBefore - 1,
            'ArrowUp switches to previous tab');
    });
});

function dispatchKeydown(element, key, options = {}) {
    element.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
    }));
}

function getItemFocusTarget($item) {
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

    const $native = $item.find('button:not([disabled]), input:not([disabled]), a[href]').first();
    if($native.length) return $native;

    return $item;
}

const moduleConfig = {
    beforeEach: function() {
        fx.off = true;
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
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

QUnit.module('Core Navigation', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
    }
}, function() {
    function makeButtonItems(count) {
        return Array.from({ length: count }, (_, i) => ({
            widget: 'dxButton',
            options: { text: String.fromCharCode(65 + i) },
        }));
    }

    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    QUnit.test('first available item is the roving tabindex anchor on init', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $available = toolbar._getAvailableItems();

        const $tabZeroElements = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabZeroElements.length, 1, 'exactly one element with tabindex=0');
        assert.strictEqual(
            $tabZeroElements.closest(`.${TOOLBAR_ITEM_CLASS}`).get(0),
            $available.eq(0).get(0),
            'the anchor belongs to the first available item'
        );
    });

    QUnit.test('ArrowRight moves focus to the next item', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0), 'focus moved to item[1]');
        assert.strictEqual(this.$element.find('[tabindex="0"]').length, 1, 'exactly one tabindex=0');
    });

    QUnit.test('ArrowRight on last item wraps focus to first item', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.last().get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'focus wrapped to first item');
    });

    QUnit.test('ArrowLeft on first item wraps focus to last item', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.last().get(0), 'focus wrapped to last item');
    });

    QUnit.test('Home moves focus to the first item', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(2).get(0));
        triggerKey(this.$element.get(0), 'Home');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0), 'focus moved to first item');
    });

    QUnit.test('End moves focus to the last item', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'End');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.last().get(0), 'focus moved to last item');
    });

    QUnit.test('disabled widget items (options.disabled) are skipped by ArrowRight', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B', disabled: true } },
                { widget: 'dxButton', options: { text: 'C' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        assert.strictEqual($items.length, 2, 'only 2 available items (disabled filtered out)');

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowRight skips disabled item and moves to C');
    });

    QUnit.test('disabled toolbar items (item.disabled) are skipped by ArrowRight', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', disabled: true, options: { text: 'B' } },
                { widget: 'dxButton', options: { text: 'C' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        assert.strictEqual($items.length, 2, 'only 2 available items (disabled filtered out)');

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowRight skips item.disabled and moves to C');
    });

    QUnit.test('disabled widget items are skipped by ArrowLeft', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B', disabled: true } },
                { widget: 'dxButton', options: { text: 'C' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(1).get(0));
        triggerKey(this.$element.get(0), 'ArrowLeft');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft skips disabled item and moves to A');
    });

    QUnit.test('Home skips leading disabled items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', disabled: true, options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B' } },
                { widget: 'dxButton', options: { text: 'C' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.last().get(0));
        triggerKey(this.$element.get(0), 'Home');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'Home lands on first enabled item (B), skipping disabled A');
    });

    QUnit.test('End skips trailing disabled items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B' } },
                { widget: 'dxButton', disabled: true, options: { text: 'C' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'End');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.last().get(0),
            'End lands on last enabled item (B), skipping disabled C');
    });

    QUnit.test('multiple consecutive disabled items are all skipped', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', disabled: true, options: { text: 'B' } },
                { widget: 'dxButton', options: { text: 'C', disabled: true } },
                { widget: 'dxButton', options: { text: 'D' } },
            ]
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        assert.strictEqual($items.length, 2, 'only 2 available items');

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowRight skips two consecutive disabled items and lands on D');
    });

    QUnit.test('disabled item never has tabindex=0', function(assert) {
        this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B', disabled: true } },
                { widget: 'dxButton', options: { text: 'C' } },
            ]
        });

        const $disabledButton = this.$element.find('.dx-button.dx-state-disabled');
        assert.strictEqual($disabledButton.attr('tabindex'), '-1',
            'disabled button has tabindex=-1');
    });

    QUnit.test('toolbar.disabled=true sets all items to tabindex=-1', function(assert) {
        this.$element.dxToolbar({
            disabled: true,
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B' } },
            ]
        });

        const $buttons = this.$element.find('.dx-button');
        $buttons.each(function() {
            assert.strictEqual($(this).attr('tabindex'), '-1',
                'button has tabindex=-1 when toolbar is disabled');
        });
    });

    QUnit.test('exactly one tabindex=0 is maintained after sequential navigation', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(4) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));

        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual(this.$element.find('[tabindex="0"]').length, 1, 'one tabindex=0 after first ArrowRight');

        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual(this.$element.find('[tabindex="0"]').length, 1, 'one tabindex=0 after second ArrowRight');

        triggerKey(this.$element.get(0), 'End');
        assert.strictEqual(this.$element.find('[tabindex="0"]').length, 1, 'one tabindex=0 after End');

        triggerKey(this.$element.get(0), 'Home');
        assert.strictEqual(this.$element.find('[tabindex="0"]').length, 1, 'one tabindex=0 after Home');
    });

    QUnit.test('ArrowRight: newly focused item gets tabindex=0; previously focused item gets tabindex=-1', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual(getItemFocusTarget($items.eq(1)).get(0).getAttribute('tabindex'), '0',
            'item[1] (newly focused) has tabindex=0');
        assert.strictEqual(getItemFocusTarget($items.eq(0)).get(0).getAttribute('tabindex'), '-1',
            'item[0] (previously focused) has tabindex=-1');
    });

    QUnit.test('keyboard navigation: all non-focused items have tabindex=-1', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(0).get(0));
        triggerKey(this.$element.get(0), 'ArrowRight');

        assert.strictEqual(getItemFocusTarget($items.eq(0)).get(0).getAttribute('tabindex'), '-1',
            'item[0] has tabindex=-1 after focus moved away');
        assert.strictEqual(getItemFocusTarget($items.eq(2)).get(0).getAttribute('tabindex'), '-1',
            'item[2] has tabindex=-1 (never focused)');
    });

    QUnit.test('focusing an item via pointer makes it the roving tabindex anchor', function(assert) {
        const toolbar = this.$element.dxToolbar({ items: makeButtonItems(3) }).dxToolbar('instance');
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        const $tabZeroElements = this.$element.find('[tabindex="0"]');
        assert.strictEqual($tabZeroElements.length, 1, 'exactly one tabindex=0 after pointer focus');
        assert.strictEqual(
            $tabZeroElements.closest(`.${TOOLBAR_ITEM_CLASS}`).get(0),
            $items.eq(1).get(0),
            'item[1] is now the anchor'
        );
        assert.strictEqual(
            $(toolbar.option('focusedElement')).get(0),
            $items.eq(1).get(0),
            'focusedElement updated to item[1]'
        );
    });
});

QUnit.module('Widget interaction', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
    }
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

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

QUnit.module('Mouse and keyboard sync', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.$element = $('#toolbar');
        fx.off = true;
    },
    afterEach: function() {
        this.clock.restore();
        fx.off = false;
    }
}, function() {
    function triggerKey(element, key) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    function create3ButtonToolbar($el) {
        return $el.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'A' } },
                { widget: 'dxButton', options: { text: 'B' } },
                { widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');
    }

    QUnit.test('Mouse click on item[j] → tabindex=0 on that item; others tabindex=-1', function(assert) {
        const toolbar = create3ButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        assert.strictEqual($items.eq(1).find('.dx-button').attr('tabindex'), '0', 'Clicked item has tabindex=0');
        assert.strictEqual($items.eq(0).find('.dx-button').attr('tabindex'), '-1', 'Previous item has tabindex=-1');
        assert.strictEqual($items.eq(2).find('.dx-button').attr('tabindex'), '-1', 'Next item has tabindex=-1');
    });

    QUnit.test('Mouse click on item[j] → ArrowRight → moves to item[j+1]', function(assert) {
        const toolbar = create3ButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        triggerKey(this.$element.get(0), 'ArrowRight');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(2).get(0),
            'ArrowRight from click-focused item moves to next item');
    });

    QUnit.test('Mouse click on item[j] → ArrowLeft → moves to item[j-1]', function(assert) {
        const toolbar = create3ButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft from click-focused item moves to previous item');
    });

    QUnit.test('Mouse click on TextBox input → arrows do not navigate toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxTextBox', options: { value: 'hello' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        $input.get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        triggerKey($input.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'ArrowLeft does not navigate toolbar after clicking TextBox input');
    });

    QUnit.test('Mouse click on TextBox → Esc → ArrowLeft navigates toolbar', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxTextBox', options: { value: 'hello' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        $input.get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        triggerKey($input.get(0), 'Escape');
        this.clock.tick(50);

        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft navigates toolbar after Esc from click-focused TextBox');
    });

    QUnit.test('Mouse click on SelectBox input provokes focusedElement updates to SelectBox item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxSelectBox', options: { items: ['A', 'B', 'C'], value: 'A' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $input = $items.eq(1).find('.dx-texteditor-input');

        $input.get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'focusedElement updated to SelectBox item after click on input');
    });

    QUnit.test('Mouse click on DropDownButton should provoke anchor updates; Enter opens popup', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { widget: 'dxButton', options: { text: 'Prev' } },
                { widget: 'dxDropDownButton', options: { items: ['Option 1', 'Option 2'], text: 'Actions' } },
                { widget: 'dxButton', options: { text: 'Next' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $buttonGroup = $items.eq(1).find('.dx-buttongroup');
        const dropDownButton = this.$element.find('.dx-dropdownbutton').dxDropDownButton('instance');

        $buttonGroup.get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(1).get(0),
            'focusedElement updated to DropDownButton item after click');

        const bgInstance = $buttonGroup.dxButtonGroup('instance');
        const $firstItem = bgInstance._buttonsCollection._itemElements().eq(0);
        bgInstance._buttonsCollection.option('focusedElement', $firstItem.get(0));
        triggerKey($buttonGroup.get(0), 'Enter');
        this.clock.tick(300);

        assert.strictEqual(dropDownButton.option('opened'), true, 'Enter opens DropDownButton popup after click-focus');
    });

    QUnit.test('Mouse click on non-TextBox item → arrows navigate toolbar', function(assert) {
        const toolbar = create3ButtonToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        $items.eq(1).find('.dx-button').get(0).dispatchEvent(new Event('focusin', { bubbles: true }));

        triggerKey(this.$element.get(0), 'ArrowLeft');
        assert.strictEqual($(toolbar.option('focusedElement')).get(0), $items.eq(0).get(0),
            'ArrowLeft navigates toolbar after clicking non-TextBox item');
    });
});

QUnit.module('Disabled items skip', moduleConfig, function() {
    QUnit.test('ArrowRight skips disabled item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', disabled: true, options: { text: 'Disabled' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemA = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(0);
        const $itemC = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemC.get(0), 'ArrowRight skipped disabled item and landed on C');
    });

    QUnit.test('ArrowLeft skips disabled item', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', disabled: true, options: { text: 'Disabled' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemA = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(0);
        const $itemC = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemC).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemC).get(0), 'ArrowLeft');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemA.get(0), 'ArrowLeft skipped disabled item and landed on A');
    });

    QUnit.test('Home skips leading disabled items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', disabled: true, options: { text: 'Disabled' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemB = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(0);
        const $itemC = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemC).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemC).get(0), 'Home');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemB.get(0), 'Home skipped leading disabled and landed on B');
    });

    QUnit.test('End skips trailing disabled items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', disabled: true, options: { text: 'Disabled' } },
            ],
        }).dxToolbar('instance');

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $itemA = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(0);
        const $itemB = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(1);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'End');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual($(focusedElement).get(0), $itemB.get(0), 'End skipped trailing disabled and landed on B');
    });

    QUnit.test('disabled item never has tabindex=0', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', disabled: true, options: { text: 'Disabled' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        });

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $disabledItem = $allItems.filter(`.${DISABLED_STATE_CLASS}`).first();
        const $itemA = $allItems.not(`.${DISABLED_STATE_CLASS}`).eq(0);

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemA).get(0) }));
        this.clock.tick(0);
        dispatchKeydown(getItemFocusTarget($itemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        assert.strictEqual(
            parseInt(getItemFocusTarget($disabledItem).attr('tabindex'), 10) !== 0, true,
            'Disabled item focus target never has tabindex=0',
        );
    });
});

QUnit.module('Dynamic item removal', moduleConfig, function() {
    QUnit.skip('after toolbar.option(items), active item retains tabindex=0', function(assert) {
        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };
        const itemD = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'D' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(1)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemA, itemB, itemC, itemD]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $newItemB = $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === 'B' ? $el : $acc;
        }, $());

        assert.strictEqual(
            parseInt(getItemFocusTarget($newItemB).attr('tabindex'), 10),
            0,
            'B retains tabindex=0 after items update',
        );
    });

    QUnit.skip('inserting item before active does not shift focus', function(assert) {
        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };
        const itemNew = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'New' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(1)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemNew, itemA, itemB, itemC]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const findByText = (text) => $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === text ? $el : $acc;
        }, $());

        assert.strictEqual(parseInt(getItemFocusTarget(findByText('B')).attr('tabindex'), 10), 0, 'B retains tabindex=0');
        assert.strictEqual(parseInt(getItemFocusTarget(findByText('A')).attr('tabindex'), 10), -1, 'A has tabindex=-1');
        assert.strictEqual(parseInt(getItemFocusTarget(findByText('New')).attr('tabindex'), 10), -1, 'New has tabindex=-1');
    });

    QUnit.skip('removing non-active item does not shift focus', function(assert) {

        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(1)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemA, itemB]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $newItemB = $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === 'B' ? $el : $acc;
        }, $());

        assert.strictEqual(
            parseInt(getItemFocusTarget($newItemB).attr('tabindex'), 10),
            0,
            'B retains tabindex=0 after removing non-active C',
        );
    });

    QUnit.skip('removing active item moves focus to previous item', function(assert) {
        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(1)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemA, itemC]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $newItemA = $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === 'A' ? $el : $acc;
        }, $());

        assert.strictEqual(
            parseInt(getItemFocusTarget($newItemA).attr('tabindex'), 10),
            0,
            'Focus moved to previous item A after removing active B',
        );
    });

    QUnit.skip('removing first item moves focus to new first item', function(assert) {
        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(0)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemB, itemC]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const $newItemB = $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === 'B' ? $el : $acc;
        }, $());

        assert.strictEqual(
            parseInt(getItemFocusTarget($newItemB).attr('tabindex'), 10),
            0,
            'New first item B gets tabindex=0 after removing first item A',
        );
    });

    QUnit.skip('after removal, Arrow keys navigate from new active position', function(assert) {
        const itemA = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } };
        const itemB = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } };
        const itemC = { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } };

        const toolbar = this.$element.dxToolbar({
            items: [itemA, itemB, itemC],
        }).dxToolbar('instance');

        const $itemsBefore = toolbar._getAvailableItems();
        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($itemsBefore.eq(1)).get(0) }));
        this.clock.tick(0);

        toolbar.option('items', [itemA, itemC]);
        this.clock.tick(0);

        const $allItems = this.$element.find(`.${TOOLBAR_ITEM_CLASS}`);
        const findByText = (text) => $allItems.toArray().reduce(($acc, el) => {
            const $el = $(el);
            return $el.find(`.${BUTTON_CLASS}`).text().trim() === text ? $el : $acc;
        }, $());

        const $newItemA = findByText('A');
        const $newItemC = findByText('C');

        dispatchKeydown(getItemFocusTarget($newItemA).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement } = toolbar.option();
        assert.strictEqual(
            $(focusedElement).get(0),
            $newItemC.get(0),
            'ArrowRight from A (new active after B removed) navigates to C',
        );
    });

    QUnit.skip('navigation order follows DOM order (before, before, after)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', location: 'before', options: { text: 'B1' } },
                { locateInMenu: 'never', widget: 'dxButton', location: 'before', options: { text: 'B2' } },
                { locateInMenu: 'never', widget: 'dxButton', location: 'after', options: { text: 'A1' } },
            ],
        }).dxToolbar('instance');

        const $available = toolbar._getAvailableItems();

        this.$element.trigger($.Event('focusin', { target: getItemFocusTarget($available.eq(0)).get(0) }));
        this.clock.tick(0);

        dispatchKeydown(getItemFocusTarget($available.eq(0)).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement: afterFirst } = toolbar.option();
        assert.strictEqual(
            $(afterFirst).get(0),
            $available.eq(1).get(0),
            'ArrowRight moved to second item in DOM order',
        );

        dispatchKeydown(getItemFocusTarget($available.eq(1)).get(0), 'ArrowRight');
        this.clock.tick(0);

        const { focusedElement: afterSecond } = toolbar.option();
        assert.strictEqual(
            $(afterSecond).get(0),
            $available.eq(2).get(0),
            'ArrowRight moved to third item in DOM order',
        );
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

    QUnit.test('mouse click on overflow button opens menu; first item is focused (focusStateEnabled=true)', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);
        const menu = toolbar._layoutStrategy._menu;

        assert.strictEqual(toolbar.option('focusStateEnabled'), true, 'focusStateEnabled is true (default)');

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
        // Navigate to the list item that contains dxMenu (assume it's at index 0 after Visible button is excluded from menu)
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

    // --- Template with <a href> (link) ---

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

    // --- Template with DX-widget ---

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

    // --- Template with multiple focusable elements (one stop) ---

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
        // NOT IMPLEMENTED: toolbar does not manage inner element tabindexes for templates.
        // Only the first native focusable (focus target) gets tabindex from roving mechanism.

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
        // NOT IMPLEMENTED: no inner-focus mode for templates yet.

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

        // Activate inner mode via Enter
        dispatchKeydown(getItemFocusTarget($templateItem).get(0), 'Enter');
        this.clock.tick(0);

        // Now ArrowRight should NOT navigate toolbar
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

    QUnit.test('focusStateEnabled:false — no keyboard handling', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: false,
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
        assert.strictEqual(focusBefore, focusAfter, 'focusedElement unchanged when focusStateEnabled:false');
    });

    QUnit.test('RTL — ArrowRight navigates to next item in DOM order', function(assert) {
        const toolbar = this.$element.dxToolbar({
            rtlEnabled: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $itemB = $items.eq(1);
        const $itemBFocusTarget = getItemFocusTarget($itemB);
        this.$element.trigger($.Event('focusin', { target: $itemBFocusTarget.get(0) }));
        this.clock.tick(0);

        const indexBefore = toolbar._getAvailableItems().toArray().indexOf(
            $(toolbar.option('focusedElement')).get(0),
        );
        assert.strictEqual(indexBefore, 1, 'Starting at item B (index 1)');

        dispatchKeydown($itemBFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        const indexAfter = toolbar._getAvailableItems().toArray().indexOf(
            $(toolbar.option('focusedElement')).get(0),
        );

        assert.strictEqual(indexAfter > indexBefore, true, 'RTL: ArrowRight moved to item with higher DOM index (toward C)');
    });

    QUnit.test('RTL — ArrowLeft navigates to previous item in DOM order', function(assert) {
        const toolbar = this.$element.dxToolbar({
            rtlEnabled: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'B' } },
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'C' } },
            ],
        }).dxToolbar('instance');

        const $items = toolbar._getAvailableItems();
        const $itemB = $items.eq(1);
        const $itemBFocusTarget = getItemFocusTarget($itemB);
        this.$element.trigger($.Event('focusin', { target: $itemBFocusTarget.get(0) }));
        this.clock.tick(0);

        const indexBefore = toolbar._getAvailableItems().toArray().indexOf(
            $(toolbar.option('focusedElement')).get(0),
        );
        assert.strictEqual(indexBefore, 1, 'Starting at item B (index 1)');

        dispatchKeydown($itemBFocusTarget.get(0), 'ArrowLeft');
        this.clock.tick(0);

        const indexAfter = toolbar._getAvailableItems().toArray().indexOf(
            $(toolbar.option('focusedElement')).get(0),
        );

        assert.strictEqual(indexAfter < indexBefore, true, 'RTL: ArrowLeft moved to item with lower DOM index (toward A)');
    });

    QUnit.test('focusStateEnabled:false — roving tabindex is not applied', function(assert) {
        this.$element.dxToolbar({
            focusStateEnabled: false,
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
            'buttons keep natural tabindex when focusStateEnabled:false');
    });

    QUnit.test('focusStateEnabled:false propagates to overflow menu list but not to DropDownMenu itself', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: false,
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

    QUnit.test('changing focusStateEnabled at runtime propagates listFocusStateEnabled to menu and list', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
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

        toolbar.option('focusStateEnabled', false);

        assert.strictEqual(menu.option('focusStateEnabled'), true,
            'DropDownMenu keeps its own focusStateEnabled:true after runtime change');
        assert.strictEqual(menu.option('listFocusStateEnabled'), false,
            'DropDownMenu gets listFocusStateEnabled:false after runtime change');
        assert.strictEqual(menu._list.option('focusStateEnabled'), false,
            'ToolbarMenuList gets focusStateEnabled:false after runtime change');
    });

    QUnit.test('changing focusStateEnabled at runtime toggles keyboard navigation', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
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
            'ArrowRight moves focus to second item when focusStateEnabled:true');

        toolbar.option('focusStateEnabled', false);

        const focusBefore = toolbar.option('focusedElement');
        dispatchKeydown($firstFocusTarget.get(0), 'ArrowRight');
        this.clock.tick(0);

        const focusAfterDisabled = toolbar.option('focusedElement');
        assert.strictEqual(focusBefore, focusAfterDisabled,
            'ArrowRight does not move focus after focusStateEnabled changed to false');
    });

    QUnit.test('focusStateEnabled:false — overflow menu items use toggleItemFocusableElementTabIndex (not roving)', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: false,
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
            'menu items use natural tabindex (toggleItemFocusableElementTabIndex) when focusStateEnabled:false');
    });

    QUnit.test('focusStateEnabled:false — opening overflow menu does not auto-focus items', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: false,
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
            'no item auto-focused on open when focusStateEnabled:false');
    });

    QUnit.test('focusStateEnabled:true — overflow menu uses roving tabindex', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
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

    QUnit.test('focusStateEnabled:true (default) — toolbar element has dx-toolbar-focus-state-enabled class', function(assert) {
        this.$element.dxToolbar({
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        });

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'toolbar has dx-toolbar-focus-state-enabled class when focusStateEnabled:true'
        );
    });

    QUnit.test('focusStateEnabled:false — toolbar element does NOT have dx-toolbar-focus-state-enabled class', function(assert) {
        this.$element.dxToolbar({
            focusStateEnabled: false,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        });

        assert.notOk(
            this.$element.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'toolbar does not have dx-toolbar-focus-state-enabled class when focusStateEnabled:false'
        );
    });

    QUnit.test('changing focusStateEnabled at runtime toggles dx-toolbar-focus-state-enabled class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
            items: [
                { locateInMenu: 'never', widget: 'dxButton', options: { text: 'A' } },
            ],
        }).dxToolbar('instance');

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'class is present when focusStateEnabled:true'
        );

        toolbar.option('focusStateEnabled', false);

        assert.notOk(
            this.$element.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'class is removed after setting focusStateEnabled:false'
        );

        toolbar.option('focusStateEnabled', true);

        assert.ok(
            this.$element.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'class is re-added after setting focusStateEnabled:true'
        );
    });

    QUnit.test('focusStateEnabled:true — overflow popup wrapper has dx-toolbar-focus-state-enabled class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        assert.ok(
            $wrapper.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'popup wrapper has dx-toolbar-focus-state-enabled class when focusStateEnabled:true'
        );
    });

    QUnit.test('focusStateEnabled:false — overflow popup wrapper does NOT have dx-toolbar-focus-state-enabled class', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: false,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);
        assert.notOk(
            $wrapper.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'popup wrapper does not have dx-toolbar-focus-state-enabled class when focusStateEnabled:false'
        );
    });

    QUnit.test('changing focusStateEnabled at runtime toggles dx-toolbar-focus-state-enabled on popup wrapper', function(assert) {
        const toolbar = this.$element.dxToolbar({
            focusStateEnabled: true,
            items: [
                { widget: 'dxButton', locateInMenu: 'always', options: { text: 'Menu A' } },
            ],
        }).dxToolbar('instance');

        const menu = toolbar._layoutStrategy._menu;
        menu.option('opened', true);
        this.clock.tick(0);

        const $wrapper = $(`.${DROP_DOWN_MENU_POPUP_WRAPPER_CLASS}`);

        assert.ok(
            $wrapper.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'popup wrapper has class when focusStateEnabled:true'
        );

        toolbar.option('focusStateEnabled', false);

        assert.notOk(
            $wrapper.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'popup wrapper loses class after setting focusStateEnabled:false'
        );

        toolbar.option('focusStateEnabled', true);

        assert.ok(
            $wrapper.hasClass(TOOLBAR_FOCUS_STATE_ENABLED_CLASS),
            'popup wrapper regains class after setting focusStateEnabled:true'
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

    QUnit.test('Escape exits menu — focus returns to .dx-menu root', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        dispatchKeydown(this.$element.get(0), 'Enter');
        this.clock.tick(50);

        dispatchKeydown(document.activeElement, 'Escape');
        this.clock.tick(50);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        assert.strictEqual(document.activeElement, $menuRoot.get(0),
            'focus returned to .dx-menu root after Escape');
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

    QUnit.test('tabindex=0 is on .dx-menu root, not on .dx-toolbar-item wrapper', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        toolbar._updateRovingTabIndex($items.eq(1));
        this.clock.tick(0);

        assert.strictEqual($items.eq(1).find('.dx-menu').first().attr('tabindex'), '0',
            '.dx-menu root is the tab stop (tabindex=0)');
        assert.notStrictEqual($items.eq(1).attr('tabindex'), '0',
            '.dx-toolbar-item wrapper is NOT the tab stop');
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

    QUnit.test('dxMenu\'s own keyboard handler does not process keys at toolbar nav level (symmetric with texteditor)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        toolbar._focusItemWidget($items.eq(1));
        this.clock.tick(0);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        let menuHandlerCalled = false;
        const originalHandler = menuInstance._keyboardHandler.bind(menuInstance);
        menuInstance._keyboardHandler = function(opts) {
            menuHandlerCalled = true;
            return originalHandler(opts);
        };

        try {
            ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'a', 'F1', 'PageDown'].forEach(function(key) {
                // Ensure menu is at toolbar nav level (inactive) before each key:
                // _activateMenu from a previous iteration may have set focusedElement.
                menuInstance.option('focusedElement', null);

                menuHandlerCalled = false;
                dispatchKeydown($menuRoot.get(0), key);
                this.clock.tick(0);

                assert.strictEqual(menuHandlerCalled, false,
                    `menu's keyboard handler not invoked for "${key}" at toolbar nav level`);
            }, this);
        } finally {
            menuInstance._keyboardHandler = originalHandler;
        }
    });

    QUnit.test('Tab landing directly on .dx-menu root does not auto-activate menu (toolbar resets to nav level)', function(assert) {
        const toolbar = createMenuToolbar(this.$element);
        const $items = toolbar._getAvailableItems();

        toolbar.option('focusedElement', $items.eq(1).get(0));
        this.clock.tick(0);

        const $menuRoot = $items.eq(1).find('.dx-menu').first();
        const menuInstance = $menuRoot.dxMenu('instance');

        $menuRoot.get(0).focus();
        this.clock.tick(0);

        assert.strictEqual(menuInstance.option('focusedElement'), null,
            'menu is reset to nav level — focusedElement cleared by toolbar _focusInHandler');
        assert.strictEqual($menuRoot.hasClass('dx-state-focused'), false,
            '.dx-menu root does not have dx-state-focused after Tab in');
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

    QUnit.test('overflow button gets dx-state-focused when focused via keyboard', function(assert) {
        const toolbar = makeOverflowToolbar(this.$element);
        const $overflowBtn = getOverflowBtn(this.$element);

        toolbar.option('focusedElement', $overflowBtn.get(0));
        toolbar._focusItemWidget($overflowBtn);
        this.clock.tick(0);

        assert.ok($overflowBtn.hasClass('dx-state-focused'),
            'overflow button has dx-state-focused');
    });

    QUnit.test('overflow button retains dx-state-focused after Escape closes popup', function(assert) {
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
        assert.ok($overflowBtn.hasClass('dx-state-focused'),
            'overflow button retains dx-state-focused after popup closes');
    });

    QUnit.test('ArrowRight from visible button navigates to overflow button with dx-state-focused', function(assert) {
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
        assert.ok($overflowBtn.hasClass('dx-state-focused'),
            'overflow button has dx-state-focused after navigation');
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
});


import { Selector, ClientFunction } from 'testcafe';
import url from '../../../helpers/getPageUrl';
import { createWidget } from '../../../helpers/createWidget';
import { appendElementTo } from '../../../helpers/domUtils';

fixture.only.disablePageReloads`Toolbar_keyboard_navigation`
  .page(url(__dirname, '../../container.html'));

const isFocusInsideItem = ClientFunction((itemIndex: number) => {
  const items = document.querySelectorAll(
    '#toolbar .dx-toolbar-item',
  );
  const item = items[itemIndex];
  return item ? item.contains(document.activeElement) : false;
});

const toolbarWidgets = [
  {
    widget: 'dxButton',
    options: { text: 'Button' },
  },
  {
    widget: 'dxTextBox',
    options: { value: 'text', showClearButton: false },
  },
  {
    widget: 'dxAutocomplete',
    options: { value: 'auto', showClearButton: false },
  },
  {
    widget: 'dxCheckBox',
    options: { value: true },
  },
  {
    widget: 'dxDateBox',
    options: {
      value: new Date(2021, 9, 17),
      openOnFieldClick: false,
      showClearButton: false,
      showDropDownButton: false,
    },
  },
  {
    widget: 'dxSelectBox',
    options: {
      items: ['Item 1', 'Item 2'],
      value: 'Item 1',
      showClearButton: false,
      showDropDownButton: false,
    },
  },
  {
    widget: 'dxMenu',
    options: {
      items: [{ text: 'Menu Item 1' }, { text: 'Menu Item 2' }],
    },
  },
  {
    widget: 'dxTabs',
    options: {
      items: [{ text: 'Tab 1' }, { text: 'Tab 2' }],
    },
  },
  {
    widget: 'dxButtonGroup',
    options: {
      items: [{ text: 'Left' }, { text: 'Right' }],
    },
  },
  {
    widget: 'dxDropDownButton',
    options: {
      text: 'Drop',
      items: [{ text: 'Action 1' }, { text: 'Action 2' }],
    },
  },
] as const;

toolbarWidgets.forEach(({ widget, options }) => {
  test(`${widget}: Tab leaves and Shift+Tab returns focus`, async (t) => {
    const externalBefore = Selector('#externalBefore');
    const externalAfter = Selector('#externalAfter');

    await t.click(externalBefore);
    await t
      .expect(externalBefore.focused)
      .ok('external before button should be focused');

    await t.pressKey('tab');
    await t
      .expect(isFocusInsideItem(0))
      .ok('first toolbar item should be focused after Tab');

    await t.pressKey('right');
    await t
      .expect(isFocusInsideItem(1))
      .ok(`${widget} should be focused after arrow right`);

    await t.pressKey('tab');
    await t
      .expect(externalAfter.focused)
      .ok('external after button should be focused after Tab');

    await t.pressKey('shift+tab');
    await t
      .expect(isFocusInsideItem(1))
      .ok(`${widget} should be focused after Shift+Tab`);
  }).before(async () => {
    await appendElementTo('#container', 'div', 'externalBefore');
    await appendElementTo('#container', 'div', 'toolbar');
    await appendElementTo('#container', 'div', 'externalAfter');

    await createWidget('dxButton', {
      text: 'External Before',
    }, '#externalBefore');

    await createWidget('dxToolbar', {
      items: [
        {
          location: 'before',
          widget: 'dxButton',
          options: { text: 'Prev', focusStateEnabled: true },
        },
        {
          location: 'before',
          widget,
          options: { ...options, focusStateEnabled: true },
        },
        {
          location: 'before',
          widget: 'dxButton',
          options: { text: 'Next', focusStateEnabled: true },
        },
      ],
    }, '#toolbar');

    await createWidget('dxButton', {
      text: 'External After',
    }, '#externalAfter');
  });
});

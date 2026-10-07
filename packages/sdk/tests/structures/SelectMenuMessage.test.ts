import { SelectMenuMessage, InteractionMessageList } from '../../src/structures/SelectMenuMessage';

describe('SelectMenuMessage', () => {
  describe('InteractionMessageList class', () => {
    it('should create a list with title', () => {
      const list = new InteractionMessageList('Options');

      expect(list.title).toBe('Options');
      expect(list.rows).toEqual([]);
    });

    it('should add a single row', () => {
      const list = new InteractionMessageList('Options');
      const result = list.addRow('opt1', 'Option 1', 'First option');

      expect(result).toBe(list); // Should return this for chaining
      expect(list.rows).toHaveLength(1);
      expect(list.rows[0]).toEqual({
        id: 'opt1',
        title: 'Option 1',
        description: 'First option',
      });
    });

    it('should add multiple rows via addRow', () => {
      const list = new InteractionMessageList('Options')
        .addRow('opt1', 'Option 1', 'First option')
        .addRow('opt2', 'Option 2', 'Second option');

      expect(list.rows).toHaveLength(2);
      expect(list.rows[0]?.id).toBe('opt1');
      expect(list.rows[1]?.id).toBe('opt2');
    });

    it('should add multiple rows via addRows', () => {
      const list = new InteractionMessageList('Options');
      const rows = [
        { id: 'opt1', title: 'Option 1', description: 'First option' },
        { id: 'opt2', title: 'Option 2', description: 'Second option' },
      ];

      const result = list.addRows(rows);

      expect(result).toBe(list); // Should return this for chaining
      expect(list.rows).toHaveLength(2);
      expect(list.rows).toEqual(rows);
    });

    it('should combine addRow and addRows', () => {
      const list = new InteractionMessageList('Options')
        .addRow('manual', 'Manual Row', 'Added manually')
        .addRows([
          { id: 'batch1', title: 'Batch 1', description: 'Added in batch' },
          { id: 'batch2', title: 'Batch 2', description: 'Also in batch' },
        ]);

      expect(list.rows).toHaveLength(3);
      expect(list.rows[0]?.id).toBe('manual');
      expect(list.rows[1]?.id).toBe('batch1');
      expect(list.rows[2]?.id).toBe('batch2');
    });

    it('should return correct JSON structure', () => {
      const list = new InteractionMessageList('Test Options')
        .addRow('test1', 'Test 1', 'First test')
        .addRow('test2', 'Test 2', 'Second test');

      expect(list.toJSON()).toEqual({
        title: 'Test Options',
        rows: [
          { id: 'test1', title: 'Test 1', description: 'First test' },
          { id: 'test2', title: 'Test 2', description: 'Second test' },
        ],
      });
    });
  });

  describe('constructor', () => {
    it('should create a select menu message with default type', () => {
      const message = new SelectMenuMessage();

      expect(message.type).toBe('interactive');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.type).toBe('list');
    });

    it('should create a select menu message with text', () => {
      const message = new SelectMenuMessage({
        text: 'Please select an option',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Please select an option');
    });

    it('should create a select menu message with list and placeholder', () => {
      const list = new InteractionMessageList('Options').addRow('opt1', 'Option 1', 'First option');

      const message = new SelectMenuMessage({
        text: 'Choose wisely',
        list: list,
        placeholder: 'Select option...',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Choose wisely');
      expect(json.interactive.action.button).toBe('Select option...');
      expect(json.interactive.action.sections).toHaveLength(1);
      expect(json.interactive.action.sections[0].title).toBe('Options');
    });

    it('should use empty string as default placeholder', () => {
      const list = new InteractionMessageList('Options');

      const message = new SelectMenuMessage({
        list: list,
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.button).toBe('');
    });
  });

  describe('setSelectMenu', () => {
    it('should set select menu with list and placeholder', () => {
      const message = new SelectMenuMessage();
      const list = new InteractionMessageList('Categories')
        .addRow('cat1', 'Category 1', 'First category')
        .addRow('cat2', 'Category 2', 'Second category');

      const result = message.setSelectMenu(list, 'Choose category...');

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.button).toBe('Choose category...');
      expect(json.interactive.action.sections).toHaveLength(1);
      expect(json.interactive.action.sections[0]).toEqual({
        title: 'Categories',
        rows: [
          { id: 'cat1', title: 'Category 1', description: 'First category' },
          { id: 'cat2', title: 'Category 2', description: 'Second category' },
        ],
      });
    });

    it('should handle empty list', () => {
      const message = new SelectMenuMessage();
      const list = new InteractionMessageList('Empty List');

      message.setSelectMenu(list, 'No options available');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.sections[0].rows).toHaveLength(0);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const list = new InteractionMessageList('Actions')
        .addRow('action1', 'Action 1', 'First action')
        .addRow('action2', 'Action 2', 'Second action');

      const message = new SelectMenuMessage()
        .setText('What would you like to do?')
        .setSelectMenu(list, 'Select an action...')
        .setFooter('Choose carefully')
        .setHeader('text', 'Action Menu');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.text).toBe('Action Menu');
      expect(json.interactive.body.text).toBe('What would you like to do?');
      expect(json.interactive.footer.text).toBe('Choose carefully');
      expect(json.interactive.action.button).toBe('Select an action...');
    });
  });

  describe('inherited methods from InteractionMessage', () => {
    it('should support setText method', () => {
      const message = new SelectMenuMessage();

      message.setText('Updated menu text');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Updated menu text');
    });

    it('should support setFooter method', () => {
      const message = new SelectMenuMessage();

      message.setFooter('Menu footer');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('Menu footer');
    });

    it('should support setHeader with text', () => {
      const message = new SelectMenuMessage();

      message.setHeader('text', 'Menu Header');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('text');
      expect(json.interactive.header.text).toBe('Menu Header');
    });

    it('should support setHeader with media', () => {
      const message = new SelectMenuMessage();

      message.setHeader('video', 'https://example.com/video.mp4');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('video');
      expect(json.interactive.header.video.link).toBe('https://example.com/video.mp4');
    });
  });

  describe('toJSON', () => {
    it('should serialize to the expected payload', () => {
      const list = new InteractionMessageList('Test Options').addRow(
        'test1',
        'Test Option 1',
        'First test option',
      );

      const message = new SelectMenuMessage({
        text: 'Test menu',
        list: list,
        placeholder: 'Select test...',
      });

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: 'Test menu',
          },
          action: {
            button: 'Select test...',
            sections: [
              {
                title: 'Test Options',
                rows: [
                  {
                    id: 'test1',
                    title: 'Test Option 1',
                    description: 'First test option',
                  },
                ],
              },
            ],
          },
        },
      });
    });

    it('should handle complete select menu with all properties', () => {
      const list = new InteractionMessageList('Complete Options')
        .addRow('opt1', 'Option 1', 'Description 1')
        .addRow('opt2', 'Option 2', 'Description 2');

      const message = new SelectMenuMessage({
        text: 'Main menu text',
        list: list,
        placeholder: 'Choose...',
      })
        .setHeader('text', 'Menu Header')
        .setFooter('Menu Footer');

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.interactive.header.text).toBe('Menu Header');
      expect(parsed.interactive.body.text).toBe('Main menu text');
      expect(parsed.interactive.footer.text).toBe('Menu Footer');
      expect(parsed.interactive.action.button).toBe('Choose...');
      expect(parsed.interactive.action.sections[0].rows).toHaveLength(2);
    });
  });
});

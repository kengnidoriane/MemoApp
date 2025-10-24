import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#111827',
        },
      ],
    },
    docs: {
      theme: {
        base: 'light',
        brandTitle: 'MemoApp Design System',
        brandUrl: '/',
      },
    },
  },
  globalTypes: {
    darkMode: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const { darkMode } = context.globals;
      
      // Apply dark mode class to the story container
      if (darkMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return (
        <div className={darkMode === 'dark' ? 'dark' : ''}>
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-4">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
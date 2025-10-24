import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600 dark:text-gray-300">
          This is a basic card with some content inside it.
        </p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
        <p className="text-gray-600 dark:text-gray-300">
          This card has an elevated shadow for more prominence.
        </p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Outlined Card</h3>
        <p className="text-gray-600 dark:text-gray-300">
          This card has a thicker border instead of a shadow.
        </p>
      </div>
    ),
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Hoverable Card</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Hover over this card to see the animation effect.
        </p>
      </div>
    ),
  },
};

export const WithSubComponents: Story = {
  args: {
    padding: 'none',
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Update</CardTitle>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The project is progressing well. We've completed the initial setup
            and are now working on the core features.
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Last updated: 2 hours ago</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex space-x-2">
            <Button size="sm">View Details</Button>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const MemoCard: Story = {
  args: {
    hover: true,
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle as="h4">JavaScript Closures</CardTitle>
            <Badge variant="info">Programming</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            A closure is a function that has access to variables in its outer scope
            even after the outer function has returned...
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge size="sm" variant="default">javascript</Badge>
            <Badge size="sm" variant="default">functions</Badge>
            <Badge size="sm" variant="default">scope</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full text-sm text-gray-500">
            <span>Created 3 days ago</span>
            <span>Next review: Tomorrow</span>
          </div>
        </CardFooter>
      </>
    ),
  },
};
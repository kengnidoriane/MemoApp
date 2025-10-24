import type { Meta, StoryObj } from '@storybook/react';
import { Typography, Heading, Text } from '../components/ui/Typography';

const meta: Meta<typeof Typography> = {
  title: 'UI/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'body-large', 'body-small', 'caption', 'overline'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'inherit'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllHeadings: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h1">Heading 1 - Main Page Title</Typography>
      <Typography variant="h2">Heading 2 - Section Title</Typography>
      <Typography variant="h3">Heading 3 - Subsection Title</Typography>
      <Typography variant="h4">Heading 4 - Card Title</Typography>
      <Typography variant="h5">Heading 5 - Small Title</Typography>
      <Typography variant="h6">Heading 6 - Smallest Title</Typography>
    </div>
  ),
};

export const BodyText: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Typography variant="body-large">
        This is large body text. It's used for important content that needs more emphasis
        than regular body text but isn't quite a heading.
      </Typography>
      <Typography variant="body">
        This is regular body text. It's the most common text variant used throughout
        the application for paragraphs and general content.
      </Typography>
      <Typography variant="body-small">
        This is small body text. It's used for less important information,
        captions, or when space is limited.
      </Typography>
    </div>
  ),
};

export const SpecialText: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="caption">
        This is caption text - used for image captions, form help text, etc.
      </Typography>
      <Typography variant="overline">
        This is overline text - used for labels and categories
      </Typography>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-2">
      <Typography color="primary">Primary text color</Typography>
      <Typography color="secondary">Secondary text color</Typography>
      <Typography color="success">Success text color</Typography>
      <Typography color="warning">Warning text color</Typography>
      <Typography color="error">Error text color</Typography>
      <Typography color="info">Info text color</Typography>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div className="space-y-2">
      <Typography weight="light">Light weight text</Typography>
      <Typography weight="normal">Normal weight text</Typography>
      <Typography weight="medium">Medium weight text</Typography>
      <Typography weight="semibold">Semibold weight text</Typography>
      <Typography weight="bold">Bold weight text</Typography>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Typography align="left">Left aligned text</Typography>
      <Typography align="center">Center aligned text</Typography>
      <Typography align="right">Right aligned text</Typography>
      <Typography align="justify">
        Justified text that spreads across the full width of the container
        and aligns to both left and right margins.
      </Typography>
    </div>
  ),
};

export const ConvenienceComponents: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1}>Heading Component (Level 1)</Heading>
      <Heading level={2} color="info">Heading Component (Level 2, Info Color)</Heading>
      <Text size="large">Large text component</Text>
      <Text>Regular text component</Text>
      <Text size="small" color="secondary">Small secondary text component</Text>
    </div>
  ),
};
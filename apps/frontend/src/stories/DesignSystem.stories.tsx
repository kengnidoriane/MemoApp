import type { Meta, StoryObj } from '@storybook/react';
import { 
  Button, 
  Card, 
  CardContent, 
  Badge, 
  Typography,
  Input,
  Switch,
  Avatar,
  Checkbox,
  Spinner,
  Skeleton
} from '../components/ui';

const meta: Meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorPalette: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Typography variant="h1">MemoApp Design System</Typography>
      
      <div>
        <Typography variant="h2" className="mb-4">Color Palette</Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Primary (Learning & Focus)</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded border"></div>
                  <span className="text-sm">primary-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500 rounded border"></div>
                  <span className="text-sm font-medium">primary-500 (Main)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-800 rounded border"></div>
                  <span className="text-sm">primary-800</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Success</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success-100 rounded border"></div>
                  <span className="text-sm">success-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success-500 rounded border"></div>
                  <span className="text-sm font-medium">success-500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success-800 rounded border"></div>
                  <span className="text-sm">success-800</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Warning</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-warning-100 rounded border"></div>
                  <span className="text-sm">warning-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-warning-500 rounded border"></div>
                  <span className="text-sm font-medium">warning-500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-warning-800 rounded border"></div>
                  <span className="text-sm">warning-800</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Error</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-error-100 rounded border"></div>
                  <span className="text-sm">error-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-error-500 rounded border"></div>
                  <span className="text-sm font-medium">error-500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-error-800 rounded border"></div>
                  <span className="text-sm">error-800</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Info</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-info-100 rounded border"></div>
                  <span className="text-sm">info-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-info-500 rounded border"></div>
                  <span className="text-sm font-medium">info-500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-info-800 rounded border"></div>
                  <span className="text-sm">info-800</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gray Colors */}
          <Card>
            <CardContent>
              <Typography variant="h4" className="mb-4">Neutral</Typography>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded border"></div>
                  <span className="text-sm">gray-100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded border"></div>
                  <span className="text-sm">gray-500</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-900 rounded border"></div>
                  <span className="text-sm text-white">gray-900</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const ComponentShowcase: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Typography variant="h2">Component Showcase</Typography>
      
      {/* Buttons */}
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Buttons</Typography>
          <div className="space-y-4">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Variants</Typography>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Sizes</Typography>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">States</Typography>
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }>With Icon</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Badges</Typography>
          <div className="space-y-3">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Variants</Typography>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Sizes</Typography>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Form Elements</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <Input label="Email" type="email" placeholder="Enter your email" />
            <Input 
              label="Password" 
              type="password" 
              placeholder="Enter password"
              helperText="Must be at least 8 characters"
            />
            <Input 
              label="Search" 
              placeholder="Search memos..."
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Input 
              label="Error State" 
              placeholder="Invalid input"
              error="This field is required"
              value="invalid@"
            />
            <div className="md:col-span-2">
              <Switch label="Enable notifications" description="Receive reminders for your memos" />
            </div>
            <div className="md:col-span-2">
              <Checkbox label="I agree to the terms and conditions" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatars */}
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Avatars</Typography>
          <div className="space-y-4">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Sizes</Typography>
              <div className="flex items-center space-x-4">
                <Avatar size="xs" fallback="XS" />
                <Avatar size="sm" fallback="SM" />
                <Avatar size="md" fallback="MD" />
                <Avatar size="lg" fallback="LG" />
                <Avatar size="xl" fallback="XL" />
                <Avatar size="2xl" fallback="2XL" />
              </div>
            </div>
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">With Images</Typography>
              <div className="flex items-center space-x-4">
                <Avatar 
                  size="md" 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" 
                  alt="User avatar"
                  fallback="JD" 
                />
                <Avatar 
                  size="md" 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" 
                  alt="User avatar"
                  fallback="AS" 
                />
                <Avatar size="md" fallback="No Image" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Loading States</Typography>
          <div className="space-y-4">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Spinners</Typography>
              <div className="flex items-center space-x-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </div>
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Skeletons</Typography>
              <div className="space-y-3 max-w-md">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const TypographyScale: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <Typography variant="h2">Typography Scale</Typography>
      
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Typography variant="h1">Heading 1 - 36px</Typography>
              <Typography variant="body-small" color="secondary">Used for main page titles</Typography>
            </div>
            <div>
              <Typography variant="h2">Heading 2 - 30px</Typography>
              <Typography variant="body-small" color="secondary">Used for section headers</Typography>
            </div>
            <div>
              <Typography variant="h3">Heading 3 - 24px</Typography>
              <Typography variant="body-small" color="secondary">Used for subsection titles</Typography>
            </div>
            <div>
              <Typography variant="h4">Heading 4 - 20px</Typography>
              <Typography variant="body-small" color="secondary">Used for card titles</Typography>
            </div>
            <div>
              <Typography variant="body-large">Body Large - 18px</Typography>
              <Typography variant="body-small" color="secondary">Used for important content</Typography>
            </div>
            <div>
              <Typography variant="body">Body - 16px</Typography>
              <Typography variant="body-small" color="secondary">Default text size</Typography>
            </div>
            <div>
              <Typography variant="body-small">Body Small - 14px</Typography>
              <Typography variant="body-small" color="secondary">Used for captions and metadata</Typography>
            </div>
            <div>
              <Typography variant="caption">Caption - 12px</Typography>
              <Typography variant="body-small" color="secondary">Used for form help text</Typography>
            </div>
            <div>
              <Typography variant="overline">OVERLINE - 12px</Typography>
              <Typography variant="body-small" color="secondary">Used for labels and categories</Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const SpacingAndLayout: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Typography variant="h2">Spacing & Layout</Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Spacing Scale (8px grid)</Typography>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-primary-500"></div>
              <Typography variant="body-small">xs: 4px</Typography>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-8 bg-primary-500"></div>
              <Typography variant="body-small">sm: 8px</Typography>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-8 bg-primary-500"></div>
              <Typography variant="body-small">md: 16px</Typography>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-8 bg-primary-500"></div>
              <Typography variant="body-small">lg: 24px</Typography>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary-500"></div>
              <Typography variant="body-small">xl: 32px</Typography>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-primary-500"></div>
              <Typography variant="body-small">2xl: 48px</Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Border Radius</Typography>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 border-2 border-primary-300 rounded-none mx-auto mb-2"></div>
              <Typography variant="body-small">none</Typography>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 border-2 border-primary-300 rounded-sm mx-auto mb-2"></div>
              <Typography variant="body-small">sm: 2px</Typography>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 border-2 border-primary-300 rounded mx-auto mb-2"></div>
              <Typography variant="body-small">base: 4px</Typography>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 border-2 border-primary-300 rounded-lg mx-auto mb-2"></div>
              <Typography variant="body-small">lg: 8px</Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Shadows</Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 shadow-sm rounded-lg mx-auto mb-2"></div>
              <Typography variant="body-small">shadow-sm</Typography>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 shadow-md rounded-lg mx-auto mb-2"></div>
              <Typography variant="body-small">shadow-md</Typography>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg mx-auto mb-2"></div>
              <Typography variant="body-small">shadow-lg</Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const AnimationsAndMotion: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Typography variant="h2">Animations & Motion</Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Micro-interactions</Typography>
          <div className="space-y-6">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-3">Button Interactions</Typography>
              <div className="flex space-x-4">
                <Button variant="primary">Hover & Click Me</Button>
                <Button variant="outline">Hover & Click Me</Button>
              </div>
              <Typography variant="caption" color="secondary" className="mt-2 block">
                Buttons scale slightly on hover and press for tactile feedback
              </Typography>
            </div>
            
            <div>
              <Typography variant="body-small" color="secondary" className="mb-3">Card Interactions</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                <Card hover>
                  <CardContent>
                    <Typography variant="h4">Hoverable Card</Typography>
                    <Typography variant="body-small" color="secondary">
                      Hover to see lift animation
                    </Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Typography variant="h4">Static Card</Typography>
                    <Typography variant="body-small" color="secondary">
                      No hover effects
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <Typography variant="body-small" color="secondary" className="mb-3">Form Interactions</Typography>
              <div className="max-w-md space-y-4">
                <Input 
                  label="Focus Animation" 
                  placeholder="Click to focus and see scale effect"
                />
                <Input 
                  label="Error Animation" 
                  placeholder="Error state with animation"
                  error="This field has an error"
                />
              </div>
              <Typography variant="caption" color="secondary" className="mt-2 block">
                Form elements have subtle scale and color transitions
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3" className="mb-4">Loading Animations</Typography>
          <div className="space-y-4">
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Spinners</Typography>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <Spinner size="sm" />
                  <Typography variant="caption" className="mt-1 block">Small</Typography>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <Typography variant="caption" className="mt-1 block">Medium</Typography>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <Typography variant="caption" className="mt-1 block">Large</Typography>
                </div>
              </div>
            </div>
            
            <div>
              <Typography variant="body-small" color="secondary" className="mb-2">Button Loading States</Typography>
              <div className="flex space-x-4">
                <Button isLoading>Loading...</Button>
                <Button variant="outline" isLoading>Processing</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
];

export const SkipLinks = ({ links = defaultLinks, className }: SkipLinksProps) => {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      <nav aria-label="Skip links">
        <ul className="flex space-x-2 p-2 bg-primary-600 text-white">
          {links.map((link, index) => (
            <li key={link.href}>
              <motion.a
                href={link.href}
                data-skip-link
                className={cn(
                  'inline-block px-3 py-2 text-sm font-medium rounded-md',
                  'bg-primary-700 hover:bg-primary-800',
                  'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600',
                  'transition-colors duration-200'
                )}
                whileFocus={{ scale: 1.05 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {link.label}
              </motion.a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
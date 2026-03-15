import React, {useState, useRef, useEffect, type ReactNode} from 'react';
import clsx from 'clsx';
import {useLocalPathname} from '@docusaurus/theme-common/internal';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem, {type LinkLikeNavbarItemProps} from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem/Desktop';
import { setPreferredFramework, getFrameworkFromPath } from '@site/src/utils/frameworkPreference';

function isFrameworkPicker(items: readonly LinkLikeNavbarItemProps[]): boolean {
  // Check if all items point to framework-specific docs
  const frameworkPaths = ['/docs/angular', '/docs/react', '/docs/vue'];
  return items.every((item) => 
    frameworkPaths.some((path) => item.to?.includes(path) || item.activeBasePath?.includes(path))
  );
}

function isFeaturesDropdown(items: readonly LinkLikeNavbarItemProps[]): boolean {
  // Check if items point to feature pages
  const featurePaths = ['/features/infinite-canvas', '/features/framework-agnostic', '/features/real-time-collaboration', '/features/drawing-tools'];
  return items.some((item) => 
    featurePaths.some((path) => item.to?.includes(path))
  );
}

export default function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  onClick,
  ...props
}: Props): ReactNode {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const localPathname = useLocalPathname();

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent | TouchEvent | FocusEvent,
    ) => {
      if (
        !dropdownRef.current ||
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('focusin', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [dropdownRef]);

  // Hide framework picker dropdown when not on docs pages
  const isOnDocsPage = localPathname.includes('/docs');
  if (isFrameworkPicker(items) && !isOnDocsPage) {
    return null;
  }

  // Hide Features dropdown when on docs pages
  if (isFeaturesDropdown(items) && isOnDocsPage) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={clsx('navbar__item', 'dropdown', 'dropdown--hoverable', {
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}>
      <NavbarNavLink
        aria-haspopup="true"
        aria-expanded={showDropdown}
        role="button"
        // # hash permits to make the <a> tag focusable in case no link target
        // See https://github.com/facebook/docusaurus/pull/6003
        // There's probably a better solution though...
        href={props.to ? undefined : '#'}
        className={clsx('navbar__link', className)}
        {...props}
        onClick={props.to ? undefined : (e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}>
        {props.children ?? props.label}
      </NavbarNavLink>
      <ul className="dropdown__menu">
        {items.map((childItemProps, i) => {
          const isFramework = isFrameworkPicker(items);
          const handleClick = isFramework ? () => {
            const framework = getFrameworkFromPath(childItemProps.to || '');
            if (framework) {
              setPreferredFramework(framework);
            }
          } : undefined;
          
          return (
            <NavbarItem
              isDropdownItem
              activeClassName="dropdown__link--active"
              {...childItemProps}
              onClick={handleClick}
              key={i}
            />
          );
        })}
      </ul>
    </div>
  );
}

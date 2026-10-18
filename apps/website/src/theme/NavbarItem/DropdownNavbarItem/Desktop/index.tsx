import React, {useState, useRef, useEffect, type ReactNode} from 'react';
import clsx from 'clsx';
import {useLocalPathname} from '@docusaurus/theme-common/internal';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem, {type LinkLikeNavbarItemProps} from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem/Desktop';
import {ChevronDown} from 'lucide-react';
import {
  setPreferredFramework,
  getFrameworkFromPath,
  getPreferredFramework,
} from '@site/src/utils/frameworkPreference';

function isFrameworkPicker(items: readonly LinkLikeNavbarItemProps[]): boolean {
  // Check if all items point to framework-specific docs
  const frameworkPaths = ['/docs/angular', '/docs/react', '/docs/vue'];
  return items.every((item) => 
    frameworkPaths.some((path) => item.to?.includes(path) || item.activeBasePath?.includes(path))
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  const [preferredLabel, setPreferredLabel] = useState<string>('React');
  const isFramework = isFrameworkPicker(items);

  useEffect(() => {
    if (isFramework) {
      setPreferredLabel(capitalize(getPreferredFramework()));
    }
  }, [isFramework]);

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
  if (isFramework && !isOnDocsPage) {
    return null;
  }

  const frameworkFromPath = isFramework
    ? getFrameworkFromPath(localPathname)
    : null;
  const displayLabel = frameworkFromPath
    ? capitalize(frameworkFromPath)
    : isFramework
    ? preferredLabel
    : props.label;

  return (
    <>
      {isFramework && (
        <a
          className="navbar-framework-github-link"
          href="https://github.com/kritzeljs/kritzel"
          target="_blank"
          rel="noreferrer"
          aria-label="Kritzel on GitHub"
          title="Kritzel on GitHub">
          <img src="/img/github-framework.svg" alt="" aria-hidden="true" />
        </a>
      )}
      <div
        ref={dropdownRef}
        className={clsx('navbar__item', 'dropdown', {
          'dropdown--hoverable': !isFramework,
          'dropdown--right': position === 'right',
          'dropdown--show': showDropdown,
          'navbar-framework-picker': isFramework,
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
          label={
            <>
              {props.children ?? displayLabel}
              <ChevronDown className="navbar-dropdown-chevron" size={18} aria-hidden="true" />
            </>
          }
          onClick={(event) => {
            if (!props.to) {
              event.preventDefault();
            }
            onClick?.(event);
            if (isFramework) {
              setShowDropdown((isOpen) => !isOpen);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setShowDropdown(false);
            } else if (isFramework && e.key === ' ') {
              e.preventDefault();
              setShowDropdown((isOpen) => !isOpen);
            }
          }}>
        </NavbarNavLink>
        <ul className="dropdown__menu">
          {items.map((childItemProps, i) => {
            const handleClick = isFramework ? () => {
              const framework = getFrameworkFromPath(childItemProps.to || '');
              if (framework) {
                setPreferredFramework(framework);
              }
              setShowDropdown(false);
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
    </>
  );
}

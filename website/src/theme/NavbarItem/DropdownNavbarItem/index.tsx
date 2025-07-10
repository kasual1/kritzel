import React, { useRef, useEffect} from 'react';
import clsx from 'clsx';
import {
  isRegexpStringMatch,
  useCollapsible,
} from '@docusaurus/theme-common';
import {isSamePath, useLocalPathname} from '@docusaurus/theme-common/internal';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem';

function isItemActive(item, localPathname) {
  if (isSamePath(item.to, localPathname)) {
    return true;
  }
  if (isRegexpStringMatch(item.activeBaseRegex, localPathname)) {
    return true;
  }
  if (item.activeBasePath && localPathname.startsWith(item.activeBasePath)) {
    return true;
  }
  return false;
}

function getActiveLabel(items, localPathname) {
    const activeItem = items.find((item) => isItemActive(item, localPathname));
    return activeItem?.label;
}


export default function DropdownNavbarItem({
  items,
  position,
  className,
  onClick,
  ...props
}: Props): JSX.Element {
  const {collapsed, toggleCollapsed, setCollapsed} = useCollapsible({
    initialState: true,
  });
  const localPathname = useLocalPathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || !dropdownRef.current.contains(event.target)) {
        setCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownRef]);

  const activeLabel = getActiveLabel(items, localPathname);

  return (
    <div
      ref={dropdownRef}
      className={clsx('navbar__item', 'dropdown', 'dropdown--hoverable', {
        'dropdown--right': position === 'right',
        'dropdown--show': !collapsed,
      })}>
      <NavbarNavLink
        aria-haspopup="true"
        aria-expanded={!collapsed}
        role="button"
        href="#"
        className={clsx('navbar__link', className)}
        {...props}
        label={activeLabel ?? props.label} // Use active label or fallback
        onClick={(e) => {
          e.preventDefault();
          toggleCollapsed();
        }}>
      </NavbarNavLink>
      <ul className="dropdown__menu">
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            activeClassName="dropdown__link--active"
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}
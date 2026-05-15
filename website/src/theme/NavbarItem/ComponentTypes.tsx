import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import BlogLinkNavbarItem from './BlogLinkNavbarItem';
import DocsLinkNavbarItem from './DocsLinkNavbarItem';
import PricingLinkNavbarItem from './PricingLinkNavbarItem';

export default {
  ...ComponentTypes,
  'custom-blogLink': BlogLinkNavbarItem,
  'custom-docsLink': DocsLinkNavbarItem,
  'custom-pricingLink': PricingLinkNavbarItem,
};

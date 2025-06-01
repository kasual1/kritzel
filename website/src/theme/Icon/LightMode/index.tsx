import React, {type ReactNode} from 'react';
import type LightModeType from '@theme/Icon/LightMode';
import type {WrapperProps} from '@docusaurus/types';
import Sun from '@site/static/img/sun.svg';

type Props = WrapperProps<typeof LightModeType>;

export default function LightModeWrapper(props: Props): ReactNode {
  return (
      <Sun {...props} style={{height: '32px', width: '32px'}}/>
  );
}

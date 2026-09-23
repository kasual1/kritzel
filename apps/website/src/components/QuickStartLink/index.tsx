import React from 'react';
import Link from '@docusaurus/Link';
import {
  frameworkPaths,
  getPreferredFramework,
  subscribeToPreferredFramework,
} from '@site/src/utils/frameworkPreference';

export default function QuickStartLink(): React.ReactNode {
  const [targetPath, setTargetPath] = React.useState(() => frameworkPaths[getPreferredFramework()]);

  React.useEffect(() => {
    setTargetPath(frameworkPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => {
      setTargetPath(frameworkPaths[framework]);
    });
  }, []);

  return (
    <p>
      Take a look at the <Link to={targetPath}>Quick Start</Link> page to get started, or explore the interactive examples to see how it works in practice. I&apos;m looking forward to seeing what you create.
    </p>
  );
}
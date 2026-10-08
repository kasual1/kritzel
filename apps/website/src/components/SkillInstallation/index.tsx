import React, {useId, useState} from 'react';

export default function SkillInstallation({children}: {children: React.ReactNode}): React.ReactNode {
  const [isVisible, setIsVisible] = useState(false);
  const guideId = useId();

  return (
    <>
      <p>
        <a
          href={`#${guideId}`}
          aria-expanded={isVisible}
          aria-controls={guideId}
          onClick={(event) => {
            event.preventDefault();
            setIsVisible((visible) => !visible);
          }}
        >
          Additionally install the kritzel skill
        </a>
      </p>
      <div id={guideId} hidden={!isVisible}>
        {children}
      </div>
    </>
  );
}

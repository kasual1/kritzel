import { useEffect, useState } from "react";
import { HELLO_DOT, HELLO_EXCLAMATION, HELLO_STROKES } from "./paths";
import { TOOLS } from "./tools";
import styles from "./styles.module.css";

const DEVICES = [
  { device: "desktop", label: "Desktop" },
  { device: "tablet", label: "Tablet" },
  { device: "phone", label: "Mobile" },
] as const;

/** How long each device is shown before morphing into the next one. */
const DEVICE_INTERVAL = 2800;

/** Tools past this index are tucked away on the phone, the way a narrow toolbar would trim them. */
const PHONE_TOOLS = 5;

/** A single device that morphs between desktop, tablet and phone, each running the same mock editor. */
export default function DeviceShowcase() {
  const [index, setIndex] = useState(0);
  const { device, label } = DEVICES[index];

  useEffect(() => {
    const interval = window.setInterval(() => setIndex((current) => (current + 1) % DEVICES.length), DEVICE_INTERVAL);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      role="img"
      aria-label="The Kritzel editor on desktop, tablet and mobile"
      className={`${styles.showcaseMedia} ${styles.devices}`}
    >
      <span className={styles.mediaBadge}>{label}</span>
      <div className={styles.device} data-device={device}>
        <div className={styles.deviceFrame}>
          <div className={styles.deviceScreen}>
            <svg
              className={styles.deviceDrawing}
              viewBox="0 0 260 120"
              fill="none"
              stroke="#4a7dff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {HELLO_STROKES.map((stroke) => (
                <path key={stroke.d} d={stroke.d} />
              ))}
              <path d={HELLO_EXCLAMATION} />
              <path d={HELLO_DOT} />
            </svg>
            <div className={styles.deviceToolbar}>
              {TOOLS.map((tool, toolIndex) => (
                <span
                  key={tool.label}
                  className={styles.deviceTool}
                  data-selected={toolIndex === 0 ? "true" : undefined}
                  data-overflow={toolIndex >= PHONE_TOOLS ? "true" : undefined}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {tool.icon}
                  </svg>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

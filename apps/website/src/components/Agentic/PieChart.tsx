import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./styles.module.css";

export default function PieChart({ fallback }: { fallback: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (status !== "fallback") return;
    const scene = hostRef.current?.parentElement;
    const chart = scene?.querySelector("svg g");
    if (!scene || !chart) return;
    const updateBounds = () => {
      const frame = scene.getBoundingClientRect();
      if (!frame.width || !frame.height) return;
      const rect = chart.getBoundingClientRect();
      setBounds({
        left: (rect.left - frame.left) / frame.width * 100,
        top: (rect.top - frame.top) / frame.height * 100,
        width: rect.width / frame.width * 100,
        height: rect.height / frame.height * 100,
      });
    };
    const observer = new ResizeObserver(updateBounds);
    observer.observe(scene);
    updateBounds();
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 769px)");
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const update = () => {
      dispose?.();
      dispose = undefined;
      if (motion.matches || !desktop.matches) {
        setStatus("fallback");
        return;
      }
      setStatus("loading");

      void import("three").then((THREE) => {
        if (cancelled || motion.matches || !desktop.matches || dispose) return;

        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch (error) {
          console.warn("Unable to render the 3D pie chart; using the static chart.", error);
          setStatus("fallback");
          return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.15, -1.15, 0.1, 20);
        camera.position.set(3, 4.5, 5);
        camera.lookAt(0, 0.08, 0);
        camera.updateMatrixWorld();
        const projectedVerticalScale = new THREE.Vector3(0, 1, 0)
          .transformDirection(camera.matrixWorldInverse).y;
        let depth = 0.22;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 2));
        const light = new THREE.DirectionalLight(0xffffff, 3);
        light.position.set(-3, 6, 4);
        scene.add(light);

        const materials = [
          new THREE.MeshStandardMaterial({ color: "#4a7dff", roughness: 0.65 }),
          new THREE.MeshStandardMaterial({ color: "#a3bcff", roughness: 0.65 }),
          new THREE.MeshStandardMaterial({ color: "#7398f0", roughness: 0.65 }),
        ];
        const slices = materials.map((material) => {
          const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
          scene.add(mesh);
          return mesh;
        });

        const draw = (progress: number) => {
          const angle = progress * Math.PI * 2;
          const boundaries = [0, Math.PI * 1.5, Math.PI * 1.9, Math.PI * 2];
          slices.forEach((slice, index) => {
            const start = boundaries[index];
            const end = Math.min(angle, boundaries[index + 1]);
            slice.visible = end > start;
            if (!slice.visible) return;
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(Math.cos(start), Math.sin(start));
            shape.absarc(0, 0, 1, start, end, false);
            shape.lineTo(0, 0);
            slice.geometry.dispose();
            slice.geometry = new THREE.ExtrudeGeometry(shape, {
              depth,
              bevelEnabled: false,
              curveSegments: 64,
            });
            slice.rotation.x = -Math.PI / 2;
          });
          renderer.render(scene, camera);
        };

        let progress = 0;
        const resize = () => {
          if (host.clientHeight === 0) return;
          depth = 0.22 + 30 * (camera.top - camera.bottom)
            / (host.clientHeight * projectedVerticalScale);
          renderer.setSize(host.clientWidth, host.clientHeight);
          // Use the completed chart's projected geometry, not the canvas's transparent margins.
          draw(1);
          scene.updateMatrixWorld(true);
          const point = new THREE.Vector3();
          let left = Infinity;
          let top = Infinity;
          let right = -Infinity;
          let bottom = -Infinity;
          slices.forEach((slice) => {
            const positions = slice.geometry.getAttribute("position");
            for (let index = 0; index < positions.count; index += 1) {
              point.fromBufferAttribute(positions, index).applyMatrix4(slice.matrixWorld).project(camera);
              const x = (point.x + 1) * 50;
              const y = (1 - point.y) * 50;
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
          });
          left = Math.max(0, left);
          top = Math.max(0, top);
          right = Math.min(100, right);
          bottom = Math.min(100, bottom);
          setBounds({ left, top, width: right - left, height: bottom - top });
          draw(progress);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();
        setStatus("ready");

        let frame = 0;
        const start = performance.now() + 300;
        const animate = (time: number) => {
          const elapsed = Math.max(0, Math.min(1, (time - start) / 1500));
          progress = elapsed * elapsed * (3 - 2 * elapsed);
          draw(progress);
          if (elapsed < 1) frame = window.requestAnimationFrame(animate);
        };
        frame = window.requestAnimationFrame(animate);

        const contextLost = (event: Event) => {
          event.preventDefault();
          console.warn("The 3D pie chart lost its WebGL context; using the static chart.");
          dispose?.();
          dispose = undefined;
          setStatus("fallback");
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        dispose = () => {
          window.cancelAnimationFrame(frame);
          observer.disconnect();
          renderer.domElement.removeEventListener("webglcontextlost", contextLost);
          slices.forEach((slice) => slice.geometry.dispose());
          materials.forEach((material) => material.dispose());
          renderer.dispose();
          renderer.domElement.remove();
        };
      }, (error: unknown) => {
        if (!cancelled) {
          console.error("Unable to load Three.js; using the static pie chart.", error);
          setStatus("fallback");
        }
      });
    };

    update();
    motion.addEventListener("change", update);
    desktop.addEventListener("change", update);
    return () => {
      cancelled = true;
      dispose?.();
      motion.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className={styles.pieChartScene} aria-hidden="true">
      <div ref={hostRef} className={styles.pieChartWebGL} />
      {status === "fallback" && fallback}
      {bounds && (
        <span
          className={styles.pieChartSelection}
          style={{
            left: `${bounds.left}%`,
            top: `${bounds.top}%`,
            width: `${bounds.width}%`,
            height: `${bounds.height}%`,
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import styles from "./styles.module.css";

/** Rose shades, one picked at random for each heart. */
const COLORS = ["#f43f5e", "#fb7185", "#fda4af"];

/** The most hearts in the air at once; a new one only spawns once an earlier one has faded. */
const MAX_HEARTS = 14;

/** How many extra, much faster hearts bubble up per click on the tile. */
const CLICK_HEARTS = 5;

/** Random number in [min, max). */
const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Eases from 0 to 1 with a slight overshoot, so a heart pops in. */
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

/**
 * Three.js hearts that slowly bubble up from behind the skill tile, so the bot looks like it is in love, with
 * a few more shooting up for every click on the tile. Rendered inside the tile's anchor and animated only while on screen; with reduced motion or without
 * WebGL nothing is drawn.
 */
export default function HeartBubbles() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const tile = host?.parentElement;
    if (!host || !tile) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const update = () => {
      dispose?.();
      dispose = undefined;
      if (motion.matches) return;

      void import("three").then((THREE) => {
        if (cancelled || motion.matches || dispose) return;

        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch (error) {
          console.warn("Unable to render the skill tile's hearts.", error);
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        host.appendChild(renderer.domElement);

        // One unit is one CSS pixel, with the origin in the middle of the canvas (set in resize).
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
        camera.position.z = 200;

        scene.add(new THREE.AmbientLight(0xffffff, 1.6));
        const light = new THREE.DirectionalLight(0xffffff, 2.2);
        light.position.set(-0.6, 1, 1.2);
        scene.add(light);

        // A plump heart, 22 by 20 units with its tip at the bottom, puffed up by a rounded bevel.
        const shape = new THREE.Shape();
        shape.moveTo(0, -10);
        shape.bezierCurveTo(-3, -6.5, -11, -2.5, -11, 3.5);
        shape.bezierCurveTo(-11, 7.5, -8, 10, -5.5, 10);
        shape.bezierCurveTo(-2.5, 10, -0.5, 8, 0, 6);
        shape.bezierCurveTo(0.5, 8, 2.5, 10, 5.5, 10);
        shape.bezierCurveTo(8, 10, 11, 7.5, 11, 3.5);
        shape.bezierCurveTo(11, -2.5, 3, -6.5, 0, -10);
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 1.5,
          bevelEnabled: true,
          bevelThickness: 2.5,
          bevelSize: 1.5,
          bevelSegments: 8,
          curveSegments: 24,
        });
        geometry.center();
        geometry.computeBoundingBox();
        const heartWidth = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x;

        const hearts = Array.from({ length: MAX_HEARTS }, (_, index) => {
          const material = new THREE.MeshStandardMaterial({ roughness: 0.4, transparent: true });
          const mesh = new THREE.Mesh(geometry, material);
          // Apart in depth, so hearts that cross pass in front of each other instead of through.
          mesh.position.z = -index * 12;
          mesh.visible = false;
          scene.add(mesh);
          return { mesh, material, born: 0, life: 0, x: 0, y: 0, rise: 0, drift: 0, size: 0, sway: 0, swayRate: 0, phase: 0 };
        });
        type Heart = (typeof hearts)[number];

        // The tile's middle and size, the canvas's top edge and the part of it inside the viewport, in scene units.
        let tileX = 0;
        let tileY = 0;
        let tileSize = 0;
        let top = 0;
        let minX = 0;
        let maxX = 0;
        const resize = () => {
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height);
          camera.left = -width / 2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = -height / 2;
          camera.updateProjectionMatrix();
          const frame = host.getBoundingClientRect();
          const box = tile.getBoundingClientRect();
          tileX = box.left + box.width / 2 - (frame.left + frame.width / 2);
          tileY = frame.top + frame.height / 2 - (box.top + box.height / 2);
          tileSize = box.width;
          top = height / 2;
          // On phones the tile sits close to the screen edge, where hearts would be cut off.
          minX = Math.max(0, -frame.left) - width / 2;
          maxX = Math.min(width, document.documentElement.clientWidth - frame.left) - width / 2;
        };

        // Hearts start just below the tile's top edge, mostly behind it, so they peek out as they rise.
        const spawn = (heart: Heart, now: number, life: number) => {
          heart.born = now;
          heart.life = life;
          heart.size = between(24, 38);
          heart.sway = between(4, 10);
          // Keeps the whole path, from x to x + drift give or take the sway, within the visible part.
          const room = heart.sway + heart.size / 2 + 4;
          const clamp = (x: number) => Math.min(Math.max(x, minX + room), maxX - room);
          heart.x = clamp(tileX + between(-0.55, 0.55) * tileSize);
          heart.y = tileY + between(0.25, 0.45) * tileSize;
          heart.rise = (top - heart.size - heart.y) * between(0.6, 1);
          heart.drift = clamp(heart.x + (heart.x - tileX) * between(0.2, 0.6)) - heart.x;
          heart.swayRate = between(1.4, 2.4);
          heart.phase = between(0, Math.PI * 2);
          heart.material.color.set(COLORS[Math.floor(Math.random() * COLORS.length)]);
          heart.mesh.visible = true;
        };

        let clock = 0;
        let last = 0;
        let nextSpawn = 0;
        let extraHearts = 0;
        let nextExtra = 0;
        let frame = 0;
        let running = false;
        const tick = (time: number) => {
          // Only advances while running, and by at most a tenth of a second, so hearts resume where they were.
          clock += Math.max(0, Math.min((time - last) / 1000, 0.1));
          last = time;
          if (clock >= nextSpawn) {
            const heart = hearts.find((candidate) => !candidate.mesh.visible);
            if (heart) spawn(heart, clock, between(2.5, 3.4));
            nextSpawn = clock + between(0.6, 0.95);
          }
          if (extraHearts > 0 && clock >= nextExtra) {
            const heart = hearts.find((candidate) => !candidate.mesh.visible);
            if (heart) spawn(heart, clock, between(1.1, 1.6));
            extraHearts -= 1;
            nextExtra = clock + between(0.05, 0.1);
          }
          for (const heart of hearts) {
            if (!heart.mesh.visible) continue;
            const age = clock - heart.born;
            const progress = age / heart.life;
            if (progress >= 1) {
              heart.mesh.visible = false;
              continue;
            }
            const wave = Math.sin(heart.phase + age * heart.swayRate);
            const pop = progress < 0.1 ? easeOutBack(progress / 0.1) : 1;
            const fade = Math.max(0, (progress - 0.6) / 0.4);
            heart.mesh.position.x = heart.x + heart.drift * progress + wave * heart.sway * Math.min(1, progress * 4);
            heart.mesh.position.y = heart.y + heart.rise * progress;
            heart.mesh.scale.setScalar(Math.max(0.001, (heart.size / heartWidth) * pop * (1 - 0.3 * fade)));
            heart.mesh.rotation.set(0, Math.sin(heart.phase * 2 + age * 1.3) * 0.5, -wave * 0.2);
            heart.material.opacity = 1 - fade;
          }
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(tick);
        };
        const start = () => {
          if (running) return;
          running = true;
          last = performance.now();
          frame = window.requestAnimationFrame(tick);
        };
        const stop = () => {
          running = false;
          window.cancelAnimationFrame(frame);
        };

        // The anchor itself ignores the pointer, so this only fires for clicks on the tile inside it.
        const onClick = () => {
          extraHearts = Math.min(extraHearts + CLICK_HEARTS, MAX_HEARTS);
        };
        tile.addEventListener("click", onClick);

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        // The canvas keeps its size while the layout around it moves with the window.
        window.addEventListener("resize", resize);
        resize();
        const visibilityObserver = new IntersectionObserver((entries) =>
          entries.some((entry) => entry.isIntersecting) ? start() : stop(),
        );
        visibilityObserver.observe(host);

        const contextLost = (event: Event) => {
          event.preventDefault();
          console.warn("The skill tile's hearts lost their WebGL context.");
          dispose?.();
          dispose = undefined;
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        dispose = () => {
          stop();
          tile.removeEventListener("click", onClick);
          resizeObserver.disconnect();
          window.removeEventListener("resize", resize);
          visibilityObserver.disconnect();
          renderer.domElement.removeEventListener("webglcontextlost", contextLost);
          geometry.dispose();
          hearts.forEach((heart) => heart.material.dispose());
          renderer.dispose();
          renderer.domElement.remove();
        };
      }, (error: unknown) => {
        if (!cancelled) {
          console.error("Unable to load Three.js for the skill tile's hearts.", error);
        }
      });
    };

    update();
    motion.addEventListener("change", update);
    return () => {
      cancelled = true;
      dispose?.();
      motion.removeEventListener("change", update);
    };
  }, []);

  return <div ref={hostRef} className={styles.heartBubbles} />;
}

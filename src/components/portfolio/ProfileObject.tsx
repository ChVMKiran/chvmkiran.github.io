"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

import { profile } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const MAX_ROTATE_Y = 24;
const MAX_ROTATE_X = 14;
const HOVER_ROTATE_Y = 13;
const HOVER_ROTATE_X = 8;
const DRAG_Y = 0.32;
const DRAG_X = 0.22;

const SPRING = { stiffness: 140, damping: 18, mass: 0.9 } as const;
const PLANE_SPRING = { stiffness: 120, damping: 20 } as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  baseRotateY: number;
  baseRotateX: number;
  pointerType: string;
};

/**
 * Layered DOM/CSS 3D profile object (spec §5, §6, §7, §43).
 *
 * There is no 3D engine here and none is simulated — the depth is real CSS
 * perspective. Three nested elements keep the concerns apart:
 *
 *   .stage-3d      declares `perspective` and never transforms, so it can act
 *                  as the vanishing point
 *   .profile-stage rotates (pointer + drag) inside that perspective
 *   .profile-plane eight planes at different `translateZ` values
 *
 * Rotating the middle element makes those translateZ differences separate the
 * planes, which is what reads as an object rather than a picture in a frame.
 *
 * Pointer input is bound to this element only, never to the page, so moving the
 * mouse can never rotate the document (spec §6).
 */
export function ProfileObject() {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const drag = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    baseRotateY: 0,
    baseRotateX: 0,
    pointerType: "mouse",
  });

  const rotateY = useSpring(0, SPRING);
  const rotateX = useSpring(0, SPRING);
  // A little extra translation on the front plane so it outruns the layers
  // behind it — the "foreground moves more than background" cue (spec §6).
  const planeX = useSpring(0, PLANE_SPRING);
  const planeY = useSpring(0, PLANE_SPRING);

  const settle = () => {
    rotateY.set(0);
    rotateX.set(0);
    planeX.set(0);
    planeY.set(0);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (drag.current.active) {
      const dx = event.clientX - drag.current.startX;
      const dy = event.clientY - drag.current.startY;

      rotateY.set(
        clamp(drag.current.baseRotateY + dx * DRAG_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y),
      );

      // On touch, vertical movement belongs to the page: `touch-action: pan-y`
      // hands it to the scroller and cancels this gesture. Horizontal drag is
      // the only axis we claim, so vertical scrolling is never trapped
      // (spec §6, §36).
      if (drag.current.pointerType === "mouse") {
        rotateX.set(
          clamp(drag.current.baseRotateX - dy * DRAG_X, -MAX_ROTATE_X, MAX_ROTATE_X),
        );
      }
      return;
    }

    // Idle hover: cursor position within the object maps to a restrained tilt.
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(nx * 2 * HOVER_ROTATE_Y);
    rotateX.set(-ny * 2 * HOVER_ROTATE_X);
    planeX.set(nx * 14);
    planeY.set(ny * 14);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseRotateY: rotateY.get(),
      baseRotateX: rotateX.get(),
      pointerType: event.pointerType,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    // Springing back to rest is the deceleration — the object never keeps
    // spinning once released (spec §6).
    settle();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="flex w-full justify-center lg:justify-end">
      {/* Vanishing point. Sized to the object so the perspective origin sits on
          it, and never transformed — a transform here would flatten the scene. */}
      <div className="stage-3d w-full max-w-[430px]">
        {/* The whole object is hidden from assistive technology on purpose. The
            subject is already announced by the hero's `h1` (which carries the
            name in `sr-only` text), so exposing the front plane's alt text would
            announce the same person twice. When `profile.image` is set, its alt
            is therefore intentionally never read out — that is the design, not
            a missing binding. Everything in here is pointer-driven decoration,
            and nothing inside is focusable. */}
        <motion.div
          ref={stageRef}
          aria-hidden="true"
          data-cursor="hover"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => !drag.current.active && settle()}
          style={reduced ? undefined : { rotateX, rotateY }}
          animate={reduced ? undefined : { y: [0, -7, 0], scale: [1, 1.015, 1] }}
          transition={
            reduced
              ? undefined
              : { duration: 9, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
          }
          className={[
            "profile-stage layer-3d",
            dragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
        >
          {/* 1 — ambient glow (one soft source, not a halo) */}
          <span className="profile-glow" />

          {/* 2 — orbit arcs: thin hairlines, opacity tied to the atmosphere */}
          <span className="profile-orbit profile-orbit--inner" />
          <span className="profile-orbit profile-orbit--outer" />

          {/* 3 — rear depth plane */}
          <span
            className="profile-plane profile-depth-back"
            style={{ transform: "translateZ(-40px)" }}
          />

          {/* 4 — cast shadow */}
          <span className="profile-plane profile-shadow" />

          {/* 5 — translucent frame */}
          <span
            className="profile-plane profile-frame"
            style={{ transform: "translateZ(12px)" }}
          />

          {/* 6 — front plane: the photograph, or an honest typographic stand-in */}
          <motion.span
            style={reduced ? undefined : { x: planeX, y: planeY, z: 26 }}
            className="profile-plane profile-image-plane"
          >
            {profile.image ? (
              // Dimensions come from the static import, so the 4:5 stage below
              // can crop to its own aspect without the intrinsic size being
              // restated — and silently drifting — here.
              <Image
                src={profile.image.src}
                alt={profile.image.alt}
                priority
                sizes="(max-width: 1024px) 78vw, 430px"
                className="h-full w-full object-cover"
              />
            ) : (
              /*
               * No photograph has been supplied. Rather than substitute stock
               * imagery or invent a person (spec §5, §46), this plane renders a
               * typographic panel built from real profile data — and says so,
               * in the mono metadata voice the rest of the site uses.
               */
              <span className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
                <span className="flex items-start justify-between">
                  <span className="t-meta">Profile visual</span>
                  <span className="t-meta">Pending</span>
                </span>

                <span className="flex flex-1 items-center justify-center">
                  <span className="font-display text-[clamp(3.5rem,9vw,5.5rem)] font-semibold leading-none tracking-[-0.05em] text-fg/90">
                    CK
                  </span>
                </span>

                <span className="block space-y-1.5">
                  <span className="block h-px w-full bg-line-strong" />
                  <span className="t-label block">{profile.name}</span>
                  <span className="t-label block text-fg-faint">{profile.location}</span>
                </span>
              </span>
            )}
          </motion.span>

          {/* 7 — specular highlight sweep */}
          <motion.span
            style={reduced ? undefined : { x: planeX, y: planeY, z: 28 }}
            className="profile-plane profile-highlight"
          />

          {/* 8 — corner depth markers */}
          <span className="profile-marker" style={{ left: -5, top: -5 }} />
          <span className="profile-marker" style={{ right: -5, top: -5 }} />
          <span className="profile-marker" style={{ left: -5, bottom: -5 }} />
          <span className="profile-marker" style={{ right: -5, bottom: -5 }} />
        </motion.div>
      </div>
    </div>
  );
}

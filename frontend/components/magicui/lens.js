"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";

export function Lens({
  children,
  zoomChildren,
  zoomFactor = 1,
  lensSize = 240,
  isStatic = false,
  position = { x: 0, y: 0 },
  defaultPosition,
  duration = 0.15,
  lensColor = "black",
  ariaLabel = "Zoom Area",
}) {
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(position.x);
  const mouseY = useMotionValue(position.y);

  const containerRef = useRef(null);

  const handleMouseEnter = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    setIsHovering(true);
  }, [mouseX, mouseY]);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") setIsHovering(false);
  }, []);

  // clip-path circle — vector clipping, no GPU texture rasterization
  const clipPath = useMotionTemplate`circle(${lensSize / 2}px at ${mouseX}px ${mouseY}px)`;

  // Glass ring position
  const ringLeft = useTransform(mouseX, v => v - lensSize / 2);
  const ringTop = useTransform(mouseY, v => v - lensSize / 2);

  const LensContent = useMemo(() => {
    return (
      <>
        {/* Clipped content — revealed through clip-path circle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className="lens-zoom-content"
          style={{
            clipPath,
            WebkitClipPath: clipPath,
            zIndex: 50,
          }}
        >
          {zoomChildren || children}
        </motion.div>

        {/* Glass lens ring overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className="lens-glass-ring"
          style={{
            position: "absolute",
            left: ringLeft,
            top: ringTop,
            width: lensSize,
            height: lensSize,
            zIndex: 51,
          }}
        >
          <div className="lens-glass-shine" />
        </motion.div>
      </>
    );
  }, [clipPath, ringLeft, ringTop, lensSize, children, zoomChildren, duration]);

  return (
    <div
      ref={containerRef}
      className="lens-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {children}
      {isStatic || defaultPosition ? (
        LensContent
      ) : (
        <AnimatePresence mode="popLayout">
          {isHovering && LensContent}
        </AnimatePresence>
      )}
    </div>
  );
}

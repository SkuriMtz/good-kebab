"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import "./TrueFocus.css";

type Props = {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
  /** Avisa qué palabra está en foco, para acompañarla con otro texto. */
  onFocusChange?: (index: number) => void;
};

type Variables = CSSProperties & Record<`--${string}`, string>;

/**
 * TrueFocus de React Bits: un marco que va enfocando cada palabra mientras
 * las demás se ven borrosas. Cambios para Atendel:
 * - Al pasar el mouse por una palabra, el marco se queda en ella.
 * - Solo se mueve mientras está en pantalla.
 * - Con "reducir movimiento", nada se desenfoca ni avanza solo.
 * - El marco se vuelve a medir si cambia el tamaño de la pantalla.
 */
export default function TrueFocus({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "green",
  glowColor = "rgba(0, 255, 0, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = "",
  onFocusChange,
}: Props) {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);
  const [visible, setVisible] = useState(false);
  const [quieto, setQuieto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // La primera vez el marco aparece en su lugar, sin viajar desde la esquina
  const saltar = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoplay = !manualMode && !quieto && !pausado && visible;
  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      },
      (animationDuration + pauseBetweenAnimations) * 1000,
    );
    return () => clearInterval(interval);
  }, [autoplay, animationDuration, pauseBetweenAnimations, words.length]);

  const medir = useCallback(() => {
    const word = currentIndex === null || currentIndex < 0 ? null : wordRefs.current[currentIndex];
    if (!word || !containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = word.getBoundingClientRect();
    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex]);

  useEffect(() => {
    medir();
    onFocusChange?.(currentIndex);
  }, [medir, currentIndex, onFocusChange]);

  // Si cambia el ancho (o termina de cargar la letra), el marco se reacomoda
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => medir());
    ro.observe(el);
    document.fonts?.ready.then(() => medir());
    return () => ro.disconnect();
  }, [medir]);

  useEffect(() => {
    if (focusRect.width > 0) saltar.current = false;
  }, [focusRect]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) setLastActiveIndex(index);
    else setPausado(true);
    setCurrentIndex(index);
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      if (lastActiveIndex !== null) setCurrentIndex(lastActiveIndex);
    } else setPausado(false);
  };

  const duracion = quieto || saltar.current ? 0 : animationDuration;
  const colores: Variables = { "--border-color": borderColor, "--glow-color": glowColor };

  return (
    <div className={`focus-container ${className}`} ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={`focus-word ${manualMode ? "manual" : ""} ${isActive && !manualMode ? "active" : ""}`}
            style={{
              filter: isActive || quieto ? "blur(0px)" : `blur(${blurAmount}px)`,
              ...colores,
              transition: `filter ${quieto ? 0 : animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="focus-frame"
        aria-hidden="true"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 && focusRect.width > 0 ? 1 : 0,
        }}
        transition={{ duration: duracion }}
        style={colores}
      >
        <span className="focus-corner focus-corner--tl" />
        <span className="focus-corner focus-corner--tr" />
        <span className="focus-corner focus-corner--bl" />
        <span className="focus-corner focus-corner--br" />
      </motion.div>
    </div>
  );
}

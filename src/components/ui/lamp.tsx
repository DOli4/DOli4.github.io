import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style lamp glow, re-skinned for ANOMALY: the slate/cyan of the
 * original is swapped for the site's void (#05060a) and its exact cyan
 * (#35e6ff), and the full-screen hero is compressed into a header band so it
 * can sit above dashboard sections rather than own the page.
 */
export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex h-[46vh] min-h-[340px] flex-col items-center justify-center overflow-hidden bg-[#05060a] w-full z-0",
        className,
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        <motion.div
          initial={{ opacity: 0.3, width: "12rem" }}
          whileInView={{ opacity: 0.6, width: "26rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-40 overflow-visible w-[26rem] bg-gradient-conic from-[#35e6ff] via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-[#05060a] h-32 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-32 h-[100%] left-0 bg-[#05060a] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.3, width: "12rem" }}
          whileInView={{ opacity: 0.6, width: "26rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-40 w-[26rem] bg-gradient-conic from-transparent via-transparent to-[#35e6ff] [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-32 h-[100%] right-0 bg-[#05060a] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-[#05060a] h-32 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-36 w-full translate-y-10 scale-x-150 bg-[#05060a] blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-36 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-28 w-[24rem] -translate-y-1/2 rounded-full bg-[#35e6ff] opacity-20 blur-3xl"></div>
        <motion.div
          initial={{ width: "6rem" }}
          whileInView={{ width: "13rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-28 w-52 -translate-y-[4.5rem] rounded-full bg-[#35e6ff]/40 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "12rem" }}
          whileInView={{ width: "26rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 w-[26rem] -translate-y-[5.5rem] bg-[#35e6ff]"
        ></motion.div>
        <div className="absolute inset-auto z-40 h-36 w-full -translate-y-[10.5rem] bg-[#05060a]"></div>
      </div>

      <div className="relative z-50 flex -translate-y-44 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};

/** Drop-in page header: lamp glow + eyebrow + big title. */
export function LampHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0.5, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="flex flex-col items-center text-center"
      >
        <p className="lamp-eyebrow">{eyebrow}</p>
        <h1 className="lamp-title">{title}</h1>
        {sub && <p className="lamp-sub">{sub}</p>}
      </motion.div>
    </LampContainer>
  );
}

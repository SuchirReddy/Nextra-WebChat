"use client";

import { motion } from "framer-motion";

export const TypingIndicator = ({ usernames }: { usernames: string[] }) => {
  if (usernames.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 text-xs text-muted-foreground">
      <span>{usernames.join(", ")} typing</span>
      <span className="ml-2 inline-flex gap-1 align-middle">
        {[0, 1, 2].map((idx) => (
          <motion.span
            key={idx}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.15 }}
          />
        ))}
      </span>
    </div>
  );
};

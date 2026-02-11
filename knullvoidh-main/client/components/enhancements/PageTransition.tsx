import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
    children: React.ReactNode;
}

/** Wraps a page with a smooth fade + slide-up entrance and exit animation. */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;

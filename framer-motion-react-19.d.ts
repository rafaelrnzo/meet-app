import * as React from 'react';
import { HTMLMotionProps } from 'framer-motion';

declare module 'react' {
    interface IntrinsicAttributes {
        initial?: any;
        animate?: any;
        exit?: any;
        whileHover?: any;
        whileTap?: any;
        whileDrag?: any;
        whileFocus?: any;
        whileInView?: any;
        layout?: any;
        layoutId?: string;
        transition?: any;
        variants?: any;
        custom?: any;
        style?: any;
        viewport?: any;
        onViewportEnter?: any;
        onViewportLeave?: any;
        onAnimationStart?: any;
        onAnimationComplete?: any;
        onUpdate?: any;
        onDragStart?: any;
        onDrag?: any;
        onDragEnd?: any;
        onDirectionLock?: any;
        drag?: any;
        dragControls?: any;
        dragListener?: any;
        dragConstraints?: any;
        dragElastic?: any;
        dragMomentum?: any;
        dragPropagation?: any;
        dragSnapToOrigin?: any;
        _dragX?: any;
        _dragY?: any;
    }
}

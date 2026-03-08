import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { clsx } from 'clsx';

interface InfoTipProps {
    title: string;
    content: string;
    className?: string;
    panelClassName?: string;
}

export function InfoTip({ title, content, className, panelClassName }: InfoTipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!rootRef.current) return;
            const target = event.target as Node;
            if (!rootRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    return (
        <div ref={rootRef} className={clsx('relative', className)}>
            <button
                type="button"
                aria-label={`Show info about ${title}`}
                onClick={() => setIsOpen(v => !v)}
                className="w-7 h-7 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center active:scale-95 transition-transform"
            >
                <Info className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className={clsx(
                            'absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-xl z-40',
                            panelClassName
                        )}
                        role="dialog"
                        aria-label={title}
                    >
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                                    aria-label="Close info"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{content}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

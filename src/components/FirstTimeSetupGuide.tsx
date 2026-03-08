import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FirstTimeSetupGuideProps {
    hasProducts: boolean;
    hasStock: boolean;
    hasSales: boolean;
}

const STORAGE_KEY = 'shortie_setup_guide_dismissed';

export function FirstTimeSetupGuide({ hasProducts, hasStock, hasSales }: FirstTimeSetupGuideProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) === '1';
        setDismissed(saved);
    }, []);

    const steps = useMemo(() => ([
        {
            id: 'add-product',
            done: hasProducts,
            title: 'Add your first product',
            description: 'Create items you want to sell.',
            to: '/inventory?add=1',
            action: 'Add Product',
        },
        {
            id: 'restock',
            done: hasStock,
            title: 'Restock inventory',
            description: 'Add stock so products can be sold in POS.',
            to: '/inventory?restock=1',
            action: 'Restock',
        },
        {
            id: 'record-sale',
            done: hasSales,
            title: 'Record your first sale',
            description: 'Use POS to complete your first transaction.',
            to: '/pos',
            action: 'Open POS',
        },
    ]), [hasProducts, hasSales, hasStock]);

    const completedSteps = steps.filter(s => s.done).length;
    const isCompleted = completedSteps === steps.length;

    useEffect(() => {
        if (!dismissed && !isCompleted) {
            setIsOpen(true);
        }
    }, [dismissed, isCompleted]);

    useEffect(() => {
        if (isCompleted) {
            localStorage.setItem(STORAGE_KEY, '1');
            setDismissed(true);
            setIsOpen(false);
        }
    }, [isCompleted]);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
        setIsOpen(false);
    };

    const handleReopen = () => {
        localStorage.removeItem(STORAGE_KEY);
        setDismissed(false);
        setIsOpen(true);
    };

    if (isCompleted) {
        return null;
    }

    return (
        <>
            {(dismissed || !isOpen) && (
                <button
                    type="button"
                    onClick={handleReopen}
                    className="fixed bottom-24 right-4 z-30 bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-blue-200 font-semibold text-sm active:scale-95 transition-transform"
                >
                    Setup Guide
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-5 pb-4 border-b border-gray-100">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            First-Time Setup
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Let’s set up your stall</h2>
                                        <p className="text-sm text-gray-500 mt-1">{completedSteps}/3 completed</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDismiss}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                                        aria-label="Dismiss setup guide"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-3">
                                {steps.map((step) => (
                                    <div key={step.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                {step.done ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                                                </div>
                                            </div>
                                            {!step.done && (
                                                <Link
                                                    to={step.to}
                                                    className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    {step.action}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

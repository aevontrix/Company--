'use client';

import { LoadingOverlay } from './LoadingSpinner';

/**
 * Full-screen loading state for page transitions
 */
export default function LoadingScreen({
  message = 'Загрузка...',
}: {
  message?: string;
}) {
  return <LoadingOverlay message={message} />;
}

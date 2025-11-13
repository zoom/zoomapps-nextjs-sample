/**
 * Legacy Zoom App component - now delegates to the refactored container
 * Kept for backward compatibility
 */

import ZoomAppContainer from "@/components/zoom/zoom-app-container";

export default function ZoomAppPage() {
  return <ZoomAppContainer />;
}

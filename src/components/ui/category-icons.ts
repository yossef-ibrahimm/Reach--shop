import { createElement } from 'react';
import {
  Battery,
  Bell,
  BellRing,
  Cable,
  CircuitBoard,
  Cloud,
  Cpu,
  Disc,
  FireExtinguisher,
  Flame,
  Hand,
  Layers,
  Lightbulb,
  PowerOff,
  ScanLine,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';

/** Category slug → lucide icon (D-032). Fallback: Layers. */
const categoryIcons: Record<string, LucideIcon> = {
  'control-panels': Cpu,
  'smoke-detectors': Cloud,
  'heat-detectors': Thermometer,
  'multi-sensor-detectors': Layers,
  'manual-call-points': Hand,
  sirens: BellRing,
  bells: Bell,
  'remote-indicators': Lightbulb,
  'flame-detectors': Flame,
  'gas-detectors': Wind,
  'beam-detectors': ScanLine,
  'detector-bases': Disc,
  cables: Cable,
  batteries: Battery,
  extinguishers: FireExtinguisher,
  modules: CircuitBoard,
  'abort-switches': PowerOff,
};

/**
 * Renders the icon for a category slug as a plain element. Not a component —
 * module constants stay static (react-hooks/static-components) and callers
 * avoid binding components inside render.
 */
export function categoryGlyph(
  slug: string,
  props: { className?: string; strokeWidth?: number },
): React.ReactElement {
  const Icon = categoryIcons[slug] ?? Layers;
  return createElement(Icon, {
    'aria-hidden': true,
    className: props.className,
    strokeWidth: props.strokeWidth ?? 1.75,
  });
}

import React from 'react';
import {
  Activity,
  Apple,
  AlertCircle,
  Award,
  Badge,
  BadgeCheck,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CircleDot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  CircleX,
  ChartNoAxesCombined,
  ChartNoAxesColumnIncreasing,
  Copy,
  Crown,
  Dumbbell,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Gem,
  Gauge,
  Goal,
  Gift,
  Hand,
  Home,
  Hourglass,
  Image,
  Images,
  Info,
  ListChecks,
  LockKeyhole,
  Languages,
  Medal,
  MessageCircle,
  Mountain,
  Minus,
  Pause,
  PersonStanding,
  PieChart,
  Plus,
  Rocket,
  Salad,
  Scale,
  ScanLine,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  Star,
  Sun,
  Target,
  Timer,
  Trash2,
  Ticket,
  TrendingDown,
  TrendingUp,
  Trophy,
  Moon,
  UserPlus,
  Users,
  Utensils,
  Waypoints,
  Wheat,
  Zap,
  X,
} from 'lucide-react-native';

export type IconName =
  | 'activity'
  | 'analytics-outline'
  | 'add'
  | 'add-circle-outline'
  | 'alert-circle'
  | 'arrow-back'
  | 'arrow-forward'
  | 'arrow-up'
  | 'barbell-outline'
  | 'body-outline'
  | 'camera-outline'
  | 'camera-scan'
  | 'chatbubble-ellipses-outline'
  | 'copy-outline'
  | 'checkmark'
  | 'checkmark-circle'
  | 'checkmark-circle-outline'
  | 'chevron-down'
  | 'chevron-forward'
  | 'chevron-up'
  | 'close'
  | 'close-circle'
  | 'close-circle-outline'
  | 'close-outline'
  | 'flame'
  | 'flame-outline'
  | 'flash-outline'
  | 'gift-outline'
  | 'hand-pointer'
  | 'home'
  | 'home-outline'
  | 'images-outline'
  | 'information-circle-outline'
  | 'document-text-outline'
  | 'eye-off-outline'
  | 'eye-outline'
  | 'language-outline'
  | 'ellipsis-horizontal'
  | 'nutrition-outline'
  | 'notifications-outline'
  | 'options-outline'
  | 'pause-outline'
  | 'people-outline'
  | 'person-add-outline'
  | 'pie-chart'
  | 'pie-chart-outline'
  | 'remove'
  | 'restaurant-outline'
  | 'search'
  | 'search-outline'
  | 'scan-outline'
  | 'share-outline'
  | 'settings'
  | 'settings-outline'
  | 'phone-portrait-outline'
  | 'sunny-outline'
  | 'moon-outline'
  | 'sparkles'
  | 'sparkles-outline'
  | 'star'
  | 'shield-checkmark-outline'
  | 'trash-outline'
  | 'ticket-outline'
  | 'trending-down'
  | 'trending-up-outline'
  | 'trophy-outline'
  | 'users'
  | 'scale-outline'
  | 'x'
  | 'badge-collection'
  | 'badge-training'
  | 'badge-consistency'
  | 'badge-nutrition'
  | 'badge-progress'
  | 'badge-spark'
  | 'badge-iron'
  | 'badge-power'
  | 'badge-club'
  | 'badge-hours'
  | 'badge-fire'
  | 'badge-week'
  | 'badge-unstoppable'
  | 'badge-calendar'
  | 'badge-meal'
  | 'badge-rhythm'
  | 'badge-master'
  | 'badge-checkin'
  | 'badge-change'
  | 'badge-sets'
  | 'badge-lock';

type IconComponent = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const iconMap: Record<IconName, IconComponent> = {
  activity: Activity,
  add: Plus,
  'add-circle-outline': CirclePlus,
  'alert-circle': AlertCircle,
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'arrow-up': ArrowUp,
  'barbell-outline': Dumbbell,
  'body-outline': PersonStanding,
  'camera-outline': Camera,
  'camera-scan': ScanLine,
  'chatbubble-ellipses-outline': MessageCircle,
  'copy-outline': Copy,
  checkmark: Check,
  'checkmark-circle': CircleCheck,
  'checkmark-circle-outline': CircleCheck,
  'chevron-down': ChevronDown,
  'chevron-forward': ChevronRight,
  'chevron-up': ChevronUp,
  close: X,
  'close-circle': CircleX,
  'close-circle-outline': CircleX,
  'close-outline': X,
  flame: Flame,
  'flame-outline': Flame,
  'flash-outline': Zap,
  'gift-outline': Gift,
  'hand-pointer': Hand,
  home: Home,
  'home-outline': Home,
  'images-outline': Images,
  'information-circle-outline': Info,
  'document-text-outline': FileText,
  'eye-off-outline': EyeOff,
  'eye-outline': Eye,
  'language-outline': Languages,
  'ellipsis-horizontal': Ellipsis,
  'nutrition-outline': Apple,
  'notifications-outline': Bell,
  'options-outline': SlidersHorizontal,
  'pause-outline': Pause,
  'people-outline': Users,
  'person-add-outline': UserPlus,
  'pie-chart': PieChart,
  'pie-chart-outline': PieChart,
  remove: Minus,
  'restaurant-outline': Utensils,
  search: Search,
  'search-outline': Search,
  'scan-outline': ScanLine,
  'share-outline': Share2,
  settings: Settings,
  'settings-outline': Settings,
  'phone-portrait-outline': Smartphone,
  'sunny-outline': Sun,
  'moon-outline': Moon,
  sparkles: Sparkles,
  'sparkles-outline': Sparkles,
  star: Star,
  'shield-checkmark-outline': ShieldCheck,
  'trash-outline': Trash2,
  'ticket-outline': Ticket,
  'trending-down': TrendingDown,
  'trending-up-outline': TrendingUp,
  'trophy-outline': Trophy,
  users: Users,
  'scale-outline': Scale,
  x: X,
  'analytics-outline': ChartNoAxesCombined,
  'badge-collection': Medal,
  'badge-training': CircleDot,
  'badge-consistency': Gauge,
  'badge-nutrition': ListChecks,
  'badge-progress': ChartNoAxesColumnIncreasing,
  'badge-spark': Rocket,
  'badge-iron': Mountain,
  'badge-power': Goal,
  'badge-club': Crown,
  'badge-hours': Hourglass,
  'badge-fire': Award,
  'badge-week': CalendarDays,
  'badge-unstoppable': Gem,
  'badge-calendar': Waypoints,
  'badge-meal': Wheat,
  'badge-rhythm': Salad,
  'badge-master': Badge,
  'badge-checkin': Target,
  'badge-change': Timer,
  'badge-sets': BadgeCheck,
  'badge-lock': LockKeyhole,
};

export function AppIcon({ name, size = 24, color = '#FFFFFF' }: { name: IconName; size?: number; color?: string }) {
  const Icon = iconMap[name];
  return <Icon size={size} color={color} strokeWidth={2.2} />;
}

export const Ionicons = AppIcon;
export const Feather = AppIcon;
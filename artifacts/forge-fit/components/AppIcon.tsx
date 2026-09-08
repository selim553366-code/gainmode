import React from 'react';
import { useColors } from '@/hooks/useColors';
import {
  Activity,
  Apple,
  AlertCircle,
  Award,
  Badge,
  BadgeCheck,
  BadgeX,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChartArea,
  CircleDot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CirclePlus,
  CircleX,
  ChartNoAxesCombined,
  ChartNoAxesColumnIncreasing,
  ContactRound,
  Copy,
  Crown,
  Dumbbell,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Flame,
  FlameKindling,
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
  OctagonX,
  Pause,
  PersonStanding,
  PieChart,
  Plus,
  Rocket,
  ScanSearch,
  Salad,
  Scale,
  ScanLine,
  Search,
  SearchCheck,
  Settings,
  Settings2,
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
  WandSparkles,
  Zap,
  X,
  SquareX,
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
  'checkmark-circle-outline': CircleCheckBig,
  'chevron-down': ChevronDown,
  'chevron-forward': ChevronRight,
  'chevron-up': ChevronUp,
  close: X,
  'close-circle': CircleX,
  'close-circle-outline': OctagonX,
  'close-outline': SquareX,
  flame: Flame,
  'flame-outline': FlameKindling,
  'flash-outline': Zap,
  'gift-outline': Gift,
  'hand-pointer': Hand,
  home: Home,
  'home-outline': Building2,
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
  'people-outline': ContactRound,
  'person-add-outline': UserPlus,
  'pie-chart': PieChart,
  'pie-chart-outline': ChartArea,
  remove: Minus,
  'restaurant-outline': Utensils,
  search: Search,
  'search-outline': SearchCheck,
  'scan-outline': ScanSearch,
  'share-outline': Share2,
  settings: Settings,
  'settings-outline': Settings2,
  'phone-portrait-outline': Smartphone,
  'sunny-outline': Sun,
  'moon-outline': Moon,
  sparkles: Sparkles,
  'sparkles-outline': WandSparkles,
  star: Star,
  'shield-checkmark-outline': ShieldCheck,
  'trash-outline': Trash2,
  'ticket-outline': Ticket,
  'trending-down': TrendingDown,
  'trending-up-outline': TrendingUp,
  'trophy-outline': Trophy,
  users: Users,
  'scale-outline': Scale,
  x: BadgeX,
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

export function AppIcon({ name, size = 24, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  const Icon = iconMap[name];
  return <Icon size={size} color={color ?? colors.foreground} strokeWidth={2.2} />;
}

export const Ionicons = AppIcon;
export const Feather = AppIcon;
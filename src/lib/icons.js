import {
  Dumbbell, BookOpen, Droplets, Moon, Code, Brain, Footprints, Leaf,
  Layers, Sparkles, Zap, FileText, Image, Eye, Target, MessageSquareText,
  CircleCheck, Repeat, Wallet, CalendarDays, Bookmark,
  Utensils, Bus, Receipt, ShoppingBag, Gamepad2, HeartPulse, CircleDollarSign, Briefcase, Laptop, Gift,
} from 'lucide-react';

export const HABIT_ICONS = {
  dumbbell: Dumbbell, book: BookOpen, droplets: Droplets, moon: Moon,
  code: Code, brain: Brain, walk: Footprints, leaf: Leaf,
};

export const LINK_ICONS = {
  layers: Layers, sparkles: Sparkles, zap: Zap, file: FileText,
  image: Image, eye: Eye, target: Target, message: MessageSquareText,
};

export const ACTIVITY = {
  task: { Icon: CircleCheck, color: 'amber' },
  habit: { Icon: Repeat, color: 'violet' },
  money: { Icon: Wallet, color: 'green' },
  event: { Icon: CalendarDays, color: 'blue' },
  link: { Icon: Bookmark, color: 'rose' },
};

export const CATEGORY_ICONS = {
  Food: Utensils, Transport: Bus, Bills: Receipt, Shopping: ShoppingBag, Fun: Gamepad2,
  Health: HeartPulse, Other: CircleDollarSign, Salary: Briefcase, Freelance: Laptop, Gift,
};

/**
 * Icon set: Iconsax (vuesax). Linear by default; pass variant="Bulk" for the active or pressed state.
 * Names keep the old ones used across the app so pages read the same.
 */
import * as React from "react";
import type { IconProps } from "iconsax-react";
export type { IconProps } from "iconsax-react";
export type IconType = React.FC<IconProps>;

const glyph = (d: string, name: string): IconType => {
  const C = ({ size = 24, color = "currentColor", variant: _v, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...(rest as React.SVGProps<SVGSVGElement>)}>
      <path d={d} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  C.displayName = name;
  return C;
};
export const Check = glyph("m5 12.5 4.2 4.2L19 7", "Check");
export const X = glyph("M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5", "X");
export const Square = glyph("M7 3.5h10a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Z", "Square");
export const GripVertical: IconType = ({ size = 24, color = "currentColor", variant: _v, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...(rest as React.SVGProps<SVGSVGElement>)}>
    {[6, 12, 18].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.5} />))}
  </svg>
);

export {
  Timer1 as AlarmClock, Warning2 as AlertTriangle, TrendDown as ArrowDownLeft, TrendUp as ArrowUpLeft,
  ArrowLeft, ArrowRight, ArrowUp, Chart as BarChart3, Notification as Bell, Notification as BellOff,
  MagicStar as Bot, Building as Building2, CalendarTick as CalendarCheck2, Calendar1 as CalendarClock, Calendar as CalendarDays,
  TickCircle as CheckCheck, TickCircle as CheckCircle2, ArrowDown2 as ChevronDown, ArrowLeft2 as ChevronLeft, ArrowRight2 as ChevronRight, ArrowUp2 as ChevronUp,
  Record as CircleDashed, MessageQuestion as CircleHelp, Clock, Import as Download, Export as Upload,
  Receipt2 as FileCog, Gallery as FileImage, ReceiptAdd as FilePlus2, DocumentText1 as FileSpreadsheet, DocumentText as FileText, DocumentCopy as Files,
  Filter, Clock as History, Home2 as House, InfoCircle as Info, Key as KeyRound, Keyboard, Element4 as LayoutDashboard, Element3 as LayoutGrid,
  Hierarchy as ListTree, Lock, Logout as LogOut, Sms as Mail, MessageText as MessageSquareText, Microphone2 as Mic, Minus, Moon,
  Brush2 as Palette, Paperclip2 as Paperclip, Edit2 as PencilLine, Call as Phone, Add as Plus, Printer, RotateLeft as RotateCcw,
  Calculator as Scale, SearchNormal1 as Search, Send2 as Send, Setting2 as Settings2, ShieldTick as ShieldCheck, MagicStar as Sparkles,
  Sun1 as Sun, TimerStart as TimerReset, Trash as Trash2, Back as Undo2, User as UserRound, People as Users, Magicpen as Wand2,
  PauseCircle, Sort,
  // extra names for v5
  Category2, FolderOpen, Wallet3, MoneyRecive, MoneySend, Bank, EmptyWallet, CardReceive, Receipt1, Messages2, Graph, ChartSquare,
  Chart, Card, MoneyChange, People, Hierarchy, StatusUp, ArrowSwapVertical, ExportCurve, TaskSquare, CalendarAdd, Setting4, Profile2User, ReceiptText, Note1, Archive, Folder2,
  TrendUp, TrendDown, MagicStar, Element3, DocumentText, TickCircle, Timer1, Calendar, Edit2, Add, ArrowLeft2, ArrowDown2,
  Global, Location, Call, Wallet2, Chart21, Activity, DocumentDownload,
} from "iconsax-react";

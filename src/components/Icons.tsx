// אייקונים מרכזיים לכל המערכת
import {
  DollarSign,
  PiggyBank,
  TrendingUp,
  FileText,
  Settings,
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  Printer,
  Download,
  Upload,
  Search,
  X,
  Home,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  TrendingDown,
  Clock,
  Phone,
  Mail,
  MapPin,
  Building2,
  Wallet,
  HandCoins,
  Repeat,
  Shield,
  AlertTriangle,
  CheckCheck,
  FileSpreadsheet,
  Wrench,
  BookOpen,
  Coins,
  CircleDollarSign,
  Ban,
  FileWarning,
  History,
  UserX,
  ArrowRightLeft,
  Landmark
} from 'lucide-react'

// גדלים סטנדרטיים
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64
}

// אייקונים לקטגוריות ראשיות
export const CategoryIcons = {
  Loans: CircleDollarSign,
  Deposits: PiggyBank,
  Donations: Coins,
  Statistics: BarChart3,
  BorrowerReport: FileText,
  AdminTools: Wrench,
  Help: BookOpen,
  Settings: Settings
}

// אייקונים לפעולות
export const ActionIcons = {
  Add: Plus,
  Edit: Edit,
  Delete: Trash2,
  View: Eye,
  Print: Printer,
  Download: Download,
  Upload: Upload,
  Search: Search,
  Close: X,
  Home: Home,
  Back: ArrowLeft,
  Save: CheckCircle,
  Cancel: XCircle
}

// אייקונים לסטטוס
export const StatusIcons = {
  Success: CheckCircle,
  Error: XCircle,
  Warning: AlertTriangle,
  Info: Info,
  Active: CheckCheck,
  Pending: Clock
}

// אייקונים לנתונים כספיים
export const FinanceIcons = {
  Money: DollarSign,
  Wallet: Wallet,
  Bank: Building2,
  Card: CreditCard,
  Cash: Banknote,
  Receipt: Receipt,
  Deposit: HandCoins,
  TrendUp: TrendingUp,
  TrendDown: TrendingDown,
  Chart: PieChart
}

// אייקונים לאנשים
export const PeopleIcons = {
  User: Users,
  Guarantor: UserCheck,
  Shield: Shield
}

// אייקונים נוספים
export const MiscIcons = {
  Calendar: Calendar,
  Phone: Phone,
  Email: Mail,
  Location: MapPin,
  Repeat: Repeat,
  Spreadsheet: FileSpreadsheet,
  Alert: AlertCircle,
  Minus: Minus,
  ChevronDown: ChevronDown,
  ChevronUp: ChevronUp,
  Settings: Settings,
  Clock: Clock,
  Ban: Ban,
  FileWarning: FileWarning,
  History: History,
  UserX: UserX,
  Transfer: ArrowRightLeft,
  Bank: Landmark
}

export default {
  CategoryIcons,
  ActionIcons,
  StatusIcons,
  FinanceIcons,
  PeopleIcons,
  MiscIcons,
  iconSizes
}

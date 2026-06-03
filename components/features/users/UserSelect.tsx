import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Sesuaikan dengan path shadcn kamu
import { cn } from '@/lib/utils';

export interface SelectOption {
  code: string | number;
  label: string;
  [key: string]: any;
}

interface UserSelectProps<T extends SelectOption> {
  items: T[];
  defaultValue?: T | null;
  onValueChange: (value: T | null) => void;
  placeholder?: string;
  className?: string;
}

export function UserSelect<T extends SelectOption>({
  items,
  onValueChange,
  placeholder = 'Pilih...',
  className = '',
  defaultValue = null,
}: UserSelectProps<T>) {
  const filteredItems = items.filter((item) => item.code !== "");

  const defaultStringValue = defaultValue ? String(defaultValue.code) : undefined;

  const handleValueChange = (codeValue: string) => {
    const selectedItem = filteredItems.find((item) => String(item.code) === codeValue);
    onValueChange(selectedItem || null);
  };

  return (
    <Select
      defaultValue={defaultStringValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        className={cn(
          'w-[140px] rounded-xl border border-red-800 bg-red-50 text-sm focus:border-red-800 focus:ring-red-800',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredItems.map((item) => (
          <SelectItem
            key={item.code}
            value={String(item.code)}
            className="px-2 py-2 focus:bg-red-800 focus:text-white"
          >
            <span className="whitespace-nowrap">{item.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
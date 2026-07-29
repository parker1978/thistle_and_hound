export interface SelectOption{ value: string; label: string; }
export interface SelectProps{
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

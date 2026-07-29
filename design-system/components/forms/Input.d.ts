export interface InputProps{
  label?: string;
  placeholder?: string;
  type?: 'text'|'email'|'tel'|'password'|'number';
  value?: string;
  onChange?: (value: string) => void;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

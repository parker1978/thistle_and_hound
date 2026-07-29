export interface TabItem{ value: string; label: string; }
export interface TabsProps{ tabs: TabItem[]; active: string; onChange?: (value: string) => void; }

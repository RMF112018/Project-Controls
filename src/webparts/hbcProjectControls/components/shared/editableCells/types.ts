export interface IEditCellProps {
  rowId: number;
  field: string;
  onSave: (id: number, field: string, value: unknown) => void;
}

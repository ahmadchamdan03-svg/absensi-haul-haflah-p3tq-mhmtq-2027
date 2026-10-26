import { Persidangan } from '@/lib/persidangan';

export interface PersidanganPesertaTableProps {
  persidangan: Persidangan;
}

export interface ExcelRowItem {
  nama: string;
  no_wa: string;
}

export interface PersidanganToast {
  type: 'success' | 'error' | 'info';
  text: string;
}

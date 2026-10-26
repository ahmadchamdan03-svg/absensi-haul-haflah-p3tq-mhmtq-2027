export interface BeliStatusMsg {
  tipe: 'success' | 'error';
  text: string;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function formatTanggalIndo(isoString?: string) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' WIB'
    );
  } catch (e) {
    return isoString;
  }
}

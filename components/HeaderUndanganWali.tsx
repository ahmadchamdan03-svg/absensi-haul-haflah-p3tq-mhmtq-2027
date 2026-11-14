'use client';

import React from 'react';
import HeaderUndangan from './HeaderUndangan';

export function HeaderUndanganWali({ compact = false }: { compact?: boolean }) {
  return <HeaderUndangan titleType="UNDANGAN RESMI WALI SANTRI" compact={compact} />;
}

export default HeaderUndanganWali;

'use client';

import React, { useEffect, useState } from 'react';
import { MasterDataTable } from '@/components/master/MasterDataTable';
import { MasterItem } from '@/types/nakes';

export default function MasterProfesiPage() {
  const [items, setItems] = useState<MasterItem[]>([]);

  useEffect(() => {
    fetch('/api/master?type=profesi')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, []);

  return (
    <MasterDataTable
      title="Master Profesi Nakes Lain"
      description="Daftar rumpun profesi tenaga kesehatan lain yang terdaftar dalam komite RSUD OKU TIMUR"
      items={items}
    />
  );
}

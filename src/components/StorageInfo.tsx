// StorageInfo.tsx - Zeigt Storage Status

import React, { useState, useEffect } from 'react';
import StorageService from '../services/StorageService';
import { Database, HardDrive } from 'lucide-react';

export const StorageInfo: React.FC = () => {
  const [info, setInfo] = useState({ count: 0, totalSize: 0 });

  useEffect(() => {
    const updateInfo = async () => {
      try {
        const storageInfo = await StorageService.getStorageInfo();
        setInfo(storageInfo);
      } catch (error) {
        console.error('Failed to get storage info:', error);
      }
    };

    updateInfo();
    const interval = setInterval(updateInfo, 5000); // Update every 5s

    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="storage-info">
      <Database size={16} />
      <span>{info.count} samples</span>
      <HardDrive size={16} />
      <span>{formatSize(info.totalSize)}</span>
    </div>
  );
};

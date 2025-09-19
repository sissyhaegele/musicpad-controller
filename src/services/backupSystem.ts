// backupSystem.ts - Automatische Backups der funktionierenden Version

class BackupSystem {
  private readonly STORAGE_KEY = 'musicpad_app_backup';
  private readonly MAX_BACKUPS = 5;

  // Speichere funktionierende Version
  saveWorkingVersion(version: string, timestamp: number = Date.now()): void {
    try {
      const backups = this.getBackups();
      
      backups.unshift({
        version,
        timestamp,
        label: `Backup ${new Date(timestamp).toLocaleString()}`
      });

      // Behalte nur die letzten MAX_BACKUPS
      if (backups.length > this.MAX_BACKUPS) {
        backups.pop();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
      console.log('Working version backed up');
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  }

  // Hole alle Backups
  getBackups(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Restore spezifisches Backup
  restoreBackup(index: number): string | null {
    const backups = this.getBackups();
    if (backups[index]) {
      console.log(`Restoring backup from ${new Date(backups[index].timestamp).toLocaleString()}`);
      return backups[index].version;
    }
    return null;
  }

  // Lösche alle Backups
  clearBackups(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('All backups cleared');
  }
}

export default new BackupSystem();

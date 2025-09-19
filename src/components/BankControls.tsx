// Füge diese Buttons zur App hinzu:

<div className="bank-controls">
  <button onClick={handleSaveBank} className="save-button">
    <Save size={20} />
    Save Bank
  </button>
  
  <button onClick={handleLoadBank} className="load-button">
    <Upload size={20} />
    Load Bank
  </button>
  
  <button onClick={handleClearAll} className="clear-button">
    <Trash2 size={20} />
    Clear All
  </button>
</div>

// Styles:
.bank-controls {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.save-button, .load-button, .clear-button {
  padding: 0.75rem 1.5rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.save-button:hover {
  background: var(--accent-secondary);
  transform: translateY(-2px);
}

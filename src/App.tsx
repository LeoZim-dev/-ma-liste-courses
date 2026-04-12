/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Undo2, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  ShoppingCart,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Item {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type Action = 
  | { type: 'ADD'; item: Item }
  | { type: 'DELETE'; item: Item; index: number }
  | { type: 'TOGGLE'; id: string; prevStatus: boolean }
  | { type: 'RENAME'; id: string; prevText: string; newText: string }
  | { type: 'REORDER'; prevItems: Item[] };

interface ListItemProps {
  key?: string | number;
  item: Item;
  toggleItem: (id: string) => void;
  startEditing: (item: Item) => void;
  deleteItem: (id: string) => void;
  editingId: string | null;
  editValue: string;
  setEditValue: (val: string) => void;
  saveRename: () => void;
  setEditingId: (id: string | null) => void;
}

// Individual Item Component to handle its own drag controls
function ListItem({ 
  item, 
  toggleItem, 
  startEditing, 
  deleteItem, 
  editingId, 
  editValue, 
  setEditValue, 
  saveRename, 
  setEditingId 
}: ListItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        "group bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:shadow-lg active:scale-[1.01]",
        item.completed && "bg-gray-50/50 opacity-75"
      )}
    >
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
      >
        <GripVertical size={24} />
      </div>

      <button 
        onClick={() => toggleItem(item.id)}
        className={cn(
          "flex-shrink-0 transition-colors",
          item.completed ? "text-green-500" : "text-gray-300 hover:text-blue-500"
        )}
      >
        {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>

      <div className="flex-grow min-w-0">
        {editingId === item.id ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
              onBlur={saveRename}
              className="w-full bg-blue-50 border-none rounded-lg px-2 py-1 focus:ring-0 text-lg font-medium text-blue-900"
            />
          </div>
        ) : (
          <span 
            onClick={() => startEditing(item)}
            className={cn(
              "text-lg font-medium block truncate cursor-pointer",
              item.completed && "line-through text-gray-400"
            )}
          >
            {item.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => startEditing(item)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
          aria-label="Renommer"
        >
          <Edit3 size={18} />
        </button>
        <button 
          onClick={() => deleteItem(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="md:hidden text-gray-300">
        <ChevronRight size={16} />
      </div>
    </Reorder.Item>
  );
}

export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('shopping-list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [history, setHistory] = useState<Action[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('shopping-list', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!inputValue.trim()) return;
    const newItem: Item = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
    setHistory(prev => [...prev, { type: 'ADD', item: newItem }]);
    setInputValue('');
  };

  const deleteItem = (id: string) => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    const itemToDelete = items[index];
    setItems(prev => prev.filter(item => item.id !== id));
    setHistory(prev => [...prev, { type: 'DELETE', item: itemToDelete, index }]);
  };

  const toggleItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    setHistory(prev => [...prev, { type: 'TOGGLE', id, prevStatus: item.completed }]);
  };

  const startEditing = (item: Item) => {
    setEditingId(item.id);
    setEditValue(item.text);
  };

  const saveRename = () => {
    if (!editingId) return;
    const item = items.find(i => i.id === editingId);
    if (!item || !editValue.trim() || editValue.trim() === item.text) {
      setEditingId(null);
      return;
    }
    const prevText = item.text;
    const newText = editValue.trim();
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, text: newText } : i));
    setHistory(prev => [...prev, { type: 'RENAME', id: editingId, prevText, newText }]);
    setEditingId(null);
  };

  const handleReorder = (newItems: Item[]) => {
    // Only save history if items actually changed order
    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      setHistory(prev => [...prev, { type: 'REORDER', prevItems: items }]);
      setItems(newItems);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    switch (lastAction.type) {
      case 'ADD':
        setItems(prev => prev.filter(item => item.id !== lastAction.item.id));
        break;
      case 'DELETE':
        setItems(prev => {
          const newItems = [...prev];
          newItems.splice(lastAction.index, 0, lastAction.item);
          return newItems;
        });
        break;
      case 'TOGGLE':
        setItems(prev => prev.map(i => i.id === lastAction.id ? { ...i, completed: lastAction.prevStatus } : i));
        break;
      case 'RENAME':
        setItems(prev => prev.map(i => i.id === lastAction.id ? { ...i, text: lastAction.prevText } : i));
        break;
      case 'REORDER':
        setItems(lastAction.prevItems);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] font-sans selection:bg-blue-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ShoppingCart className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Ma Liste</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Input Section */}
        <section className="relative group">
          <button 
            onClick={addItem}
            className="absolute inset-y-0 left-2 px-2 flex items-center text-gray-400 hover:text-blue-500 transition-colors z-10"
            aria-label="Ajouter"
          >
            <Plus size={24} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Ajouter un article..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
          />
        </section>

        {/* List Section */}
        <section className="space-y-4">
          {items.length === 0 ? (
            <AnimatePresence>
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingCart size={32} strokeWidth={1.5} />
                </div>
                <p className="text-lg font-medium">Votre liste est vide</p>
                <p className="text-sm">Commencez par ajouter des articles</p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <ListItem 
                    key={item.id}
                    item={item}
                    toggleItem={toggleItem}
                    startEditing={startEditing}
                    deleteItem={deleteItem}
                    editingId={editingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    saveRename={saveRename}
                    setEditingId={setEditingId}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </section>
      </main>

      {/* Floating Undo Button (Mobile style) */}
      <div className="fixed bottom-24 right-6 pointer-events-none z-30">
        <AnimatePresence>
          {history.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={undo}
              className="pointer-events-auto bg-white text-gray-700 px-5 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 font-semibold active:scale-95 transition-transform"
            >
              <Undo2 size={18} />
              <span className="text-sm">Annuler</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      {items.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 flex justify-around items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 z-20">
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-900 text-lg leading-none">{items.length}</span>
            <span>Articles</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-600 text-lg leading-none">{items.filter(i => i.completed).length}</span>
            <span>Achetés</span>
          </div>
        </footer>
      )}
    </div>
  );
}


